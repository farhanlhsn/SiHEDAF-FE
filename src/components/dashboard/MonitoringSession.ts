import { resultStatus } from "@/components/dashboard/DashboardFormat";

/** Where the monitoring moment is: the signal card and the AI modal follow it. */
export type MonitoringPhase =
  | "idle"
  | "recording"
  | "analysing"
  | "result"
  | "timeout";

/** What the AI result modal shows; it can differ from the phase (e.g. "Detail Hasil AI"). */
export type ResultModalView = "analysing" | "result" | "timeout";

export const POLL_INTERVAL_MS = 3000;
export const POLL_MAX_ATTEMPTS = 20;
/** Every start, stop and poll request gives up after this long. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Wall-clock elapsed time: MM:SS, or H:MM:SS from one hour. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";

  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

type ResultRecord = {
  id?: number;
  resultLabel?: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
};

/** What is known about results shown before the session that is being analysed. */
export type ResultBaseline = {
  /** Id of the last labelled result. */
  previousResultId: number | null;
  /** completedAt ?? createdAt of the last labelled result when it had no id. */
  previousTimestamp: string | null;
  /** The IN_PROGRESS row a reloaded page resumed, until its result arrives. */
  sessionId: number | null;
  sessionCreatedAt: string | null;
};

export const EMPTY_BASELINE: ResultBaseline = {
  previousResultId: null,
  previousTimestamp: null,
  sessionId: null,
  sessionCreatedAt: null,
};

function resultTimestamp(data: ResultRecord) {
  return data.completedAt ?? data.createdAt ?? null;
}

function parseTime(iso: string | null | undefined) {
  const time = iso ? Date.parse(iso) : Number.NaN;

  return Number.isNaN(time) ? null : time;
}

function sameInstant(a: string, b: string) {
  const timeA = parseTime(a);

  return a === b || (timeA !== null && timeA === parseTime(b));
}

/**
 * A polled /latest is the new session's result only if it is labelled and not
 * the one we already had: a different id, not a repeat of an id-less result's
 * timestamp and, while no earlier id is known for a resumed session, that
 * session's own row or one created after it started.
 */
export function isFreshResult(
  data: ResultRecord | null | undefined,
  previousResultId: number | null | undefined,
  context: Partial<Omit<ResultBaseline, "previousResultId">> = {},
): boolean {
  if (!data || resultStatus(data.resultLabel) === "unknown") return false;

  const timestamp = resultTimestamp(data);
  if (
    context.previousTimestamp != null &&
    timestamp !== null &&
    sameInstant(timestamp, context.previousTimestamp)
  ) {
    return false;
  }

  if (previousResultId != null) return data.id !== previousResultId;

  const sessionId = context.sessionId ?? null;
  const sessionStart = parseTime(context.sessionCreatedAt);
  if (sessionId === null && sessionStart === null) return true;
  if (sessionId !== null && data.id === sessionId) return true;

  const createdAt = parseTime(data.createdAt);

  return sessionStart !== null && createdAt !== null && createdAt >= sessionStart;
}

/** The baseline after `data` was shown (first /latest or a fresh poll result). */
export function rememberResult(
  baseline: ResultBaseline,
  data: ResultRecord,
): ResultBaseline {
  if (resultStatus(data.resultLabel) !== "unknown") {
    return data.id != null
      ? { ...EMPTY_BASELINE, previousResultId: data.id }
      : {
          ...EMPTY_BASELINE,
          previousResultId: baseline.previousResultId,
          previousTimestamp: resultTimestamp(data),
        };
  }

  if (data.status?.toUpperCase() === "IN_PROGRESS") {
    return {
      ...baseline,
      sessionId: data.id ?? null,
      sessionCreatedAt: data.createdAt ?? null,
    };
  }

  return baseline;
}

export type RestartAction = "hidden" | "ready" | "busy" | "offline";

/** "Mulai monitoring lagi" is offered only while no session is running. */
export function restartAction(
  phase: MonitoringPhase,
  { deviceOnline, busy }: { deviceOnline: boolean; busy: boolean },
): RestartAction {
  if (phase === "recording" || phase === "analysing") return "hidden";
  if (!deviceOnline) return "offline";

  return busy ? "busy" : "ready";
}

export type PollOutcome<T> =
  | { kind: "fresh"; data: T }
  | { kind: "timeout" }
  | { kind: "cancelled" };

type PollOptions<T> = {
  /** The latest record, or null for a non-200 answer; throws on network errors. */
  fetchLatest: () => Promise<T | null | undefined>;
  isFresh: (data: T) => boolean;
  wait: (ms: number) => Promise<void>;
  isCancelled: () => boolean;
  maxAttempts: number;
  intervalMs: number;
};

/**
 * Polls until a fresh result arrives: the first request goes out at once,
 * then one every `intervalMs`, at most `maxAttempts` requests. Failed
 * requests count as attempts. Nothing is fetched once `isCancelled()`.
 */
export async function pollForFreshResult<T>({
  fetchLatest,
  isFresh,
  wait,
  isCancelled,
  maxAttempts,
  intervalMs,
}: PollOptions<T>): Promise<PollOutcome<T>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (attempt > 1) await wait(intervalMs);
    if (isCancelled()) return { kind: "cancelled" };

    let data: T | null | undefined = null;
    try {
      data = await fetchLatest();
    } catch {
      data = null;
    }

    if (isCancelled()) return { kind: "cancelled" };
    if (data != null && isFresh(data)) return { kind: "fresh", data };
  }

  return { kind: "timeout" };
}

/** A request signal that times out and also aborts with `signal` (e.g. on unmount). */
export function requestSignal(
  signal?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);

  if (!signal) return timeout;
  // Older browsers without AbortSignal.any rely on the caller's own checks.
  return typeof AbortSignal.any === "function"
    ? AbortSignal.any([signal, timeout])
    : timeout;
}

/** Resolves after `ms`, or as soon as `signal` aborts (the timer is cleared). */
export function waitFor(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timerId = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });

    function done() {
      clearTimeout(timerId);
      signal.removeEventListener("abort", done);
      resolve();
    }
  });
}

export function analysisStatusLabel(status?: string | null): string {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "Selesai";
    case "IN_PROGRESS":
      return "Sedang berjalan";
    default:
      return "—";
  }
}

/** Epoch ms when a session that is still running began, or null. */
export function sessionStartFrom(
  latest: { status?: string; createdAt?: string } | null | undefined,
): number | null {
  if (latest?.status?.toUpperCase() !== "IN_PROGRESS" || !latest.createdAt) {
    return null;
  }

  const time = Date.parse(latest.createdAt);

  return Number.isNaN(time) ? null : time;
}

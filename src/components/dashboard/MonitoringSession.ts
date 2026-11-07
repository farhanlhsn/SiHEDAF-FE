import { SessionExpiredError } from "@/features/auth/session/client/ApiFetch";

import { classifyResult } from "@/components/dashboard/ResultKind";
import {
  answeredAt,
  type DeviceState,
} from "@/components/dashboard/DeviceState";

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
/** Every poll (and other read) request gives up after this long. */
export const REQUEST_TIMEOUT_MS = 10_000;
/** Start and stop may take the backend longer; they give up after this long. */
export const TOGGLE_TIMEOUT_MS = 30_000;
/** The wristband records at most 3 minutes, then the server finishes the session by itself. */
export const MAX_RECORDING_MS = 180_000;
/** While recording, /latest is checked this often for a session the wristband finished. */
export const RECORDING_WATCH_INTERVAL_MS = 5000;

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

/** Overtime longer than this without a result: tell the reader to press Stop. */
export const OVERTIME_HINT_AFTER_MS = 30_000;

export type RecordingClock =
  | { overtime: false; elapsed: string; limit: string; text: string }
  | { overtime: true; stalled: boolean };

/**
 * The recording status: "01:12 / 03:00" up to the 3-minute limit, then
 * overtime (the wristband has stopped and the result is on its way). Overtime
 * is `stalled` once it has lasted more than 30 s: the wristband may have lost
 * the session, and only Stop finishes it then.
 */
export function recordingClock(elapsedMs: number): RecordingClock {
  if (elapsedMs >= MAX_RECORDING_MS) {
    return {
      overtime: true,
      stalled: elapsedMs > MAX_RECORDING_MS + OVERTIME_HINT_AFTER_MS,
    };
  }

  const elapsed = formatElapsed(elapsedMs);
  const limit = formatElapsed(MAX_RECORDING_MS);

  return { overtime: false, elapsed, limit, text: `${elapsed} / ${limit}` };
}

type ResultRecord = {
  id?: number;
  resultLabel?: string;
  resultClass?: number;
  confidenceLevel?: number;
  status?: string;
  createdAt?: string;
  completedAt?: string;
};

/** What is known about results shown before the session that is being analysed. */
export type ResultBaseline = {
  /** Id of the last final result (any COMPLETED kind, see classifyResult). */
  previousResultId: number | null;
  /** completedAt ?? createdAt of the last final result when it had no id. */
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
 * A polled /latest is the new session's result only if it has a final result (any COMPLETED kind) and is not
 * the one we already had: a different id, not a repeat of an id-less result's
 * timestamp and, while no earlier id is known for a resumed session, that
 * session's own row or one created after it started.
 */
export function isFreshResult(
  data: ResultRecord | null | undefined,
  previousResultId: number | null | undefined,
  context: Partial<Omit<ResultBaseline, "previousResultId">> = {},
): boolean {
  if (!data || classifyResult(data) === "pending") return false;

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

  return (
    sessionStart !== null && createdAt !== null && createdAt >= sessionStart
  );
}

/** The baseline after `data` was shown (first /latest or a fresh poll result). */
export function rememberResult(
  baseline: ResultBaseline,
  data: ResultRecord,
): ResultBaseline {
  if (classifyResult(data) !== "pending") {
    return data.id != null
      ? { ...EMPTY_BASELINE, previousResultId: data.id }
      : {
          ...EMPTY_BASELINE,
          previousResultId: baseline.previousResultId,
          previousTimestamp: resultTimestamp(data),
        };
  }

  if (data.status?.toUpperCase() === "IN_PROGRESS") {
    return rememberSession(baseline, {
      id: data.id ?? null,
      createdAt: data.createdAt ?? null,
    });
  }

  return baseline;
}

/** The baseline once a running session is known: its own result will be fresh. */
export function rememberSession(
  baseline: ResultBaseline,
  session: Pick<RunningSession, "id" | "createdAt">,
): ResultBaseline {
  return {
    ...baseline,
    sessionId: session.id,
    sessionCreatedAt: session.createdAt,
  };
}

/** A session that is still recording, as the newest history row reports it. */
export type RunningSession = {
  id: number | null;
  createdAt: string | null;
  /** Epoch ms of requestedAt ?? createdAt, or null when neither parses. */
  startedAt: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

/**
 * Reads GET /measurement/history?page=1&limit=1 (newest first, any status):
 * the running session when that newest row is IN_PROGRESS, otherwise null.
 * /latest only returns COMPLETED rows, so this is how a reload resumes.
 */
export function runningSessionFrom(history: unknown): RunningSession | null {
  if (!isRecord(history) || history.code !== 200) return null;
  const page = history.data;
  if (!isRecord(page) || !Array.isArray(page.data)) return null;

  const row: unknown = page.data[0];
  if (!isRecord(row)) return null;
  if (optionalString(row.status)?.toUpperCase() !== "IN_PROGRESS") return null;

  const createdAt = optionalString(row.createdAt);

  return {
    id: typeof row.id === "number" ? row.id : null,
    createdAt: parseTime(createdAt) === null ? null : createdAt,
    startedAt: parseTime(optionalString(row.requestedAt) ?? createdAt),
  };
}

function knowsNothing(baseline: ResultBaseline) {
  return (
    baseline.previousResultId === null &&
    baseline.previousTimestamp === null &&
    baseline.sessionId === null &&
    baseline.sessionCreatedAt === null
  );
}

/**
 * The baseline after the first /latest. It only fills a baseline that knows
 * nothing yet, so a slow first answer never undoes a result remembered since.
 */
export function rememberInitial(
  baseline: ResultBaseline,
  latest: ResultRecord,
): ResultBaseline {
  return knowsNothing(baseline)
    ? rememberResult(EMPTY_BASELINE, latest)
    : baseline;
}

export type RestartAction =
  | "hidden"
  | "ready"
  | "busy"
  | "offline"
  | "no-network"
  | "device-unknown";

/** "Mulai monitoring lagi" is offered only while no session is running. */
export function restartAction(
  phase: MonitoringPhase,
  {
    device,
    busy,
    networkOnline = true,
  }: {
    device: DeviceState;
    busy: boolean;
    networkOnline?: boolean;
  },
): RestartAction {
  if (phase === "recording" || phase === "analysing") return "hidden";
  if (!networkOnline) return "no-network";
  // Still asking for the device: wait, do not claim it is offline.
  if (device === "loading") return "busy";
  // The request failed: we do not know whether the wristband is connected.
  if (device === "error") return "device-unknown";
  // A stale wristband may still start; the backend refuses it if not. One a
  // session just held ("recording") was working moments ago.
  if (device !== "online" && device !== "stale" && device !== "recording") {
    return "offline";
  }

  return busy ? "busy" : "ready";
}

/** Why "Mulai/Hentikan Monitoring" cannot be pressed, or null when it can. */
export type ToggleBlock =
  | "no-network"
  | "device-unknown"
  | "device-unavailable"
  | null;

/**
 * Only starting depends on the wristband. Stop is always possible while a
 * session runs (also in overtime): the backend's stop does not check the
 * device, and a lost wristband leaves the session open until Stop.
 */
export function toggleBlock(
  phase: MonitoringPhase,
  { device, networkOnline }: { device: DeviceState; networkOnline: boolean },
): ToggleBlock {
  if (!networkOnline) return "no-network";
  if (phase === "recording" || phase === "analysing") return null;
  // Stale may still start: the backend decides, and its refusal gets a toast.
  // Right after a session ("recording") the wristband is not judged yet.
  if (device === "online" || device === "stale" || device === "recording") {
    return null;
  }
  if (device === "error") return "device-unknown";

  return "device-unavailable";
}

/**
 * Where to go when a start/stop request timed out, from what /latest reports
 * now: a running session keeps recording; after a stop anything else is
 * being analysed; after a start anything else means it did not start.
 * After a start, `running` (the newest history row, see runningSessionFrom)
 * counts too: the real /latest only returns COMPLETED rows, so a session that
 * did start shows up there. A stop ignores it; the analysing poll decides.
 */
export function afterToggleTimeout(
  action: "start" | "stop",
  latest: { status?: string } | null | undefined,
  running: RunningSession | null = null,
): { phase: "recording" | "analysing" | "idle"; tookEffect: boolean } {
  const latestRunning = latest?.status?.toUpperCase() === "IN_PROGRESS";

  if (action === "start") {
    return running !== null || latestRunning
      ? { phase: "recording", tookEffect: true }
      : { phase: "idle", tookEffect: false };
  }

  return latestRunning
    ? { phase: "recording", tookEffect: false }
    : { phase: "analysing", tookEffect: true };
}

/**
 * How the backend answered a start/stop: done; refused (4xx: no device, the
 * wristband is offline or busy, nothing left to stop); or failed on the way
 * (5xx, including the proxy's 502), which says nothing about the wristband.
 */
export function toggleAnswer(
  status: number,
  code: unknown,
): "ok" | "refused" | "failed" {
  if (status >= 500) return "failed";

  return status >= 200 && status < 300 && code === 200 ? "ok" : "refused";
}

/**
 * Stop was refused, typically because the wristband already finished the
 * session by itself: show that result when /latest has a fresh one, else idle.
 */
export function afterStopRefused<T>(
  latest: T | null | undefined,
  isFresh: (data: T) => boolean,
): { kind: "result"; data: T } | { kind: "idle" } {
  return latest != null && isFresh(latest)
    ? { kind: "result", data: latest }
    : { kind: "idle" };
}

/**
 * After Stop's analysing poll timed out: when the newest history row still
 * records (see runningSessionFrom), the stop never reached the backend and
 * recording goes on; otherwise the result is merely late.
 */
export function afterAnalysisTimeout(
  running: RunningSession | null,
): "recording" | "timeout" {
  return running !== null ? "recording" : "timeout";
}

/** "Rekaman selesai otomatis setelah 3 menit." needs a session at least this long. */
export const AUTO_FINISH_NOTE_MIN_MS = MAX_RECORDING_MS - 10_000;

/**
 * Whether a result found without Stop (the recording watch, a refused Stop)
 * ended because the 3 minutes were up, rather than e.g. Stop in another tab.
 * The row's own requestedAt (or createdAt) to completedAt decides: one clock,
 * the backend's. Without them, `localElapsedMs` (this page's recording clock)
 * does; with neither, no claim is made.
 */
export function showsAutoFinishNote(
  result: { requestedAt?: string; createdAt?: string; completedAt?: string },
  localElapsedMs: number | null,
): boolean {
  const started = parseTime(result.requestedAt ?? result.createdAt);
  const completed = parseTime(result.completedAt);
  const elapsed =
    started !== null && completed !== null
      ? completed - started
      : localElapsedMs;

  return elapsed !== null && elapsed >= AUTO_FINISH_NOTE_MIN_MS;
}

/**
 * A backend time (e.g. a resumed session's requestedAt) on this device's
 * clock: shifted by how far this device's clock is from the Date header of
 * the answer that carried it (the Next proxy's clock), so a phone that runs
 * fast or slow still counts the recording right. Unchanged without a usable
 * header; null stays null.
 */
export function toLocalTime(
  serverTime: number | null,
  dateHeader: string | null,
  localNow: number,
): number | null {
  if (serverTime === null) return null;

  return serverTime - (answeredAt(dateHeader, localNow) - localNow);
}

/** A request that timed out or was aborted, as opposed to one that failed. */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
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
    } catch (error) {
      // The reader is being sent to /login: stop instead of retrying.
      if (error instanceof SessionExpiredError) return { kind: "cancelled" };
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

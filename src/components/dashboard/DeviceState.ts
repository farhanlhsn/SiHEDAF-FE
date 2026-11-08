import type { DataError } from "@/components/ui/FetchError";
import type { MonitoringPhase } from "@/components/dashboard/MonitoringSession";

export type DeviceState =
  | "loading"
  | "online"
  | "stale"
  | "offline"
  | "none"
  | "error"
  | "recording";

/** The backend refuses Start when the wristband was not seen for this long. */
export const STALE_AFTER_MS = 30_000;
/** How often /dashboard asks for the wristband again. */
export const DEVICE_REFRESH_MS = 30_000;
/**
 * After a session ends, the wristband is asked for again this much later: it
 * goes back to its idle poll (every 5 s), which is what updates lastSeen.
 */
export const AFTER_SESSION_RECHECK_MS = 8_000;
/**
 * The overview's re-check fires this long after the end: a second past the
 * threshold, so the request is surely sent late enough to be judged.
 */
export const AFTER_SESSION_RECHECK_DELAY_MS = AFTER_SESSION_RECHECK_MS + 1_000;

type DeviceStateInput = {
  device: { status?: string; lastSeen?: string | null } | null;
  isLoading: boolean;
  error: DataError | null;
  /**
   * Epoch ms the state is judged at (see answeredAt). null: not judged, so an
   * ONLINE device counts as online.
   */
  now: number | null;
  /** A session holds the wristband (see sessionHoldsDevice): it is not judged. */
  sessionActive?: boolean;
  /**
   * Whether the page knows if a session is still recording (after a reload,
   * the newest history row says). Until then the device is not judged: a
   * recording wristband's lastSeen is frozen, so it would look offline.
   */
  resumeChecked?: boolean;
};

/**
 * A failed request is "error", never "offline": we do not know the
 * wristband's state. ONLINE but not seen for more than 30 s (or never) is
 * "stale", as the backend's start check sees it. While a session holds the
 * wristband it is "recording": it only polls (and so updates lastSeen) while
 * idle, so during a recording the backend's lastSeen freezes and its sweep may
 * even mark it OFFLINE. Until the page knows whether a session is still
 * recording (resumeChecked) it is "loading" for the same reason.
 */
export function deviceState({
  device,
  isLoading,
  error,
  now,
  sessionActive = false,
  resumeChecked = true,
}: DeviceStateInput): DeviceState {
  if (sessionActive) return "recording";
  if (isLoading || !resumeChecked) return "loading";
  if (error) return "error";
  if (!device) return "none";
  if (device.status !== "ONLINE") return "offline";
  if (now === null) return "online";

  const seen = device.lastSeen ? Date.parse(device.lastSeen) : Number.NaN;

  return Number.isNaN(seen) || now - seen > STALE_AFTER_MS ? "stale" : "online";
}

/**
 * Whether a session holds the wristband, so its status and lastSeen say
 * nothing: while it records or is analysed, and after it ended until a device
 * answer arrives that was requested at least 8 s after the end (by then the
 * wristband is back on its idle poll). `endedAt` and `answerRequestedAt` are
 * both read from the monotonic page clock (performance.now()), so a clock
 * adjustment cannot stretch or cut the hold.
 */
export function sessionHoldsDevice({
  phase,
  endedAt,
  answerRequestedAt,
}: {
  phase: MonitoringPhase;
  /** When the last session on this page ended, or null when none has. */
  endedAt: number | null;
  /** When the current device answer was requested, or null before any answer. */
  answerRequestedAt: number | null;
}): boolean {
  if (phase === "recording" || phase === "analysing") return true;
  if (endedAt === null) return false;

  return (
    answerRequestedAt === null ||
    answerRequestedAt < endedAt + AFTER_SESSION_RECHECK_MS
  );
}

/**
 * How long from `now` until the after-session device re-check is due (never
 * negative); both times on the monotonic page clock.
 */
export function afterSessionRecheckDelay(endedAt: number, now: number): number {
  return Math.max(0, endedAt + AFTER_SESSION_RECHECK_DELAY_MS - now);
}

/**
 * A session end remembered from an earlier visit to /dashboard in this page
 * life, kept only while its hold can still matter: until 8 s after the end.
 * Later, any device request the page sends is judged anyway, and a stale end
 * would only show "recording" while the device loads.
 */
export function rememberedSessionEnd(
  endedAt: number | null,
  now: number,
): number | null {
  return endedAt !== null && now < endedAt + AFTER_SESSION_RECHECK_MS
    ? endedAt
    : null;
}

/**
 * When an answer was given, by the Date header the Next proxy route sets (the
 * frontend server's clock, not the backend's), so a wrong clock on the
 * reader's phone or laptop cannot make a wristband look stale; `fallback` (the
 * reader's clock) when the header is missing.
 */
export function answeredAt(dateHeader: string | null, fallback: number): number {
  const time = dateHeader ? Date.parse(dateHeader) : Number.NaN;

  return Number.isNaN(time) ? fallback : time;
}

/** The "Status Perangkat" card value: never claims a state we do not know. */
export const DEVICE_STATUS_LABEL: Record<DeviceState, string> = {
  loading: "Memuat...",
  online: "Terhubung",
  stale: "Koneksi tidak stabil",
  offline: "Terputus",
  none: "Belum ada perangkat",
  error: "Tidak diketahui",
  recording: "Sedang merekam",
};

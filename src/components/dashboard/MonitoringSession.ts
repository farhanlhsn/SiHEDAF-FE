import { resultStatus } from "@/components/dashboard/DashboardFormat";

/** Where the monitoring moment is: the signal card and the AI modal follow it. */
export type MonitoringPhase =
  | "idle"
  | "recording"
  | "analysing"
  | "result"
  | "timeout";

export const POLL_INTERVAL_MS = 3000;
export const POLL_MAX_ATTEMPTS = 20;

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

/** A polled /latest is the new session's result only if it is labelled and not the one we already had. */
export function isFreshResult(
  data: { id?: number; resultLabel?: string } | null | undefined,
  previousResultId: number | null | undefined,
): boolean {
  if (!data || resultStatus(data.resultLabel) === "unknown") return false;
  if (previousResultId == null) return true;

  return data.id !== previousResultId;
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

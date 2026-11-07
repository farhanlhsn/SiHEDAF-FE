import type { DataError } from "@/components/ui/FetchError";

export type DeviceState =
  | "loading"
  | "online"
  | "stale"
  | "offline"
  | "none"
  | "error";

/** The backend refuses Start when the wristband was not seen for this long. */
export const STALE_AFTER_MS = 30_000;
/** How often /dashboard asks for the wristband again. */
export const DEVICE_REFRESH_MS = 30_000;

type DeviceStateInput = {
  device: { status?: string; lastSeen?: string | null } | null;
  isLoading: boolean;
  error: DataError | null;
  /**
   * Epoch ms the state is judged at (see answeredAt). null: not judged, so an
   * ONLINE device counts as online.
   */
  now: number | null;
};

/**
 * A failed request is "error", never "offline": we do not know the
 * wristband's state. ONLINE but not seen for more than 30 s (or never) is
 * "stale", as the backend's start check sees it.
 */
export function deviceState({
  device,
  isLoading,
  error,
  now,
}: DeviceStateInput): DeviceState {
  if (isLoading) return "loading";
  if (error) return "error";
  if (!device) return "none";
  if (device.status !== "ONLINE") return "offline";
  if (now === null) return "online";

  const seen = device.lastSeen ? Date.parse(device.lastSeen) : Number.NaN;

  return Number.isNaN(seen) || now - seen > STALE_AFTER_MS ? "stale" : "online";
}

/**
 * When an answer was given, by the server's clock (the Date header) so a
 * wrong clock on the reader's phone or laptop cannot make a wristband look
 * stale; `fallback` (the reader's clock) when the header is missing.
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
};

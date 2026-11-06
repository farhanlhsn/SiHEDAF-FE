import type { DataError } from "@/components/ui/FetchError";

export type DeviceState = "loading" | "online" | "offline" | "none" | "error";

type DeviceStateInput = {
  device: { status?: string } | null;
  isLoading: boolean;
  error: DataError | null;
};

/** A failed request is "error", never "offline": we do not know the wristband's state. */
export function deviceState({
  device,
  isLoading,
  error,
}: DeviceStateInput): DeviceState {
  if (isLoading) return "loading";
  if (error) return "error";
  if (!device) return "none";
  return device.status === "ONLINE" ? "online" : "offline";
}

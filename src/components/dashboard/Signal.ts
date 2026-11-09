/**
 * Time from sample counts. The wristband samples PPG at 50 Hz (the backend
 * sends `sampling_rate: 50` to the AI), so a recording's length follows from
 * its number of samples. Nothing here counts beats: no BPM, no peaks.
 */
export const SAMPLE_RATE_HZ = 50;

/** Length of `samples` at `rate` Hz in ms, or null for less than one sample. */
export function recordingDurationMs(
  samples: number,
  rate: number = SAMPLE_RATE_HZ,
): number | null {
  if (!Number.isFinite(samples) || samples < 1) return null;
  if (!Number.isFinite(rate) || rate <= 0) return null;

  return (samples / rate) * 1000;
}

/**
 * "45 dtk", "2 mnt 58 dtk", "3 mnt". Rounds down, so a recording under 3 s
 * (the backend's "Not Enough Data") never reads as 3 s.
 */
export function formatDuration(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return null;
  if (ms > 0 && ms < 1000) return "kurang dari 1 dtk";

  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  if (minutes === 0) return `${seconds} dtk`;

  return seconds === 0 ? `${minutes} mnt` : `${minutes} mnt ${seconds} dtk`;
}

/** The "Durasi rekaman" of a PPG array at 50 Hz, or null when unknown. */
export function recordingDuration(
  data: ReadonlyArray<number> | null | undefined,
): string | null {
  return formatDuration(recordingDurationMs(data?.length ?? 0));
}

/**
 * Start, middle and end labels under a trace of `samples` points, or null
 * when there is no line to label (fewer than two points) or no usable rate.
 */
export function traceTicks(
  samples: number,
  rate: number,
): [string, string, string] | null {
  if (samples < 2) return null;

  const duration = recordingDurationMs(samples, rate);
  if (duration === null) return null;

  return [
    formatDuration(0) ?? "",
    formatDuration(duration / 2) ?? "",
    formatDuration(duration) ?? "",
  ];
}

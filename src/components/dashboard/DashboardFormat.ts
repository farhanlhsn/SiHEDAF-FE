/**
 * Small, pure formatters shared by the dashboard views. They never invent
 * values: missing or nonsensical input returns `null` so the UI can show a
 * dash instead of a made-up number.
 */

/** true = normal rhythm, false = AF, null = no result yet. */
export function isNormalResult(label?: string | null) {
  if (!label) {
    return null;
  }

  return label.toLowerCase().includes("normal");
}

/** Accepts a 0–1 ratio or a 0–100 percentage, returns e.g. "96,4%". */
export function formatConfidence(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const percent = value <= 1 ? value * 100 : value;

  if (percent > 100) {
    return null;
  }

  return `${Number(percent.toFixed(1)).toString().replace(".", ",")}%`;
}

const formatters = {
  datetime: new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  time: new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }),
  date: new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
};

/** Jakarta-time label; "datetime" and "time" end with " WIB". */
export function formatWib(
  iso?: string | null,
  style: keyof typeof formatters = "datetime",
) {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const label = formatters[style].format(date);

  return style === "date" ? label : `${label} WIB`;
}

/** Whole-number percentage of `part` in `total` (0 when there is no total). */
export function shareOf(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

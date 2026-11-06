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

export type ResultStatus = "normal" | "af" | "unknown";

/** Single source of truth for how a result label is shown. */
export function resultStatus(label?: string | null): ResultStatus {
  const normal = isNormalResult(label);

  if (normal === null) {
    return "unknown";
  }

  return normal ? "normal" : "af";
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

/**
 * Whole-number percentages of `total` for each part (largest-remainder
 * method). Any part of `total` not covered by `parts` joins the allocation as
 * an implicit last part that is not returned, so the full set sums to 100.
 */
export function splitShares(parts: ReadonlyArray<number>, total: number) {
  if (!(total > 0)) {
    return parts.map(() => 0);
  }

  const amounts = parts.map((part) => (part > 0 ? part : 0));
  const rest = total - amounts.reduce((sum, part) => sum + part, 0);
  const all = rest > 0 ? [...amounts, rest] : amounts;
  const exact = all.map((amount) => (amount / total) * 100);
  const shares = exact.map(Math.floor);
  let left = 100 - shares.reduce((sum, share) => sum + share, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const { index } of order) {
    if (left <= 0) break;
    shares[index] += 1;
    left -= 1;
  }

  return shares.slice(0, parts.length);
}

const formatCoordinate = (value: number) =>
  String(Number(value.toFixed(1)));

/**
 * SVG path for a PPG trace: x spread evenly over 0…width, highest sample at
 * `padding`, lowest at `height − padding`. Returns null when there is not
 * enough data to draw a line.
 */
export function tracePath(
  data: ReadonlyArray<number> | undefined,
  width: number,
  height: number,
  padding = 0,
) {
  if (!data || data.length < 2) return null;

  let max = -Infinity;
  let min = Infinity;
  for (const value of data) {
    if (value > max) max = value;
    if (value < min) min = value;
  }
  const range = max - min;
  const drawable = height - padding * 2;

  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y =
        range === 0 ? height / 2 : height - padding - ((value - min) / range) * drawable;
      return `${index === 0 ? "M" : "L"}${formatCoordinate(x)} ${formatCoordinate(y)}`;
    })
    .join("");
}

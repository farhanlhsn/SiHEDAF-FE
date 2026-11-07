export type ReportRange = { from: string; to: string };

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const jakartaFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

/** Jakarta calendar day (YYYY-MM-DD) of an instant. */
export function jakartaDay(date: Date): string {
  return jakartaFormat.format(date);
}

/** Calendar arithmetic on a YYYY-MM-DD day, done in UTC so local time never drifts. */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, date) + days * DAY_MS);
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function defaultReportRange(now: Date): ReportRange {
  const today = jakartaDay(now);
  return { from: addDays(today, -29), to: today };
}

export function rangeEndingOn(iso: string | undefined): ReportRange | null {
  if (!iso) return null;
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return null;
  const to = jakartaDay(time);
  return { from: addDays(to, -29), to };
}

function isRealDay(value: unknown): value is string {
  return typeof value === "string" && DAY_PATTERN.test(value) && addDays(value, 0) === value;
}

export function parseReportRange(
  params: { from?: string | string[]; to?: string | string[] },
  now: Date,
): ReportRange {
  const { from, to } = params;
  if (isRealDay(from) && isRealDay(to) && from <= to) return { from, to };
  return defaultReportRange(now);
}

export function reportHref(range?: ReportRange | null): string {
  if (!range) return "/riwayat/laporan";
  return `/riwayat/laporan?from=${range.from}&to=${range.to}`;
}

/** Calendar picker dates carry local parts, so read them locally. */
export function localDay(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function rangeFromDateRange(range?: { from?: Date; to?: Date }): ReportRange | null {
  if (!range?.from || !range.to) return null;
  return { from: localDay(range.from), to: localDay(range.to) };
}

export function toDateRange(range: ReportRange): { from: Date; to: Date } {
  const toLocal = (day: string) => {
    const [year, month, date] = day.split("-").map(Number);
    return new Date(year, month - 1, date);
  };
  return { from: toLocal(range.from), to: toLocal(range.to) };
}

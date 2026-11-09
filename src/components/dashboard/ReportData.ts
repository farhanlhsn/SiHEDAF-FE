import type { HistoryItem } from "@/components/dashboard/hooks/UseHistoryView";
import { classifyResult, isAlertKind } from "@/components/dashboard/ResultKind";
import { addDays, jakartaDay, type ReportRange } from "@/components/dashboard/ReportRange";

/** Counted from the period's own completed items, never from the API's all-time summary. */
export type ReportSummary = { total: number; af: number; flutter: number; normal: number; other: number };
export type HistoryPage = { items: HistoryItem[]; totalPages: number };
export type FetchHistoryPage = (page: number, pageSize: number, range: ReportRange) => Promise<HistoryPage>;
export type ReportData = {
  summary: ReportSummary;
  afEvents: HistoryItem[];
  /** Completed recordings inside the Jakarta period (after the day filter). */
  scanned: number;
  truncated: boolean;
};

function timeOf(item: HistoryItem): number | null {
  // The table shows completedAt ?? requestedAt, so the order follows it.
  const at = item.completedAt ?? item.requestedAt;
  if (!at) return null;
  const time = Date.parse(at);
  return Number.isNaN(time) ? null : time;
}

function newestFirst(items: HistoryItem[]): HistoryItem[] {
  const dated: Array<{ item: HistoryItem; time: number }> = [];
  const undated: HistoryItem[] = [];
  for (const item of items) {
    const time = timeOf(item);
    if (time === null) undated.push(item);
    else dated.push({ item, time });
  }
  // Array.prototype.sort is stable, so equal timestamps keep their order.
  dated.sort((a, b) => b.time - a.time);
  return [...dated.map((entry) => entry.item), ...undated];
}

function completedDay(item: HistoryItem): string | null {
  if (item.status && item.status.trim().toUpperCase() !== "COMPLETED") return null;
  if (!item.completedAt) return null;
  const time = new Date(item.completedAt);
  return Number.isNaN(time.getTime()) ? null : jakartaDay(time);
}

/**
 * `range` is the Jakarta period. The backend filters completedAt by UTC day, so
 * the query starts one day early and every item is re-checked by Jakarta day.
 */
export async function collectReport(
  fetchPage: FetchHistoryPage,
  range: ReportRange,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<ReportData> {
  const { pageSize = 50, maxPages = 10 } = options;

  const query: ReportRange = { from: addDays(range.from, -1), to: range.to };
  const first = await fetchPage(1, pageSize, query);
  const lastPage = Math.min(Math.max(first.totalPages, 1), maxPages);
  const fetched = [...first.items];

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await fetchPage(page, pageSize, query);
    fetched.push(...next.items);
  }

  // Offset pagination can return the same record on two pages; first one wins.
  const seen = new Set<HistoryItem["id"]>();
  const items = fetched
    .filter((item) => {
      if (item.id == null) return true;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .filter((item) => {
      const day = completedDay(item);
      return day !== null && day >= range.from && day <= range.to;
    });

  const summary: ReportSummary = { total: 0, af: 0, flutter: 0, normal: 0, other: 0 };
  for (const item of items) {
    const kind = classifyResult(item);
    if (kind === "af") summary.af += 1;
    else if (kind === "flutter") summary.flutter += 1;
    else if (kind === "normal") summary.normal += 1;
    else if (kind === "short" || kind === "unavailable") summary.other += 1;
    else continue;
    summary.total += 1;
  }

  return {
    summary,
    afEvents: newestFirst(items.filter((item) => isAlertKind(classifyResult(item)))),
    scanned: items.length,
    truncated: first.totalPages > maxPages,
  };
}

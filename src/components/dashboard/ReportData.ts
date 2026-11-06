import type { HistoryItem } from "@/components/dashboard/hooks/UseHistoryView";
import { isNormalResult } from "@/components/dashboard/DashboardFormat";
import type { ReportRange } from "@/components/dashboard/ReportRange";

export type ReportSummary = { totalData: number; totalAfib: number; totalNormal: number };
export type HistoryPage = { items: HistoryItem[]; totalPages: number; summary: ReportSummary };
export type FetchHistoryPage = (page: number, pageSize: number, range: ReportRange) => Promise<HistoryPage>;
export type ReportData = {
  summary: ReportSummary;
  afEvents: HistoryItem[];
  scanned: number;
  truncated: boolean;
};

function timeOf(item: HistoryItem): number | null {
  if (!item.requestedAt) return null;
  const time = Date.parse(item.requestedAt);
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

export async function collectReport(
  fetchPage: FetchHistoryPage,
  range: ReportRange,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<ReportData> {
  const { pageSize = 50, maxPages = 10 } = options;

  const first = await fetchPage(1, pageSize, range);
  const lastPage = Math.min(Math.max(first.totalPages, 1), maxPages);
  const fetched = [...first.items];

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await fetchPage(page, pageSize, range);
    fetched.push(...next.items);
  }

  // Offset pagination can return the same record on two pages; first one wins.
  const seen = new Set<HistoryItem["id"]>();
  const items = fetched.filter((item) => {
    if (item.id == null) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return {
    summary: first.summary,
    afEvents: newestFirst(items.filter((item) => isNormalResult(item.resultLabel) === false)),
    scanned: items.length,
    truncated: first.totalPages > maxPages,
  };
}

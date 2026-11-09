import assert from "node:assert/strict";
import test from "node:test";

import { collectReport } from "../components/dashboard/ReportData";
import type { FetchHistoryPage, HistoryPage } from "../components/dashboard/ReportData";
import type { ReportRange } from "../components/dashboard/ReportRange";

const range: ReportRange = { from: "2026-10-08", to: "2026-11-06" };
const queryRange: ReportRange = { from: "2026-10-07", to: "2026-11-06" };

type Item = HistoryPage["items"][number];
const done = (extra: Item): Item => ({
  status: "COMPLETED",
  completedAt: "2026-11-01T08:00:00Z",
  ...extra,
});
const normal = (id: number, extra: Item = {}) =>
  done({ id, resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.9, ...extra });
const af = (id: number, extra: Item = {}) =>
  done({ id, resultClass: 1, resultLabel: "Atrial Fibrillation", confidenceLevel: 0.8, ...extra });
const flutter = (id: number, extra: Item = {}) =>
  done({ id, resultClass: 2, resultLabel: "Atrial Flutter", confidenceLevel: 0.8, ...extra });

function recorder(build: (page: number) => HistoryPage | Error) {
  const calls: Array<[number, number, ReportRange]> = [];
  const fetchPage: FetchHistoryPage = async (page, pageSize, r) => {
    calls.push([page, pageSize, r]);
    const result = build(page);
    if (result instanceof Error) throw result;
    return result;
  };
  return { calls, fetchPage };
}

const pages = (calls: Array<[number, number, ReportRange]>) => calls.map((c) => c[0]);

test("stops at the last page the API reports", async () => {
  const { calls, fetchPage } = recorder((page) => ({
    items: [normal(page * 10), normal(page * 10 + 1)],
    totalPages: 2,
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(pages(calls), [1, 2]);
  assert.equal(report.truncated, false);
  assert.equal(report.scanned, 4);
});

test("stops at maxPages and says the report is partial", async () => {
  const { calls, fetchPage } = recorder(() => ({ items: [normal(1)], totalPages: 5 }));
  const report = await collectReport(fetchPage, range, { maxPages: 2 });
  assert.deepEqual(pages(calls), [1, 2]);
  assert.equal(report.truncated, true);
});

test("fetches once for an empty range", async () => {
  const { calls, fetchPage } = recorder(() => ({ items: [], totalPages: 0 }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(pages(calls), [1]);
  assert.deepEqual(report.afEvents, []);
  assert.equal(report.scanned, 0);
  assert.deepEqual(report.summary, { total: 0, af: 0, flutter: 0, normal: 0, other: 0 });
});

test("keeps AF and AFL results, newest first", async () => {
  const { fetchPage } = recorder(() => ({
    items: [
      normal(1, { completedAt: "2026-11-03T08:00:00Z" }),
      af(2, { completedAt: "2026-11-01T08:00:00Z" }),
      af(3, { completedAt: "2026-10-20T08:00:00Z" }),
      flutter(4, { completedAt: "2026-11-05T08:00:00Z" }),
      done({ id: 5, completedAt: "2026-11-04T08:00:00Z" }),
    ],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(report.afEvents.map((e) => e.id), [4, 2, 3]);
});

test("orders events by completedAt, the time the table shows, not by requestedAt", async () => {
  const { fetchPage } = recorder(() => ({
    items: [
      // Requested first but finished last: it is the newest event.
      af(1, { requestedAt: "2026-11-01T08:00:00Z", completedAt: "2026-11-04T08:00:00Z" }),
      af(2, { requestedAt: "2026-11-03T08:00:00Z", completedAt: "2026-11-02T08:00:00Z" }),
      af(3, { requestedAt: "2026-11-05T12:00:00Z", completedAt: "2026-11-03T12:00:00Z" }),
    ],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(report.afEvents.map((e) => e.id), [1, 3, 2]);
});

test("queries from the day before the period through its last day", async () => {
  const { calls, fetchPage } = recorder(() => ({ items: [], totalPages: 3 }));
  await collectReport(fetchPage, range, { pageSize: 50 });
  assert.equal(calls.length, 3);
  for (const [, size, r] of calls) {
    assert.equal(size, 50);
    assert.deepEqual(r, queryRange);
  }
});

test("computes the period summary from the items, never from the API", async () => {
  const { fetchPage } = recorder(() => ({
    items: [
      normal(1),
      normal(2),
      af(3),
      flutter(4),
      done({ id: 5, resultClass: 0, resultLabel: "Not Enough Data", confidenceLevel: 0 }),
      done({ id: 6, resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0 }),
      { id: 7, status: "IN_PROGRESS", completedAt: "2026-11-01T08:00:00Z" },
      done({ id: 8 }),
    ],
    totalPages: 1,
    // Extra field the real fetcher no longer provides; must be ignored.
    summary: { totalData: 99, totalAfib: 99, totalNormal: 0 },
  } as HistoryPage));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(report.summary, { total: 6, af: 1, flutter: 1, normal: 2, other: 2 });
  assert.equal(report.summary.total, report.summary.af + report.summary.flutter + report.summary.normal + report.summary.other);
});

test("only COMPLETED items count", async () => {
  const { fetchPage } = recorder(() => ({
    items: [af(1), af(2, { status: "IN_PROGRESS" }), af(3, { status: "FAILED" })],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, range);
  assert.equal(report.summary.total, 1);
  assert.deepEqual(report.afEvents.map((e) => e.id), [1]);
});

test("filters by the Jakarta day of completedAt: 6 Nov 02:30 WIB", async () => {
  const item = af(1, { completedAt: "2026-11-05T19:30:00Z" });
  const mk = () => recorder(() => ({ items: [item], totalPages: 1 }));
  const included = await collectReport(mk().fetchPage, { from: "2026-11-06", to: "2026-11-06" });
  assert.equal(included.summary.af, 1);
  const excluded = await collectReport(mk().fetchPage, { from: "2026-11-01", to: "2026-11-05" });
  assert.equal(excluded.summary.total, 0);
  assert.equal(excluded.afEvents.length, 0);
});

test("excludes 7 Nov 00:30 WIB when the period ends 6 Nov", async () => {
  const { fetchPage } = recorder(() => ({
    items: [af(1, { completedAt: "2026-11-06T17:30:00Z" }), af(2, { completedAt: "2026-11-06T16:30:00Z" })],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, { from: "2026-11-01", to: "2026-11-06" });
  assert.deepEqual(report.afEvents.map((e) => e.id), [2]);
  assert.equal(report.summary.total, 1);
});

test("items without a usable completedAt are left out", async () => {
  const { fetchPage } = recorder(() => ({
    items: [af(1, { completedAt: undefined }), af(2, { completedAt: "bukan tanggal" })],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, range);
  assert.equal(report.summary.total, 0);
});

test("scanned counts the items inside the period", async () => {
  const { fetchPage } = recorder(() => ({
    items: [normal(1), normal(2, { completedAt: "2026-09-01T00:00:00Z" })],
    totalPages: 1,
  }));
  const report = await collectReport(fetchPage, range);
  assert.equal(report.scanned, 1);
});

test("rejects when a page fails", async () => {
  const { fetchPage } = recorder((page) =>
    page === 2 ? new Error("Gagal mengambil riwayat.") : { items: [], totalPages: 3 },
  );
  await assert.rejects(collectReport(fetchPage, range), /Gagal/);
});

test("drops duplicate items across pages", async () => {
  const { fetchPage } = recorder((page) => ({
    items:
      page === 1
        ? [af(1, { completedAt: "2026-11-01T08:00:00Z" }), normal(2), af(undefined as unknown as number, { id: undefined, completedAt: "2026-10-30T08:00:00Z" })]
        : [normal(2), af(3, { completedAt: "2026-11-02T08:00:00Z" }), af(undefined as unknown as number, { id: undefined, completedAt: "2026-10-30T08:00:00Z" })],
    totalPages: 2,
  }));
  const report = await collectReport(fetchPage, range);
  assert.equal(report.scanned, 5);
  assert.deepEqual(report.afEvents.map((item) => item.id), [3, 1, undefined, undefined]);
});

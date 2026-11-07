import assert from "node:assert/strict";
import test from "node:test";

import { collectReport } from "../components/dashboard/ReportData";
import type { FetchHistoryPage, HistoryPage } from "../components/dashboard/ReportData";
import type { ReportRange } from "../components/dashboard/ReportRange";

const range: ReportRange = { from: "2026-10-08", to: "2026-11-06" };
const summary = { totalData: 10, totalAfib: 2, totalNormal: 8 };

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
    items: [{ id: page * 10 }, { id: page * 10 + 1 }],
    totalPages: 2,
    summary,
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(pages(calls), [1, 2]);
  assert.equal(report.truncated, false);
  assert.equal(report.scanned, 4);
});

test("stops at maxPages and says the report is partial", async () => {
  const { calls, fetchPage } = recorder(() => ({ items: [{ id: 1 }], totalPages: 5, summary }));
  const report = await collectReport(fetchPage, range, { maxPages: 2 });
  assert.deepEqual(pages(calls), [1, 2]);
  assert.equal(report.truncated, true);
});

test("fetches once for an empty range", async () => {
  const { calls, fetchPage } = recorder(() => ({
    items: [],
    totalPages: 0,
    summary: { totalData: 0, totalAfib: 0, totalNormal: 0 },
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(pages(calls), [1]);
  assert.deepEqual(report.afEvents, []);
  assert.equal(report.scanned, 0);
});

test("keeps only AF results, newest first, undated last", async () => {
  const { fetchPage } = recorder(() => ({
    items: [
      { id: 1, resultLabel: "Normal Rhythm", requestedAt: "2026-11-03T08:00:00Z" },
      { id: 2, resultLabel: "AF Detected", requestedAt: "2026-11-01T08:00:00Z" },
      { id: 3, resultLabel: "AF Detected" },
      { id: 4, resultLabel: "Atrial Fibrillation", requestedAt: "2026-11-05T08:00:00Z" },
      { id: 5, requestedAt: "2026-11-04T08:00:00Z" },
    ],
    totalPages: 1,
    summary,
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(report.afEvents.map((e) => e.id), [4, 2, 3]);
});

test("uses the first page's summary as the official totals", async () => {
  const { fetchPage } = recorder((page) => ({
    items: [{ id: page }],
    totalPages: 2,
    summary: page === 1 ? summary : { totalData: 99, totalAfib: 99, totalNormal: 0 },
  }));
  const report = await collectReport(fetchPage, range);
  assert.deepEqual(report.summary, summary);
});

test("passes the page size and range through", async () => {
  const { calls, fetchPage } = recorder(() => ({ items: [], totalPages: 3, summary }));
  await collectReport(fetchPage, range, { pageSize: 50 });
  assert.equal(calls.length, 3);
  for (const [, size, r] of calls) {
    assert.equal(size, 50);
    assert.equal(r, range);
  }
});

test("rejects when a page fails", async () => {
  const { fetchPage } = recorder((page) =>
    page === 2 ? new Error("Gagal mengambil riwayat.") : { items: [], totalPages: 3, summary },
  );
  await assert.rejects(collectReport(fetchPage, range), /Gagal/);
});

test("drops duplicate items across pages", async () => {
  const { fetchPage } = recorder((page) => ({
    items:
      page === 1
        ? [{ id: 1, resultLabel: "AF Detected", requestedAt: "2026-11-01T08:00:00Z" }, { id: 2 }, { resultLabel: "AF Detected" }]
        : [{ id: 2 }, { id: 3, resultLabel: "AF Detected", requestedAt: "2026-11-02T08:00:00Z" }, { resultLabel: "AF Detected" }],
    totalPages: 2,
    summary,
  }));
  const report = await collectReport(fetchPage, range);
  assert.equal(report.scanned, 5);
  assert.deepEqual(
    report.afEvents.map((item) => item.id),
    [3, 1, undefined, undefined],
  );
});

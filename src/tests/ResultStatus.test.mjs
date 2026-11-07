import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const overview = read("components/dashboard/DashboardOverview.tsx");
const history = read("components/dashboard/HistoryView.tsx");
const detail = read("components/dashboard/HistoryDetailModal.tsx");
const report = read("components/dashboard/DoctorReportView.tsx");
const historyHook = read("components/dashboard/hooks/UseHistoryView.ts");
const overviewHook = read("components/dashboard/hooks/UseDashboardOverview.ts");

test("result status has one source of truth and never defaults to normal", () => {
  for (const source of [overview, history, detail]) {
    assert.doesNotMatch(source, /\?\? true/);
  }
  assert.match(history, /resultStatus/);
  assert.match(detail, /resultStatus/);
  assert.match(overviewHook, /resultStatus\(latestData\?\.resultLabel\)/);
  assert.doesNotMatch(overview, /Detail Diagnosa AI/);
  assert.match(overview, /Detail Hasil AI/);
  assert.match(overview, /Hasil analisis belum tersedia/);
});

test("normal and AF percentages use largest-remainder shares", () => {
  assert.match(history, /splitShares\(/);
  assert.match(report, /splitShares\(/);
  assert.doesNotMatch(history, /100 - afShare/);
  assert.doesNotMatch(report, /100 - afShare/);
});

test("history errors are Indonesian and retryable", () => {
  assert.doesNotMatch(historyHook, /err\.message/);
  assert.match(historyHook, /describeCaughtError/);
  assert.match(historyHook, /reload/);
  assert.match(history, /<DataErrorState \{\.\.\.error\} onRetry=\{reload\}/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const overview = read("components/dashboard/DashboardOverview.tsx");
const history = read("components/dashboard/HistoryView.tsx");
const detail = read("components/dashboard/HistoryDetailModal.tsx");
const report = read("components/dashboard/DoctorReportView.tsx");
const historyHook = read("components/dashboard/hooks/UseHistoryView.ts");
const modal = read("components/dashboard/AiResultModal.tsx");
const reportData = read("components/dashboard/ReportData.ts");
const session = read("components/dashboard/MonitoringSession.ts");
const kinds = read("components/dashboard/ResultKind.ts");
const overviewHook = read("components/dashboard/hooks/UseDashboardOverview.ts");

test("result status has one source of truth and never defaults to normal", () => {
  for (const source of [overview, history, detail]) {
    assert.doesNotMatch(source, /\?\? true/);
  }
  assert.match(history, /classifyResult\(row\)/);
  assert.match(detail, /classifyResult\(item\)/);
  assert.match(overviewHook, /classifyResult\(latestData\)/);
  assert.match(modal, /classifyResult\(data\)/);
  assert.match(reportData, /classifyResult\(item\)/);
  assert.match(session, /classifyResult\(data\)/);
  for (const source of [overview, history, detail, modal, report, reportData, session, overviewHook]) {
    assert.doesNotMatch(source, /resultStatus|isNormalResult/);
    // No UI decision may read label text any more.
    assert.doesNotMatch(source, /resultLabel\??\.(toLowerCase|includes|startsWith)/);
  }
  assert.doesNotMatch(overview, /Detail Diagnosa AI/);
  assert.match(overview, /Detail Hasil AI/);
  assert.match(kinds, /Hasil analisis belum tersedia/);
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

test("the six result copy strings live in the shared table and the views use it", () => {
  for (const text of [
    "Terdeteksi AF",
    "Terdeteksi AFL",
    "Rekaman terlalu singkat",
    "Hasil AI tidak tersedia",
    "Belum ada hasil",
    "Normal Rhythm",
    "Terdeteksi Potensi Atrial Flutter",
  ]) {
    assert.ok(kinds.includes(text), `ResultKind is missing ${text}`);
  }
  for (const source of [overview, history, detail, modal]) {
    assert.match(source, /RESULT_COPY/);
  }
  assert.match(overview, /Rekaman terakhir belum bisa dianalisis\./);
});

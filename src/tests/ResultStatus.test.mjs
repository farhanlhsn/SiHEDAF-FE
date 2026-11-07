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

test("notification icons follow the backend type, never the title text", () => {
  const panel = read("components/dashboard/NotificationPanel.tsx");
  assert.match(panel, /const kind = notificationKind\(notif\);/);
  assert.match(panel, /kind === "alert" \?/);
  assert.match(panel, /label=\{NOTIFICATION_KIND_LABEL\.alert\}/);
  assert.match(panel, /aria-label=\{NOTIFICATION_KIND_LABEL\.info\}/);
  // The real backend titles every AF/AFL alert "Medical Alert!": no substring guesses.
  assert.doesNotMatch(panel, /title\.toLowerCase\(\)|lowerTitle|\.includes\("af"\)|\.includes\("atrial"\)/);
  assert.doesNotMatch(panel, /\.title\.(?:includes|startsWith|match)\(/);
  // The neutral icon is not a rhythm mark.
  assert.match(panel, /<Info aria-hidden="true"/);
  // Text stays as the backend delivered it.
  assert.match(panel, /\{notif\.title\}/);
  assert.match(panel, /\{notif\.message\}/);
});

test("every result StatusMark is named by its kind, so AFL is announced as AFL", () => {
  const mark = read("components/dashboard/StatusMark.tsx");
  assert.match(mark, /label\?: string;/);
  assert.match(mark, /aria-label=\{label \?\? \(isNormal \? "Normal Rhythm" : "Terdeteksi AF"\)\}/);
  for (const [name, source] of [["overview", overview], ["history", history], ["detail", detail], ["modal", modal], ["report", report]]) {
    const marks = [...source.matchAll(/<StatusMark\b[^>]*\/>/gs)].map((match) => match[0]);
    assert.ok(marks.length > 0, `${name} renders no StatusMark`);
    for (const mark of marks) {
      assert.match(mark, /label=\{(?:copy\.label|RESULT_COPY\[[^\]]+\]\.label)\}/, `${name}: ${mark}`);
    }
  }
  assert.equal([...overview.matchAll(/<StatusMark\b/g)].length, 2);
});

test("neutral kinds hide the StatusMark; alert kinds drive the AF note and the doctor link", () => {
  for (const source of [overview, detail, modal]) {
    assert.match(source, /isNeutral \? null : \(\s*(?:<div[^>]*>\s*)?<StatusMark/);
  }
  assert.match(history, /isNeutral \? null : \(\s*<StatusMark/);
  assert.match(overview, /const isAlert = isAlertKind\(result\);/);
  assert.match(overview, /\{isAlert \? \(\s*<div[\s\S]{0,200}role="note"/);
  assert.match(modal, /const isAlert = isAlertKind\(kind\);/);
  assert.match(modal, /\{isAlert \? \(\s*<>\s*<Link[\s\S]{0,300}Buat laporan dokter/);
  assert.match(detail, /const isAlert = isAlertKind\(result\);/);
});

test("the detail trace label and the normal sub-line speak Indonesian about AF and AFL", () => {
  for (const phrase of ['normal: "irama normal"', 'af: "terdeteksi AF"', 'flutter: "terdeteksi AFL"', 'pending: "belum ada hasil"']) {
    assert.ok(detail.includes(phrase), `detail is missing ${phrase}`);
  }
  assert.match(detail, /label=\{`Grafik sinyal PPG, \$\{TRACE_PHRASE\[result\]\}`\}/);
  assert.doesNotMatch(detail, /copy\.label\.toLowerCase\(\)/);
  assert.ok(history.includes('"Tidak ditemukan pola AF atau AFL"'));
  assert.doesNotMatch(history, /"Tidak ditemukan pola AF"/);
});

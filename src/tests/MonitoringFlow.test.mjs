import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const modal = read("components/dashboard/AiResultModal.tsx");
const sessionHook = read("components/dashboard/hooks/UseMonitoringSession.ts");
const overview = read("components/dashboard/DashboardOverview.tsx");

test("AI result modal follows phases and never invents a result", () => {
  assert.doesNotMatch(modal, /\?\? true/);
  assert.doesNotMatch(modal, /COMPLETED/);
  for (const text of [
    "Sedang dianalisis",
    "Hasil belum tersedia",
    "Mulai monitoring lagi",
    "Buat laporan dokter",
    "bukan diagnosis",
    "analysisStatusLabel(",
    "resultStatus(",
  ]) {
    assert.ok(modal.includes(text), `AiResultModal is missing ${text}`);
  }
});

test("monitoring session hook polls for a fresh result with a cap", () => {
  for (const text of ["POLL_MAX_ATTEMPTS", "isFreshResult(", "POLL_INTERVAL_MS"]) {
    assert.ok(sessionHook.includes(text), `UseMonitoringSession is missing ${text}`);
  }
});

test("overview shows recording time, reminder and analysing state", () => {
  for (const text of [
    "Monitoring sedang berjalan.",
    "Biarkan wristband tetap terpasang dan usahakan tangan tidak banyak bergerak selama perekaman.",
    'role="timer"',
    "Menganalisis",
  ]) {
    assert.ok(overview.includes(text), `DashboardOverview is missing ${text}`);
  }
});

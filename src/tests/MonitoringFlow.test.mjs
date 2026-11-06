import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const modal = read("components/dashboard/AiResultModal.tsx");
const sessionHook = read("components/dashboard/hooks/UseMonitoringSession.ts");
const overview = read("components/dashboard/DashboardOverview.tsx");
const overviewHook = read("components/dashboard/hooks/UseDashboardOverview.ts");

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

test("session hook polls through the pure loop and never outlives the page", () => {
  for (const text of ["pollForFreshResult(", "requestSignal(", "rememberResult(", "waitFor("]) {
    assert.ok(sessionHook.includes(text), `UseMonitoringSession is missing ${text}`);
  }
  assert.doesNotMatch(sessionHook, /setTimeout\(tick/);
  // StrictMode-safe: a fresh lifetime per effect run, aborted in its cleanup.
  assert.match(sessionHook, /useEffect\(\(\) => \{\s*const lifetime = new AbortController\(\);/);
  assert.match(sessionHook, /return \(\) => \{\s*lifetime\.abort\(\);\s*cancelPolling\(\);/);
  assert.match(sessionHook, /if \(lifetime\.aborted\) return;/);
});

test("a slow first /latest cannot overwrite a session the user started", () => {
  assert.match(sessionHook, /if \(userActedRef\.current\) return false;/);
  assert.match(overviewHook, /adoptInitial\(json\.data\)/);
});

test("the modal view is its own state; Detail Hasil AI shows analysing only while analysing", () => {
  assert.match(sessionHook, /useState<ResultModalView>/);
  assert.match(sessionHook, /setModalView\(phase === "analysing" \? "analysing" : "result"\)/);
  assert.match(modal, /<DashboardModal\s+key=\{view\}/);
});

test("restart is offered only after a session ends", () => {
  assert.match(overviewHook, /restartAction\(session\.phase/);
  assert.match(modal, /restart !== "hidden"/);
});

test("the first-run guide counts analysing as monitoring", () => {
  assert.match(
    overviewHook,
    /monitoringActive:\s*session\.phase === "recording" \|\| session\.phase === "analysing"/,
  );
});

test("modal actions sit in a grid of full-height, single-line buttons", () => {
  assert.doesNotMatch(modal, /flex-1/, "flex-1 in a column flexbox crushes the buttons");
  assert.match(modal, /grid gap-3 sm:grid-cols-2/);
  // With an odd number of actions the first (primary) spans both columns.
  assert.match(modal, /sm:\[&>:first-child:nth-last-child\(odd\)\]:col-span-2/);
  for (const text of ["h-12", "whitespace-nowrap", "text-center"]) {
    assert.ok(modal.includes(text), `AiResultModal actions are missing ${text}`);
  }
});

test("a disabled restart stays readable and says why when the device is offline", () => {
  assert.doesNotMatch(modal, /disabled:opacity-60/);
  assert.match(modal, /disabled:text-primary-900\/70/);
  assert.match(modal, /disabled:border-primary-900\/15/);
  assert.match(modal, /restart === "offline"/);
  assert.ok(modal.includes("Perangkat belum terhubung."));
});

test("the modal trace has a generic label", () => {
  assert.match(modal, /label="Grafik sinyal PPG"/);
  assert.doesNotMatch(modal, /sesi ini"/);
});

test("only the phase word is live; the timer is not announced every second", () => {
  const politeAt = overview.indexOf('aria-live="polite"');
  assert.ok(politeAt > -1, "phase word needs a polite live region");
  const liveElement = overview.slice(politeAt, overview.indexOf("</span>", politeAt));
  assert.doesNotMatch(liveElement, /role="timer"|·/);
  assert.match(overview, /role="timer"[\s\S]{0,80}aria-live="off"|aria-live="off"[\s\S]{0,80}role="timer"/);
});

test("the signal card explains a timed-out analysis", () => {
  assert.match(overview, /phase === "timeout"/);
  assert.ok(
    overview.includes("Hasil sesi terakhir belum tersedia. Cek Riwayat beberapa saat lagi."),
  );
  assert.match(overview, /href="\/riwayat"[\s\S]{0,200}Buka Riwayat/);
});

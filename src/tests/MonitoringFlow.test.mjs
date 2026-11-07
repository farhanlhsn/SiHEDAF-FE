import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const modal = read("components/dashboard/AiResultModal.tsx");
const sessionHook = read("components/dashboard/hooks/UseMonitoringSession.ts");
const overview = read("components/dashboard/DashboardOverview.tsx");
const overviewHook = read("components/dashboard/hooks/UseDashboardOverview.ts");
const dashboardModal = read("components/dashboard/DashboardModal.tsx");

test("AI result modal follows phases and never invents a result", () => {
  assert.doesNotMatch(modal, /\?\? true/);
  assert.doesNotMatch(modal, /COMPLETED/);
  for (const text of [
    "Sedang dianalisis",
    "Hasil belum tersedia",
    "Mulai monitoring lagi",
    "Buat laporan dokter",
    "analysisStatusLabel(",
    "classifyResult(",
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
  assert.match(modal, /<DashboardModal\s+contentKey=\{view\}/);
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

test("a slow first /latest still teaches the baseline before it is ignored", () => {
  assert.match(
    sessionHook,
    /baselineRef\.current = rememberInitial\(baselineRef\.current, latest\);\s*(?:\/\/[^\n]*\n\s*)*if \(userActedRef\.current\) return false;/,
  );
});

test("start/stop wait 30 s and re-read /latest after a timeout", () => {
  assert.match(sessionHook, /requestSignal\(lifetime, TOGGLE_TIMEOUT_MS\)/);
  assert.match(sessionHook, /isTimeoutError\(error\)/);
  assert.match(sessionHook, /afterToggleTimeout\(\s*action,\s*latest,\s*running,\s*\)/);
  assert.match(sessionHook, /toast\.error\(TOGGLE_ERROR\)/);
});

test("a device that is still loading is not reported offline", () => {
  // Every device claim follows the one deviceState (loading, error, none…).
  assert.match(overviewHook, /restartAction\(session\.phase, \{\s*device: deviceStatus,/);
  assert.match(overviewHook, /toggleBlock\(session\.phase, \{\s*device: deviceStatus,/);
  assert.match(overviewHook, /DEVICE_STATUS_LABEL\[deviceStatus\]/);
  assert.match(overview, /\{deviceStatusLabel\}/);
  assert.doesNotMatch(overview, /"Memuat\.\.\."/, "the status value comes from DEVICE_STATUS_LABEL");
  assert.doesNotMatch(overview, /deviceData\?\.status/);
});

test("a view swap replaces only the dialog, keeping the backdrop and the opener", () => {
  assert.doesNotMatch(modal, /\bkey=\{view\}/);
  assert.match(dashboardModal, /contentKey\?: string/);
  assert.match(dashboardModal, /<section[^>]*\bkey=\{contentKey\}/);
  // The opener is captured only when the modal opens…
  assert.match(dashboardModal, /const opener = document\.activeElement;[\s\S]*?\}, \[isShown\]\);/);
  // …while a content swap moves focus into the new dialog.
  assert.match(dashboardModal, /dialogRef\.current\?\.focus\(\);\s*\}, \[contentKey, isShown\]\);/);
});

test("the recording status counts up to 03:00, then waits for the wristband", () => {
  assert.match(sessionHook, /recordingClock\(/);
  assert.match(overviewHook, /clock: session\.clock/);
  assert.match(overview, /\{clock\.text\}/);
  assert.match(overview, /aria-label=\{`Lama perekaman \$\{clock\.elapsed\} dari \$\{clock\.limit\}`\}/);
  // From 03:00 the waiting text replaces the phase word in the polite region and the timer leaves.
  const politeAt = overview.indexOf('aria-live="polite"');
  const liveElement = overview.slice(politeAt, overview.indexOf("</span>", politeAt));
  assert.ok(liveElement.includes("Menunggu hasil dari wristband…"), "waiting text belongs to the phase word");
  assert.ok(liveElement.includes('"Merekam"'));
  assert.match(overview, /isMonitoringActive && !clock\.overtime \?/);
});

test("while recording, /latest is watched every 5 s and the watch ends with the recording", () => {
  assert.match(sessionHook, /intervalMs: RECORDING_WATCH_INTERVAL_MS/);
  assert.match(sessionHook, /await waitFor\(RECORDING_WATCH_INTERVAL_MS, watch\);/);
  // One effect owns the watch: only while recording and no start/stop is in flight;
  // its cleanup aborts it when recording ends, Stop is pressed or the page unmounts.
  assert.match(sessionHook, /if \(phase !== "recording" \|\| isTogglingAction\) return;/);
  assert.match(sessionHook, /const watch = new AbortController\(\);/);
  assert.match(sessionHook, /return \(\) => \{\s*watch\.abort\(\);/);
  // Pressing Stop ends the watch at once, so Stop's analysing poll is the only loop.
  assert.match(sessionHook, /if \(action === "stop"\) stopWatching\(\);/);
  assert.match(sessionHook, /watchRef\.current\?\.abort\(\);/);
  // The watch follows the same fresh-result rules as the analysing poll.
  assert.match(sessionHook, /isFresh: isFreshNow,/);
  assert.match(sessionHook, /void watchRecording\(watch\.signal, isFreshNow\)\.then\(/);
  assert.match(sessionHook, /maxAttempts: Number\.POSITIVE_INFINITY/);
});

test("a recording the wristband finished opens the result with a note", () => {
  assert.ok(modal.includes("Rekaman selesai otomatis setelah 3 menit."));
  assert.match(modal, /autoFinished \?/);
  assert.match(overviewHook, /autoFinished: session\.autoFinished/);
  assert.match(overview, /autoFinished=\{autoFinished\}/);
  // Watch result and a refused Stop that finds a fresh result: automatic; the analysing poll: not.
  assert.match(sessionHook, /showResult\(outcome\.data, \{ automatic: true \}\)/);
  assert.match(sessionHook, /showResult\(next\.data, \{ automatic: true \}\)/);
  assert.match(sessionHook, /showResult\(outcome\.data, \{ automatic: false \}\)/);
  assert.match(sessionHook, /afterStopRefused\(latest, isFreshNow\)/);
  assert.match(sessionHook, /toggleAnswer\(status, json\?\.code\)/);
});

test("a reload resumes a running session from the newest history row", () => {
  assert.ok(sessionHook.includes('"/api/v1/measurement/history?page=1&limit=1"'));
  assert.match(sessionHook, /runningSessionFrom\(/);
  assert.match(sessionHook, /rememberSession\(baselineRef\.current, running\)/);
  // Ignored once the user started or stopped meanwhile; never after unmount.
  assert.match(sessionHook, /if \(lifetime\.aborted \|\| !running \|\| userActedRef\.current\) return;/);
  assert.match(sessionHook, /void resumeRunningSession\(lifetime\.signal\);/);
});

test("a refused start gets a fixed wristband hint and no server text reaches a toast", () => {
  assert.ok(
    sessionHook.includes(
      "Wristband belum siap untuk merekam. Pastikan wristband menyala, terhubung ke internet, dan tidak sedang merekam, lalu coba lagi.",
    ),
  );
  assert.match(sessionHook, /toast\.error\(START_REFUSED\)/);
  const toastArgs = [...sessionHook.matchAll(/toast\.\w+\(([^)]*)\)/g)].map((match) => match[1]);
  assert.ok(toastArgs.length >= 3);
  for (const arg of toastArgs) {
    assert.match(arg, /^(?:TOGGLE_FAILED|TOGGLE_ERROR|START_REFUSED)$/, `toast shows ${arg}`);
  }
  assert.doesNotMatch(sessionHook, /\.message\b|\.errors\b/, "server text is never read");
});

test("Stop stays possible while recording, whatever the wristband state", () => {
  const session = read("components/dashboard/MonitoringSession.ts");
  const block = session.slice(session.indexOf("export function toggleBlock("));
  const body = block.slice(0, block.indexOf("\n}\n"));
  // Only the network can block a running session's Stop; the device check comes after.
  assert.ok(
    body.indexOf('if (phase === "recording" || phase === "analysing") return null;') <
      body.indexOf('device === "online"'),
  );
  assert.match(overview, /disabled=\{\s*toggleBlocked !== null \|\| isTogglingAction \|\| isAnalysing\s*\}/);
});

test("overtime longer than 30 s tells the reader to press Stop, once and not live", () => {
  const text = "Belum ada hasil dari wristband. Tekan Hentikan Monitoring untuk menyelesaikan rekaman.";
  assert.ok(overview.includes(text));
  assert.match(overview, /const isStalled = isMonitoringActive && clock\.overtime && clock\.stalled;/);
  const at = overview.indexOf(text);
  const paragraph = overview.slice(overview.lastIndexOf("<p", at), at);
  assert.doesNotMatch(paragraph, /aria-live|role="(?:status|alert)"/);
  assert.match(paragraph, /text-\[0\.9375rem\]/);
  assert.match(paragraph, /text-primary-900\/80/);
  assert.match(paragraph, /id=\{stalledHintId\}/);
  // The Stop button points to it for screen readers.
  assert.match(overview, /aria-describedby=\{toggleDescribedBy\}/);
  assert.match(overview, /isStalled \? stalledHintId : null/);
});

test("a start that timed out adopts a running session from the newest history row", () => {
  assert.match(sessionHook, /if \(action === "start"\) running = await fetchRunningSession\(lifetime\);/);
  assert.match(sessionHook, /if \(!running\) latest = await fetchLatest\(lifetime\);/);
  assert.match(sessionHook, /afterToggleTimeout\(\s*action,\s*latest,\s*running,\s*\)/);
  assert.match(
    sessionHook,
    /next === "recording" && running\) \{[\s\S]{0,160}rememberSession\(baselineRef\.current, running\);\s*beginRecording\(running\.startedAt \?\? Date\.now\(\)\);/,
  );
});

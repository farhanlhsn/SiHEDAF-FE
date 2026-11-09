import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("history rows open the detail modal and are keyboard accessible", async () => {
  const source = await read("components/dashboard/HistoryView.tsx");

  assert.match(source, /<button[^>]*[\s\S]*?aria-label=\{[\s\S]*?`Lihat detail analisis /);
  assert.match(source, /Lihat detail analisis tanpa waktu/);
  assert.match(source, /onClick=\{\(\) => setSelectedItem\(row\)\}/);
  assert.match(source, /setSelectedItem\(row\);/);
  assert.match(source, /stopPropagation/);
  assert.match(source, /cursor-pointer hover:bg-paper/);
  assert.match(source, /<HistoryDetailModal/);
});

test("history detail modal shows facts, plain-language copy and AF report link", async () => {
  const source = await read("components/dashboard/HistoryDetailModal.tsx");

  assert.match(source, /<DashboardModal[\s\S]*size="wide"/);
  assert.match(source, /PpgTrace/);
  assert.match(source, /formatConfidence/);
  assert.match(source, /Tidak tersedia/);
  assert.match(source, /classifyResult\(item\)/);
  assert.match(source, /RESULT_COPY\[result\]/);
  assert.match(source, /copy\.sentence/);
  assert.match(source, /copy\.title/);
  assert.doesNotMatch(source, /resultStatus|isNormalResult/);
  assert.match(source, /reportHref\(rangeEndingOn\(/);
  assert.match(source, /Buat laporan dokter/);
  assert.match(source, /isAlert \?[\s\S]*Buat laporan dokter/);
});

test("history view state lives in the hook", async () => {
  const source = await read("components/dashboard/hooks/UseHistoryView.ts");
  assert.match(source, /selectedItem/);
  assert.match(source, /setSelectedItem/);
});

test("DashboardModal supports a wide size", async () => {
  const source = await read("components/dashboard/DashboardModal.tsx");
  assert.match(source, /max-w-\[760px\]/);
  assert.match(source, /size\?: "default" \| "wide"/);
});

test("doctor report route awaits searchParams and renders the view", async () => {
  const source = await read("app/(dashboard)/riwayat/laporan/page.tsx");
  assert.match(source, /await searchParams/);
  assert.match(source, /<DoctorReportView/);
});

test("doctor report view carries the required copy and states", async () => {
  const source = await read("components/dashboard/DoctorReportView.tsx");
  for (const text of [
    "window.print()",
    "print:hidden",
    "Laporan Pemantauan Irama Jantung",
    "Tidak ada AF atau AFL terdeteksi pada periode ini.",
    "AFL terdeteksi",
    "Tanpa hasil",
    "Jenis",
    "Belum ada rekaman pada periode ini.",
    // History is newest first, so a cut-off report scanned the newest rows.
    "rekaman terbaru pada periode ini",
    "Angka ringkasan hanya mencakup rekaman tersebut",
    "bukan diagnosis",
    "Durasi dan skala waktu grafik dihitung dari laju sampel 50 Hz.",
    "<PpgTrace",
    "<PulseLoader",
    "<DataErrorState",
  ]) {
    assert.ok(source.includes(text), `missing ${text}`);
  }
});

test("useDoctorReport collects the report with a cancellable fetch", async () => {
  const source = await read("components/dashboard/hooks/UseDoctorReport.ts");
  for (const text of [
    "collectReport(",
    "router.replace(reportHref(",
    "isCancelled",
    "startDate",
    "endDate",
  ]) {
    assert.ok(source.includes(text), `missing ${text}`);
  }
});

test("shell hides chrome when printing and titles the report route", async () => {
  const source = await read("components/dashboard/DashboardShell.tsx");
  assert.ok(source.includes('"/riwayat/laporan": "Laporan"'));
  assert.ok((source.match(/print:hidden/g) ?? []).length >= 4);
});

test("sidebar keeps Riwayat active on nested routes", async () => {
  const source = await read("components/dashboard/DashboardSidebar.tsx");
  assert.match(source, /pathname\.startsWith\(item\.href\)/);
});

test("history header links to the doctor report", async () => {
  const source = await read("components/dashboard/HistoryView.tsx");
  assert.match(source, /Buat laporan dokter/);
  assert.match(source, /reportHref\(rangeFromDateRange\(dateRange\)\)/);
});

test("global print rules target A4 and keep colours", async () => {
  const source = await read("app/globals.css");
  assert.match(source, /@media print/);
  assert.match(source, /@page\s*{[^}]*size:\s*A4/);
  assert.match(source, /print-color-adjust:\s*exact/);
});

test("report counts come from the period's items, not the API summary", async () => {
  const view = await read("components/dashboard/DoctorReportView.tsx");
  assert.ok(view.includes("Tidak ada AF atau AFL terdeteksi pada periode ini."));
  assert.match(view, /report\.truncated \? null/);
  assert.match(view, /summary\?\.af \?\? 0\) \+ \(summary\?\.flutter \?\? 0\)/);
  assert.match(view, /report\.summary\.other > 0/);
  assert.doesNotMatch(view, /totalAfib|totalNormal|totalData/);
  for (const file of ["components/dashboard/hooks/UseDoctorReport.ts", "components/dashboard/ReportData.ts"]) {
    assert.doesNotMatch(await read(file), /json\.data\.summary|\.summary\?\./, file);
  }
  const data = await read("components/dashboard/ReportData.ts");
  assert.match(data, /addDays\(range\.from, -1\)/);
  assert.match(data, /jakartaDay\(/);
});

test("report normal share comes from the normal count, via splitShares, not 100 minus AF", async () => {
  const source = await read("components/dashboard/DoctorReportView.tsx");
  assert.match(source, /splitShares\(\[summary\?\.normal \?\? 0, alerts\], total\)/);
  assert.doesNotMatch(source, /100 - afShare/);
});

test("history summary is labelled all-time and notes the date range", async () => {
  const source = await read("components/dashboard/HistoryView.tsx");
  assert.ok(source.includes("Ringkasan sepanjang waktu"));
  assert.ok(source.includes("Ringkasan mencakup seluruh riwayat, bukan hanya rentang tanggal yang dipilih."));
  assert.match(source, /dateRange\?\.from/);
});

test("date range picker formats in the runtime's local zone", async () => {
  const source = await read("components/dashboard/DateRangePicker.tsx");
  assert.doesNotMatch(source, /timeZone/);
});

test("date range popover anchors to the trigger's left edge so it never leaves a narrow screen", async () => {
  const source = await read("components/dashboard/DateRangePicker.tsx");
  assert.match(source, /absolute top-\[calc\(100%\+12px\)\] left-0 /);
  assert.doesNotMatch(source, /top-\[calc\(100%\+12px\)\] right-0/);
});

test("report page sets a document title", async () => {
  const source = await read("app/(dashboard)/riwayat/laporan/page.tsx");
  assert.match(source, /import type \{ Metadata \} from "next"/);
  assert.match(source, /export const metadata: Metadata = \{\s*title: "Laporan Pemantauan Irama Jantung"/);
});

test("report fetch errors never show a raw browser message", async () => {
  const source = await read("components/dashboard/hooks/UseDoctorReport.ts");
  assert.match(source, /setError\(\s*describeCaughtError\(/);
  assert.doesNotMatch(source, /err\.message/);
});

test("first-run guide shows only after the latest data loaded and is empty", async () => {
  const overview = await read("components/dashboard/DashboardOverview.tsx");
  const hook = await read("components/dashboard/hooks/UseDashboardOverview.ts");
  const guide = await read("components/dashboard/FirstRunGuide.tsx");

  assert.match(hook, /hasLoadedLatest/);
  assert.match(
    hook,
    /instanceof SessionExpiredError\) return;[\s\S]*?if \(!cancelled\) setHasLoadedLatest\(true\)/,
  );
  assert.doesNotMatch(hook, /finally\s*\{\s*if \(!cancelled\) setHasLoadedLatest/);
  assert.match(overview, /showFirstRun\s*\?\s*\(\s*<FirstRunGuide/);
  assert.match(
    hook,
    /showFirstRun =\s*hasLoadedLatest &&\s*!isDeviceLoading &&\s*!latestData &&\s*!latestError &&\s*resumeChecked;/,
  );
  assert.match(overview, /<article[^>]*id="monitor"/);
  assert.match(overview, /!hasLoadedLatest[\s\S]*?Memuat hasil terakhir/);
  assert.match(guide, /<a[\s\S]*?href="#monitor"/);
  assert.match(guide, /aria-current=/);
  assert.match(guide, /<ol/);
  assert.match(guide, /Kenakan SiHEDAF di pergelangan tangan dan pastikan statusnya Terhubung\./);
  assert.match(guide, /Tekan Mulai Monitoring\. Sinyal PPG akan direkam secara berkala\./);
  assert.match(guide, /Hentikan monitoring untuk melihat hasil analisis pertamamu\./);
});

test("dashboard modal renders through a portal to the document body", async () => {
  const modal = await read("components/dashboard/DashboardModal.tsx");

  assert.match(modal, /import \{ createPortal \} from "react-dom"/);
  assert.ok(modal.includes("createPortal("));
  assert.ok(modal.includes("document.body,"));
});

test("records without a result label get a neutral unknown state, not normal", async () => {
  const modal = await read("components/dashboard/HistoryDetailModal.tsx");
  const view = await read("components/dashboard/HistoryView.tsx");

  const kinds = await read("components/dashboard/ResultKind.ts");

  assert.ok(kinds.includes("Hasil analisis belum tersedia"));
  assert.ok(kinds.includes("Rekaman ini belum memiliki hasil analisis AI."));
  assert.ok(kinds.includes("Belum ada hasil"));
  assert.match(modal, /isNeutral/);
  assert.doesNotMatch(modal, /\?\? true/);
  assert.match(view, /isNeutral/);
  assert.match(view, /RESULT_COPY\[result\]/);
  assert.doesNotMatch(view, /\?\? true/);
});

test("dashboard modal moves focus into the dialog and restores it on close", async () => {
  const modal = await read("components/dashboard/DashboardModal.tsx");
  assert.match(modal, /document\.activeElement/);
  assert.match(modal, /\.focus\(/);
  assert.ok(modal.includes("tabIndex={-1}"));
  assert.match(modal, /isConnected/);
});

test("recording durations and trace ticks come from the 50 Hz sample count", async () => {
  const [detail, modal, report, trace, chart] = await Promise.all([
    read("components/dashboard/HistoryDetailModal.tsx"),
    read("components/dashboard/AiResultModal.tsx"),
    read("components/dashboard/DoctorReportView.tsx"),
    read("components/dashboard/PpgTrace.tsx"),
    read("components/dashboard/SignalChart.tsx"),
  ]);

  // The "Durasi rekaman" fact, "—" when unknown.
  assert.match(detail, /label: "Durasi rekaman",\s*value: recordingDuration\(item\.ppgResult\?\.rawPpgData\) \?\? "—"/);
  assert.match(modal, /const duration = recordingDuration\(data\?\.ppgResult\?\.rawPpgData\);/);
  assert.match(modal, /Durasi rekaman<\/dt>[\s\S]{0,160}\{duration \?\? "—"\}/);
  // A "Durasi" column in the report's event table.
  assert.match(report, /<th className="pb-2 font-semibold">Durasi<\/th>/);
  assert.match(report, /\{recordingDuration\(item\.ppgResult\?\.rawPpgData\) \?\? "—"\}/);
  assert.doesNotMatch(report, /tanpa skala waktu/);

  // The three traces of a single recording get time ticks at 50 Hz.
  for (const [name, source] of [["detail", detail], ["modal", modal], ["report", report]]) {
    assert.match(source, /<PpgTrace[^>]*sampleRate=\{SAMPLE_RATE_HZ\}/s, `${name} trace lacks ticks`);
  }
  assert.match(trace, /sampleRate\?: number;/);
  assert.match(trace, /traceTicks\(data\?\.length \?\? 0, sampleRate\)/);
  assert.match(trace, /aria-hidden="true"[\s\S]{0,120}text-\[0\.8125rem\]/);
  assert.match(trace, /if \(ticks === null\) return trace;/);

  // The live chart concatenates sessions: it keeps its minute labels.
  assert.doesNotMatch(chart, /sampleRate|SAMPLE_RATE_HZ|Signal"/);
  assert.match(chart, /minutesLabel\(rangeMinutes\)/);
});

test("nothing on the dashboard counts beats", async () => {
  for (const file of [
    "components/dashboard/Signal.ts",
    "components/dashboard/PpgTrace.tsx",
    "components/dashboard/HistoryDetailModal.tsx",
    "components/dashboard/AiResultModal.tsx",
    "components/dashboard/DoctorReportView.tsx",
    "components/dashboard/DashboardOverview.tsx",
    "components/dashboard/SignalChart.tsx",
  ]) {
    const source = await read(file);
    // Signal.ts may say so in its doc comment; nothing else names beats or peaks.
    const code = source.replace(/\/\*\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(code, /\bbpm\b|peak|denyut per menit|detak per menit/i, file);
  }
});

test("the report's six-column event table scrolls sideways on phones and fits print", async () => {
  const report = await read("components/dashboard/DoctorReportView.tsx");
  assert.match(report, /<ScrollArea\s+className="mt-3 w-full print:overflow-visible"/);
  assert.match(report, /<table className="w-full min-w-\[640px\] border-collapse text-left print:min-w-0">/);
});

test("a cut-off report names the scanned rows as the newest, never the first", async () => {
  const source = await read("components/dashboard/DoctorReportView.tsx");
  assert.ok(source.includes("dari {report.scanned} rekaman terbaru pada periode ini."));
  assert.doesNotMatch(source, /rekaman pertama/);
});

test("detail Device ID is the paired number; the doctor report window and Waktu follow completedAt", async () => {
  const detail = await read("components/dashboard/HistoryDetailModal.tsx");
  assert.match(detail, /\{ label: "Device ID", value: item\.device\?\.deviceNumber \|\| "—" \}/);
  assert.doesNotMatch(detail, /item\.deviceId/);
  assert.match(detail, /reportHref\(\s*rangeEndingOn\(item\.completedAt \?\? item\.requestedAt\),?\s*\)/);
  assert.match(detail, /label: "Waktu",\s*value: formatWib\(item\.completedAt \?\? item\.requestedAt\)/);
  assert.doesNotMatch(detail, /formatWib\(item\.requestedAt\)/);

  const list = await read("components/dashboard/HistoryView.tsx");
  assert.match(list, /const analysedAt = row\.completedAt \?\? row\.requestedAt;/);
  assert.doesNotMatch(list, /formatWib\(row\.requestedAt/);

  const hook = await read("components/dashboard/hooks/UseHistoryView.ts");
  assert.match(hook, /device\?: \{ deviceNumber\?: string \} \| null;/);

  const report = await read("components/dashboard/DoctorReportView.tsx");
  assert.match(report, /formatWib\(item\.completedAt \?\? item\.requestedAt\)/);
  assert.doesNotMatch(report, /formatWib\(item\.requestedAt\)/);
});

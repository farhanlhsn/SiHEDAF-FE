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
  assert.match(
    source,
    /Jarak antar detak pada rekaman ini terlihat teratur\. Tetap pantau secara berkala\./,
  );
  assert.match(
    source,
    /AI menemukan pola tidak teratur yang mirip Atrial Fibrillation\. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan\./,
  );
  assert.match(source, /Irama Jantung Normal/);
  assert.match(source, /Terdeteksi Potensi AF/);
  assert.match(source, /reportHref\(rangeEndingOn\(/);
  assert.match(source, /Buat laporan dokter/);
  assert.match(source, /isNormal \?[\s\S]*Buat laporan dokter|!isNormal[\s\S]*Buat laporan dokter/);
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
    "Tidak ada AF terdeteksi pada periode ini.",
    "Belum ada rekaman pada periode ini.",
    "rekaman pertama pada periode ini",
    "bukan diagnosis",
    "Grafik ditampilkan tanpa skala waktu",
    "<PpgTrace",
    "<PulseLoader",
    "Coba lagi",
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

test("report only claims no AF when the summary agrees", async () => {
  const source = await read("components/dashboard/DoctorReportView.tsx");
  assert.match(source, /totalAfib === 0\s*\?\s*"Tidak ada AF terdeteksi pada periode ini\."/);
  assert.ok(source.includes("Ringkasan mencatat ${report.summary.totalAfib} kejadian AF, tetapi kejadian tersebut berada di luar ${report.scanned} rekaman pertama yang ditampilkan. Persempit periode laporan untuk melihatnya."));
  assert.match(source, /report\.truncated\s*\?\s*`Ringkasan mencatat/);
  assert.ok(source.includes("Ringkasan mencatat ${report.summary.totalAfib} kejadian AF, tetapi rinciannya tidak tersedia."));
});

test("report normal share comes from the normal count, via splitShares, not 100 minus AF", async () => {
  const source = await read("components/dashboard/DoctorReportView.tsx");
  assert.match(source, /splitShares\(\s*\[summary\?\.totalNormal \?\? 0, summary\?\.totalAfib \?\? 0\],\s*total,?\s*\)/);
  assert.doesNotMatch(source, /100 - afShare/);
});

test("date range picker formats in the runtime's local zone", async () => {
  const source = await read("components/dashboard/DateRangePicker.tsx");
  assert.doesNotMatch(source, /timeZone/);
});

test("report page sets a document title", async () => {
  const source = await read("app/(dashboard)/riwayat/laporan/page.tsx");
  assert.match(source, /import type \{ Metadata \} from "next"/);
  assert.match(source, /export const metadata: Metadata = \{\s*title: "Laporan Pemantauan Irama Jantung"/);
});

test("report fetch errors never show a raw browser message", async () => {
  const source = await read("components/dashboard/hooks/UseDoctorReport.ts");
  assert.match(source, /setError\(FETCH_ERROR\)/);
  assert.doesNotMatch(source, /err\.message/);
});

test("first-run guide shows only after the latest data loaded and is empty", async () => {
  const overview = await read("components/dashboard/DashboardOverview.tsx");
  const hook = await read("components/dashboard/hooks/UseDashboardOverview.ts");
  const guide = await read("components/dashboard/FirstRunGuide.tsx");

  assert.match(hook, /hasLoadedLatest/);
  assert.match(hook, /finally\s*\{\s*setHasLoadedLatest\(true\)/);
  assert.match(overview, /showFirstRun\s*\?\s*\(\s*<FirstRunGuide/);
  assert.match(hook, /showFirstRun = hasLoadedLatest && !isDeviceLoading && !latestData/);
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

  assert.ok(modal.includes("Hasil analisis belum tersedia"));
  assert.ok(modal.includes("Rekaman ini belum memiliki hasil analisis AI."));
  assert.match(modal, /isUnknown/);
  assert.doesNotMatch(modal, /\?\? true/);
  assert.ok(view.includes("Belum ada hasil"));
  assert.match(view, /isUnknown/);
  assert.doesNotMatch(view, /\?\? true/);
});

test("dashboard modal moves focus into the dialog and restores it on close", async () => {
  const modal = await read("components/dashboard/DashboardModal.tsx");
  assert.match(modal, /document\.activeElement/);
  assert.match(modal, /\.focus\(/);
  assert.ok(modal.includes("tabIndex={-1}"));
  assert.match(modal, /isConnected/);
});

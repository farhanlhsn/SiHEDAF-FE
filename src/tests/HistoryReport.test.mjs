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

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

test("verifies AiResultModal component structure and theme integration", async () => {
  const [modalSource, overviewComponent, overviewHook] = await Promise.all([
    readSource("components/dashboard/AiResultModal.tsx"),
    readSource("components/dashboard/DashboardOverview.tsx"),
    readSource("components/dashboard/hooks/UseDashboardOverview.ts"),
  ]);

  const overviewSource = `${overviewComponent}\n${overviewHook}`;

  // Modal checks
  assert.match(modalSource, /^["']use client["'];/);
  assert.match(modalSource, /DashboardModal/);
  assert.match(modalSource, /StatusMark/);
  assert.match(modalSource, /Tingkat Keyakinan AI/);
  assert.match(modalSource, /confidenceLevel/);
  assert.match(modalSource, /COMPLETED/);
  assert.match(modalSource, /Irama Jantung Normal/);
  assert.match(modalSource, /Terdeteksi Potensi AF/);
  assert.match(modalSource, /Lihat Riwayat/);
  assert.match(modalSource, /showCloseButton=\{false\}/);
  assert.match(modalSource, />\s*Tutup\s*</);

  // Overview integration checks
  assert.match(overviewSource, /AiResultModal/);
  assert.match(overviewSource, /confidenceLevel/);
  assert.match(overviewSource, /Keyakinan AI/);
  assert.match(overviewSource, /isAiModalOpen/);
  assert.match(overviewSource, /setIsAiModalOpen/);
  assert.match(overviewSource, /Detail Hasil AI/);
});

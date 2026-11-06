import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (file) => readFile(path.join(sourceDirectory, file), "utf8");

test("the shell shows the offline banner under the topbar", async () => {
  const shell = await read("components/dashboard/DashboardShell.tsx");
  assert.match(shell, /<OfflineBanner/);
  assert.ok(
    shell.indexOf("</header>") < shell.indexOf("<OfflineBanner"),
    "banner comes after the header",
  );
});

test("the banner carries the spec copy and live-region attributes", async () => {
  const banner = await read("components/dashboard/OfflineBanner.tsx");
  assert.ok(
    banner.includes(
      "Koneksi internet terputus. Data yang tampil mungkin bukan yang terbaru; SiHEDAF akan memuat ulang otomatis saat tersambung.",
    ),
  );
  assert.ok(
    banner.includes("Tersambung kembali. Data sedang dimuat ulang."),
  );
  assert.match(banner, /print:hidden/);
  assert.match(banner, /aria-live="polite"/);
  assert.match(banner, /role="status"/);
});

test("every data fetch reloads when the connection returns", async () => {
  for (const file of [
    "components/dashboard/hooks/UseDashboardOverview.ts",
    "components/dashboard/hooks/UseMyDevice.ts",
    "components/dashboard/hooks/UseHistoryView.ts",
    "components/dashboard/hooks/UseDoctorReport.ts",
    "components/dashboard/NotificationPanel.tsx",
  ]) {
    const source = await read(file);
    assert.match(source, /useOnlineStatus\(\)/, `${file} reads the online status`);
    assert.match(
      source,
      /\}, \[[^\]]*reconnectCount[^\]]*\]\)/,
      `${file} lists reconnectCount in an effect's dependencies`,
    );
  }
});

test("monitoring controls explain themselves while offline", async () => {
  const overview = await read("components/dashboard/DashboardOverview.tsx");
  assert.match(overview, /!online/);
  assert.ok(overview.includes("Tidak ada koneksi internet."));
  assert.match(overview, /aria-describedby=\{[^}]*\}/);

  const modal = await read("components/dashboard/AiResultModal.tsx");
  assert.match(modal, /"no-network"/);
  assert.ok(modal.includes("Tidak ada koneksi internet."));

  const hook = await read("components/dashboard/hooks/UseDashboardOverview.ts");
  assert.match(hook, /networkOnline/);
});

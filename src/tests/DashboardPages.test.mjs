import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");
const dashboardFiles = [
  "app/(dashboard)/layout.tsx",
  "app/(dashboard)/dashboard/page.tsx",
  "app/(dashboard)/riwayat/page.tsx",
  "app/(dashboard)/profil/page.tsx",
  "app/(dashboard)/profil/ubah/page.tsx",
  "components/dashboard/DashboardShell.tsx",
  "components/dashboard/DashboardSidebar.tsx",
  "components/dashboard/DashboardTopbar.tsx",
  "components/dashboard/DashboardIcon.tsx",
  "components/dashboard/SignalChart.tsx",
  "components/dashboard/Sparkline.tsx",
  "components/dashboard/StatusMark.tsx",
  "components/dashboard/NotificationPanel.tsx",
  "components/dashboard/DashboardOverview.tsx",
  "components/dashboard/HistoryView.tsx",
  "components/dashboard/ProfileView.tsx",
  "components/dashboard/EditProfileView.tsx",
];

async function findMissingFiles() {
  const checks = await Promise.all(
    dashboardFiles.map(async (filePath) => {
      try {
        await access(path.join(sourceDirectory, filePath));
        return null;
      } catch {
        return filePath;
      }
    }),
  );

  return checks.filter(Boolean);
}

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

test("defines four dashboard routes with PascalCase shared components", async () => {
  assert.deepEqual(await findMissingFiles(), [], "dashboard files are missing");

  for (const componentPath of dashboardFiles.filter((file) =>
    file.startsWith("components/"),
  )) {
    assert.match(path.basename(componentPath), /^[A-Z][A-Za-z]+\.tsx$/);
  }
});

test("uses one pathname-aware, responsive, collapsible dashboard shell", async (context) => {
  if ((await findMissingFiles()).length > 0) {
    context.skip("dashboard shell has not been implemented yet");
    return;
  }

  const [layout, shell, sidebar] = await Promise.all([
    readSource("app/(dashboard)/layout.tsx"),
    readSource("components/dashboard/DashboardShell.tsx"),
    readSource("components/dashboard/DashboardSidebar.tsx"),
  ]);

  assert.match(layout, /<DashboardShell/);
  assert.match(shell, /^["']use client["'];/);
  assert.match(shell, /usePathname/);
  assert.match(shell, /useState/);
  assert.match(shell, /isCollapsed/);
  assert.match(shell, /aria-expanded/);
  assert.match(shell, /transition-/);
  assert.match(shell, /translate-x/);
  assert.match(sidebar, /href: "\/dashboard"/);
  assert.match(sidebar, /href: "\/riwayat"/);
  assert.match(sidebar, /href: "\/profil"/);
  assert.match(sidebar, /isActive/);
});

test("composes every dashboard view with the reference content", async (context) => {
  if ((await findMissingFiles()).length > 0) {
    context.skip("dashboard views have not been implemented yet");
    return;
  }

  const sources = await Promise.all(dashboardFiles.map(readSource));
  const allSource = sources.join("\n");

  for (const copy of [
    "Selamat Datang,",
    "Hasil Analisis Terakhir",
    "Sinyal PPG Terbaru",
    "Monitoring Terakhir",
    "Status Perangkat",
    "Notifikasi",
    "Riwayat Analisis",
    "Daftar Riwayat",
    "Profil Akun",
    "Informasi Profil",
    "Ubah Profil",
    "Simpan Perubahan",
  ]) {
    assert.ok(allSource.includes(copy), `missing dashboard reference copy: ${copy}`);
  }

  assert.match(
    await readSource("components/dashboard/ProfileView.tsx"),
    /href="\/profil\/ubah"/,
  );
  // The chart shows finished recordings only, so it stays static while recording.
  assert.doesNotMatch(
    await readSource("components/dashboard/SignalChart.tsx"),
    /signal-draw|monitor-sweep/,
  );
});

test("adds route-entry motion, reduced-motion support, and device navigation", async () => {
  const [globalStyles, deviceForm] = await Promise.all([
    readSource("app/globals.css"),
    readSource("components/auth/ConnectDeviceForm.tsx"),
  ]);

  assert.match(globalStyles, /dashboard-enter/);
  assert.doesNotMatch(globalStyles, /signal-draw|monitor-sweep/);
  assert.match(globalStyles, /prefers-reduced-motion/);
  assert.match(deviceForm, /useRouter/);
  assert.match(deviceForm, /router\.push\("\/dashboard"\)/);
});

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

test("floats the notification restore control beside content instead of the topbar", async () => {
  const [shellSource, topbarSource, panelSource] = await Promise.all([
    readSource("components/dashboard/DashboardShell.tsx"),
    readSource("components/dashboard/DashboardTopbar.tsx"),
    readSource("components/dashboard/NotificationPanel.tsx"),
  ]);

  assert.match(shellSource, /PanelRightOpen/);
  assert.match(shellSource, /isNotifOpenMobile/);
  assert.match(shellSource, /isNotifOpenDesktop/);
  assert.match(shellSource, /setNotifState/);
  assert.match(shellSource, /fixed right-/);
  assert.match(shellSource, /Tampilkan notifikasi/);
  assert.doesNotMatch(topbarSource, /PanelRight(?:Open|Close)/);
  assert.match(panelSource, /PanelRightClose/);
  assert.match(panelSource, /h-full/);
  assert.match(shellSource, /fixed inset-y-0 right-0/);
  assert.match(shellSource, /xl:sticky/);
});

test("keeps static dashboard cards free from hover-motion hooks", async () => {
  const viewFiles = [
    "components/dashboard/DashboardOverview.tsx",
    "components/dashboard/EditProfileView.tsx",
    "components/dashboard/HistoryView.tsx",
    "components/dashboard/ProfileView.tsx",
  ];
  const sources = await Promise.all(viewFiles.map(readSource));

  assert.doesNotMatch(sources.join("\n"), /dashboard-card/);
});

test("toggles monitoring between pause and play states with matching UI", async () => {
  const [overviewComponent, overviewHook, chartSource] = await Promise.all([
    readSource("components/dashboard/DashboardOverview.tsx"),
    readSource("components/dashboard/hooks/UseDashboardOverview.ts"),
    readSource("components/dashboard/SignalChart.tsx"),
  ]);

  const overviewSource = `${overviewComponent}\n${overviewHook}`;

  assert.match(overviewSource, /^["']use client["'];/);
  assert.match(overviewSource, /useState/);
  assert.match(overviewSource, /isMonitoringActive/);
  assert.match(overviewSource, /\bPause\b/);
  assert.match(overviewSource, /\bPlay\b/);
  assert.match(overviewSource, /aria-pressed/);
  assert.match(overviewSource, /useMonitoringSession/);
  assert.match(overviewSource, /Hentikan Monitoring/);
  assert.match(overviewSource, /Mulai Monitoring/);
  assert.match(chartSource, /isActive/);
});

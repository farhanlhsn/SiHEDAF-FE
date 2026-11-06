import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");

const viewFiles = [
  "components/dashboard/DashboardShell.tsx",
  "components/dashboard/OfflineBanner.tsx",
  "components/dashboard/DashboardSidebar.tsx",
  "components/dashboard/DashboardTopbar.tsx",
  "components/dashboard/DashboardOverview.tsx",
  "components/dashboard/FirstRunGuide.tsx",
  "components/dashboard/DeviceOfflineCard.tsx",
  "components/dashboard/SignalChart.tsx",
  "components/dashboard/PpgTrace.tsx",
  "components/dashboard/Sparkline.tsx",
  "components/dashboard/StatusMark.tsx",
  "components/dashboard/NotificationPanel.tsx",
  "components/dashboard/AiResultModal.tsx",
  "components/dashboard/DashboardModal.tsx",
  "components/dashboard/HistoryView.tsx",
  "components/dashboard/HistoryDetailModal.tsx",
  "components/dashboard/DoctorReportView.tsx",
  "components/dashboard/DateRangePicker.tsx",
  "components/dashboard/ProfileView.tsx",
  "components/dashboard/TextSizeSetting.tsx",
  "components/dashboard/InstallGuide.tsx",
  "components/dashboard/EditProfileView.tsx",
  "components/dashboard/ProfileAvatar.tsx",
  "features/profile/client/ProfileProvider.tsx",
  "components/ui/DataErrorState.tsx",
  "components/ui/BrokenSignal.tsx",
  "components/ui/FetchError.ts",
];

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

test("styles the dashboard with design tokens and readable type only", async () => {
  const sources = await Promise.all(viewFiles.map(readSource));

  for (const [index, source] of sources.entries()) {
    const file = viewFiles[index];

    assert.doesNotMatch(
      source,
      /\b(?:text|bg|border|ring|from|via|to|fill|stroke|outline)-\[#/,
      `${file} uses a raw hex colour instead of a token`,
    );
    for (const [, size] of source.matchAll(/text-\[([\d.]+)rem\]/g)) {
      assert.ok(Number(size) >= 0.8125, `${file} has type below 13px (${size}rem)`);
    }
    assert.doesNotMatch(
      source,
      /(?<!placeholder:)text-primary-900\/(?:[1-6]\d|[1-9])\b/,
      `${file} has navy text below 70% opacity`,
    );
    assert.doesNotMatch(
      source,
      /font-serif/,
      `${file} uses an italic serif accent`,
    );
  }
});

test("never shows invented health or device data", async () => {
  const [overview, overviewHook, aiModal, history, profile, editProfile] =
    await Promise.all([
      readSource("components/dashboard/DashboardOverview.tsx"),
      readSource("components/dashboard/hooks/UseDashboardOverview.ts"),
      readSource("components/dashboard/AiResultModal.tsx"),
      readSource("components/dashboard/HistoryView.tsx"),
      readSource("components/dashboard/ProfileView.tsx"),
      readSource("components/dashboard/EditProfileView.tsx"),
    ]);
  const all = [
    overview,
    overviewHook,
    aiModal,
    history,
    profile,
    editProfile,
  ].join("\n");

  assert.doesNotMatch(all, /PPG001/, "device ID must come from the API");
  assert.doesNotMatch(all, /92%/, "battery level is not provided by the API");
  assert.doesNotMatch(
    all,
    /95%|\?\? 95\b/,
    "AI confidence must not fall back to a made-up 95%",
  );
  assert.doesNotMatch(all, /Rythm/, "typo in the rhythm label");
  assert.match(overview, /formatConfidence/);
  assert.match(aiModal, /formatConfidence/);
});

test("reads the registered device for profile pages from the device API", async () => {
  const [hook, profile, editProfile, overviewHook] = await Promise.all([
    readSource("components/dashboard/hooks/UseMyDevice.ts"),
    readSource("components/dashboard/ProfileView.tsx"),
    readSource("components/dashboard/EditProfileView.tsx"),
    readSource("components/dashboard/hooks/UseDashboardOverview.ts"),
  ]);

  assert.match(hook, /\/api\/v1\/measurement\/my-device/);
  assert.match(profile, /useMyDevice/);
  assert.match(editProfile, /useMyDevice/);
  assert.match(overviewHook, /useMyDevice/);
});

test("opens the overview with a plain-language status sentence", async () => {
  const overview = await readSource(
    "components/dashboard/DashboardOverview.tsx",
  );

  assert.match(overview, /Irama terakhirmu/);
  assert.match(overview, /konsultasi/i, "AF results point people to a doctor");
});

test("draws the sidebar as a rail of stops with the current page marked", async () => {
  const sidebar = await readSource("components/dashboard/DashboardSidebar.tsx");

  assert.match(sidebar, /aria-current=\{isActive \? "page" : undefined\}/);
  assert.match(sidebar, /data-rail/);
});

test("draws every PPG trace through the shared tracePath helper", async () => {
  const [trace, sparkline, chart] = await Promise.all([
    readSource("components/dashboard/PpgTrace.tsx"),
    readSource("components/dashboard/Sparkline.tsx"),
    readSource("components/dashboard/SignalChart.tsx"),
  ]);

  assert.match(trace, /tracePath/);
  assert.match(trace, /Grafik tidak tersedia/);
  for (const source of [sparkline, chart]) {
    assert.match(source, /tracePath\(/);
    assert.doesNotMatch(source, /maxVal/);
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");
const projectDirectory = path.resolve(sourceDirectory, "..");

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

test("uses a controlled, themed date range picker", async () => {
  const [pickerSource, historySource, globalStyles, packageSource] = await Promise.all([
    readSource("components/dashboard/DateRangePicker.tsx"),
    readSource("components/dashboard/HistoryView.tsx"),
    readSource("app/globals.css"),
    readFile(path.join(projectDirectory, "package.json"), "utf8"),
  ]);

  assert.match(packageSource, /@daypicker\/react/);
  assert.match(pickerSource, /^"use client";/);
  assert.match(pickerSource, /DayPicker/);
  assert.match(pickerSource, /mode="range"/);
  assert.match(pickerSource, /selected=/);
  assert.match(pickerSource, /onSelect=/);
  assert.match(historySource, /<DateRangePicker/);
  assert.match(globalStyles, /\.rdp-root/);
});

test("connects dashboard profile and monitoring range controls", async () => {
  const [topbarSource, overviewSource] = await Promise.all([
    readSource("components/dashboard/DashboardTopbar.tsx"),
    readSource("components/dashboard/DashboardOverview.tsx"),
  ]);

  assert.match(topbarSource, /href="\/profil"/);
  assert.match(overviewSource, /monitoringRange/);
  assert.match(overviewSource, /setMonitoringRange/);
  assert.match(overviewSource, /<select/);
  // /signals holds finished recordings only: the card never promises live updates.
  assert.doesNotMatch(overviewSource, /Pembaruan otomatis selama/);
  assert.ok(
    overviewSource.includes(
      "Grafik menampilkan rekaman yang sudah selesai; rekaman ini tampil setelah selesai.",
    ),
  );
});

test("paginates history rows and lets users choose page size", async () => {
  const [historyComponent, historyHook] = await Promise.all([
    readSource("components/dashboard/HistoryView.tsx"),
    readSource("components/dashboard/hooks/UseHistoryView.ts"),
  ]);
  const historySource = `${historyComponent}\n${historyHook}`;

  assert.match(historySource, /^"use client";/);
  assert.match(historySource, /currentPage/);
  assert.match(historySource, /itemsPerPage/);
  assert.match(historySource, /setCurrentPage/);
  assert.match(historySource, /setHistoryData/);
  assert.match(historySource, /aria-current/);
  assert.match(historySource, /<ScrollArea/);
  assert.match(historySource, /min-w-\[680px\]/);
  assert.match(historySource, /type PageItem/);
  assert.match(historySource, /pages\.map/);
  assert.match(historySource, /hiddenOnMobile/);
  assert.match(historySource, /hidden sm:inline/);
  assert.doesNotMatch(historySource, /overflow-x-auto|min-w-\[900px\]/);
});

test("supports account modals, backend profile save, and authenticated logout", async () => {
  const [modalSource, profileSource, editSource] = await Promise.all([
    readSource("components/dashboard/DashboardModal.tsx"),
    readSource("components/dashboard/ProfileView.tsx"),
    readSource("components/dashboard/EditProfileView.tsx"),
  ]);

  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(profileSource, /^"use client";/);
  assert.match(profileSource, /DashboardModal/);
  assert.match(profileSource, /Ubah kata sandi/);
  assert.match(profileSource, /useLogout/);
  assert.match(profileSource, /router\.replace\("\/login"\)/);
  assert.match(editSource, /^"use client";/);
  assert.match(editSource, /useUpdateProfile/);
  assert.match(editSource, /name="email"/);
  assert.match(editSource, /disabled/);
  assert.match(editSource, /DashboardModal/);
  assert.match(editSource, /router\.push\("\/profil"\)/);
});

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

const consumers = [
  "components/dashboard/HistoryView.tsx",
  "components/dashboard/DoctorReportView.tsx",
  "features/profile/client/ProfileProvider.tsx",
  "components/dashboard/NotificationPanel.tsx",
  "components/dashboard/DashboardOverview.tsx",
];

test("every data error uses the shared DataErrorState", async () => {
  for (const file of consumers) {
    assert.match(await read(file), /<DataErrorState/, `${file} lacks DataErrorState`);
  }
});

test("the overview shows an error instead of the first-run guide", async () => {
  const overview = await read("components/dashboard/DashboardOverview.tsx");
  const hook = await read("components/dashboard/hooks/UseDashboardOverview.ts");
  assert.match(overview, /Hasil terakhir belum bisa dimuat\./);
  assert.match(hook, /showFirstRun =\s*[^;]*!latestError/s);
  assert.match(hook, /reloadLatest/);
});

test("raw error messages never reach the UI", async () => {
  for (const file of [
    ...consumers,
    "components/ui/DataErrorState.tsx",
    "components/ui/BrokenSignal.tsx",
  ]) {
    assert.doesNotMatch(
      await read(file),
      /\b(?:err|error|e)\.message\b/,
      `${file} renders a raw error message`,
    );
  }
});

test("DataErrorState is an alert with a 48px retry", async () => {
  const source = await read("components/ui/DataErrorState.tsx");
  assert.match(source, /role="alert"/);
  assert.match(source, /Coba lagi/);
  assert.match(source, /h-12/);
});

test("DeviceOfflineCard guides the reader without naming a connection type", async () => {
  const source = await read("components/dashboard/DeviceOfflineCard.tsx");
  for (const text of [
    "Pastikan wristband menyala dan terpasang di pergelangan tangan.",
    "Pastikan baterainya cukup; isi daya bila perlu.",
    "Pastikan wristband berada di dekat jaringan yang biasa dipakai saat penyambungan, lalu tunggu beberapa menit.",
    "Masih belum terhubung? Sambungkan ulang perangkat.",
    "Wristband belum terhubung",
    "Terakhir terlihat",
    "Belum pernah terlihat",
    "Belum ada perangkat terhubung",
    "Periksa lagi",
    'href="/hubungkan-perangkat"',
    "<ol",
    "<DataErrorState",
  ]) {
    assert.ok(source.includes(text), `missing: ${text}`);
  }
  assert.doesNotMatch(source, /wi-?fi|bluetooth/i);
  assert.match(source, /h-12/);
  assert.match(source, /focus-visible:/);
});

test("the overview renders the offline card instead of the old sentence", async () => {
  const overview = await read("components/dashboard/DashboardOverview.tsx");
  assert.doesNotMatch(
    overview,
    /Monitoring bisa dimulai setelah perangkat terhubung kembali\./,
  );
  assert.match(overview, /<DeviceOfflineCard/);
});

test("a device re-check shows it is working without hiding the card", async () => {
  const hook = await read("components/dashboard/hooks/UseMyDevice.ts");
  assert.match(hook, /const \[isRefreshing, setIsRefreshing\] = useState\(false\)/);
  assert.match(hook, /setIsRefreshing\(true\);\s*setReloadCount/);
  // A re-check never flips the card back to loading.
  assert.doesNotMatch(hook, /setIsLoading\(true\)/);
  assert.match(hook, /return \{ device, isLoading, isRefreshing, error, reload \}/);

  const card = await read("components/dashboard/DeviceOfflineCard.tsx");
  assert.match(card, /disabled=\{refreshing\}/);
  assert.match(card, /aria-busy=\{refreshing \|\| undefined\}/);
  assert.ok(card.includes('refreshing ? "Memeriksa…" : "Periksa lagi"'));
  assert.match(card, /retrying=\{refreshing\}/);

  const errorState = await read("components/ui/DataErrorState.tsx");
  assert.match(errorState, /retrying\?: boolean/);
  assert.match(errorState, /disabled=\{retrying\}/);
  assert.match(errorState, /aria-busy=\{retrying \|\| undefined\}/);
  assert.ok(errorState.includes('retrying ? "Memuat ulang…" : "Coba lagi"'));
});

test("a failed device request says the wristband status could not be loaded", async () => {
  const card = await read("components/dashboard/DeviceOfflineCard.tsx");
  assert.ok(card.includes('title="Status wristband belum bisa dimuat"'));
  assert.match(card, /message=\{`\$\{error\.title\}\. \$\{error\.message\}`\}/);
});

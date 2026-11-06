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

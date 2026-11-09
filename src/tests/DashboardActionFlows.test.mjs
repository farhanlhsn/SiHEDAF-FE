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

test("/signals is read once the first /latest answered, then on range change, reconnect, a new result and a retry; never polled", async () => {
  const hook = await readSource("components/dashboard/hooks/UseDashboardOverview.ts");
  // The backend only returns COMPLETED sessions: polling while recording is wasted traffic.
  assert.doesNotMatch(hook, /setInterval/);
  assert.doesNotMatch(hook, /isMonitoringActive\]/);
  const start = hook.indexOf("if (!hasLoadedLatest) return;");
  assert.ok(start > 0, "the signals effect waits for the first /latest");
  const effect = hook.slice(start, hook.indexOf("\n  ]);", start) + 6);
  // Waiting for the first /latest (which sets the result keys) makes a load read /signals once.
  assert.match(hook, /useEffect\(\(\) => \{\s*if \(!hasLoadedLatest\) return;\s*\/\/[^\n]*\n\s*const run = new AbortController\(\);/);
  assert.match(
    effect,
    /\}, \[\s*hasLoadedLatest,\s*monitoringRange,\s*reconnectCount,\s*resultId,\s*resultCompletedAt,\s*signalsReloadKey,\s*\]\);$/,
  );
  assert.match(hook, /const resultId = latestData\?\.id;\s*const resultCompletedAt = latestData\?\.completedAt;/);
  // A newer run or unmounting aborts the request; a late answer is ignored.
  assert.match(effect, /signal: requestSignal\(run\.signal\)/);
  assert.match(effect, /const json = res\.ok \? await res\.json\(\) : null;\s*if \(run\.signal\.aborted\) return;/);
  assert.match(effect, /if \(run\.signal\.aborted \|\| e instanceof SessionExpiredError\) return;/);
  assert.match(effect, /return \(\) => run\.abort\(\);/);
});

test("a failed /signals read is kept as an error with a retry, never shown as no signal", async () => {
  const hook = await readSource("components/dashboard/hooks/UseDashboardOverview.ts");
  assert.match(hook, /const \[signalsError, setSignalsError\] = useState<DataError \| null>\(null\);/);
  // A non-200 answer is an HttpError; a good answer clears the error.
  assert.match(hook, /if \(json\?\.code !== 200 \|\| !json\.data\) throw new HttpError\(res\.status\);\s*setSignalsData\(json\.data\.rawPpgData \|\| \[\]\);\s*setSignalsError\(null\);/);
  assert.match(
    hook,
    /console\.error\("Gagal memuat data sinyal:", e\);\s*setSignalsError\(\s*describeCaughtError\(e, e instanceof HttpError \? e\.status : undefined\),\s*\);/,
  );
  // The retry keeps the panel (and focus) until its answer.
  assert.match(hook, /\} finally \{\s*if \(!run\.signal\.aborted\) setIsSignalsRetrying\(false\);\s*\}/);
  assert.match(
    hook,
    /const reloadSignals = useCallback\(\(\) => \{\s*setIsSignalsRetrying\(true\);\s*setSignalsReloadKey\(\(key\) => key \+ 1\);\s*\}, \[\]\);/,
  );
  assert.match(hook, /signalsError,\s*reloadSignals,\s*isSignalsRetrying,/);

  const overview = await readSource("components/dashboard/DashboardOverview.tsx");
  assert.match(
    overview,
    /\{signalsError \? \(\s*<div[^>]*>\s*<DataErrorState\s*compact\s*live="status"\s*message=\{signalsError\.message\}\s*onRetry=\{reloadSignals\}\s*retrying=\{isSignalsRetrying\}\s*title="Grafik belum bisa dimuat"\s*\/>\s*<\/div>\s*\) : \(\s*<SignalChart/,
  );
  // The empty-state sentence belongs to the chart, which is not shown on an error.
  assert.doesNotMatch(overview, /Belum ada sinyal pada rentang ini\./);
  assert.ok(
    (await readSource("components/dashboard/SignalChart.tsx")).includes("Belum ada sinyal pada rentang ini."),
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
  // Prev/next keep their word as the accessible name on phones (icon only visually).
  assert.match(historySource, /sr-only sm:not-sr-only">Sebelumnya</);
  assert.match(historySource, /sr-only sm:not-sr-only">Selanjutnya</);
  assert.doesNotMatch(historySource, /aria-label="Halaman (sebelumnya|berikutnya)"/);
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

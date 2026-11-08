import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (file) => readFile(path.join(sourceDirectory, file), "utf8");

async function sourceFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await sourceFiles(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return found;
}

test("Riwayat explains the UTC date filter and the server summary", async () => {
  const view = await read("components/dashboard/HistoryView.tsx");
  const notes = await read("components/dashboard/HistoryNotes.ts");

  // The filter note is built from the offset at the range's start date.
  assert.match(view, /dateFilterNote\(-dateRange\.from\.getTimezoneOffset\(\)\)/);
  assert.match(view, /\{filterNote\}/);
  assert.ok(notes.includes("Filter tanggal memakai hari UTC, jadi satu tanggal di daftar ini mencakup"));
  assert.ok(notes.includes("keesokan harinya"));
  assert.ok(notes.includes("hari sebelumnya"));
  assert.ok(notes.includes("(waktu setempat)."));
  // Not Intl: the clock text comes from the offset arithmetic.
  assert.doesNotMatch(notes, /Intl|toLocale/);

  // The summary note is always shown; the range note stays.
  assert.match(view, /\{SUMMARY_COMPUTED_NOTE\}/);
  assert.ok(
    notes.includes(
      "Angka ringkasan dihitung server: Ritme Normal juga mencakup rekaman yang terlalu singkat atau tanpa hasil AI, dan Terdeteksi AF belum mencakup AFL. Hasil tiap rekaman ada di daftar di bawah.",
    ),
  );
  assert.ok(view.includes("Ringkasan mencakup seluruh riwayat, bukan hanya rentang tanggal yang dipilih."));
});

test("DataErrorState keeps focus on a waiting retry and hands it on when it unmounts", async () => {
  const panel = await read("components/ui/DataErrorState.tsx");

  assert.match(panel, /aria-disabled=\{retrying \|\| undefined\}/);
  assert.doesNotMatch(panel, /disabled=\{retrying\}/);
  assert.match(panel, /aria-disabled:cursor-wait/);
  assert.match(panel, /if \(!retrying\) onRetry\(\)/);

  assert.match(panel, /live\?: "alert" \| "status"/);
  assert.match(panel, /live = "alert"/);
  assert.match(panel, /role=\{live\}/);

  assert.match(panel, /useLayoutEffect/);
  assert.match(panel, /panel\.contains\(document\.activeElement\)/);
  assert.match(panel, /requestAnimationFrame/);
  assert.match(panel, /if \(!heading\.hasAttribute\("tabindex"\)\) heading\.setAttribute\("tabindex", "-1"\);/);
  assert.match(panel, /heading\.focus\(\{ preventScroll: true \}\)/);
});

test("the heading hand-off walks up to the nearest main, dialog or body, and only takes dropped focus", async () => {
  const panel = await read("components/ui/DataErrorState.tsx");
  const handOff = await read("components/ui/FocusHandOff.ts");

  // The chain is read in the layout cleanup, while the panel still has its
  // ancestors; the heading is chosen a frame later from what is still there.
  assert.match(
    panel,
    /if \(!panel \|\| !panel\.contains\(document\.activeElement\)\) return;\s*const chain = focusChain\(panel\);\s*requestAnimationFrame\(\(\) => \{\s*const heading = headingToFocus\(\s*chain,\s*document\.activeElement,\s*document\.body,\s*\);\s*if \(!heading\) return;/,
  );
  assert.doesNotMatch(panel, /parent\.isConnected|parent\.querySelector/);

  assert.ok(handOff.includes(`export const FOCUS_CHAIN_END = 'main, [role="dialog"], body';`));
  assert.ok(handOff.includes('export const FOCUS_HEADINGS = "h1, h2, h3, h4";'));
  // From the parent upward, including the element it stops at.
  assert.match(
    handOff,
    /for \(let node = panel\.parentElement; node; node = node\.parentElement\) \{\s*chain\.push\(node\);\s*if \(node\.matches\(FOCUS_CHAIN_END\)\) break;\s*\}/,
  );
  // Focus that something else took meanwhile (a dialog that just opened) stays.
  assert.match(handOff, /if \(active && active !== body\) return null;\s*for \(const node of chain\) \{\s*if \(!node\.isConnected\) continue;/);
});

test("\"Periksa lagi\" keeps focus while the wristband is checked again", async () => {
  const card = await read("components/dashboard/DeviceOfflineCard.tsx");
  const start = card.indexOf("<button");
  const button = card.slice(start, card.indexOf("</button>", start));

  assert.match(button, /aria-disabled=\{refreshing \|\| undefined\}/);
  assert.match(button, /aria-busy=\{refreshing \|\| undefined\}/);
  // No disabled attribute (it would drop focus to <body>); clicks are ignored instead.
  assert.doesNotMatch(button, /(?<![\w-])disabled=\{/);
  assert.match(button, /onClick=\{\(\) => \{[\s\S]*?if \(!refreshing\) onRetry\(\);\s*\}\}/);
  // The same waiting look as before, through aria-disabled variants.
  for (const variant of [
    "aria-disabled:cursor-wait",
    "aria-disabled:border-primary-900/15",
    "aria-disabled:text-primary-900/70",
    "aria-disabled:hover:bg-white",
  ]) {
    assert.ok(button.includes(variant), `missing ${variant}`);
  }
  assert.doesNotMatch(button, /(?<![\w-])disabled:/);
  assert.ok(button.includes('refreshing ? "Memeriksa…" : "Periksa lagi"'));
});

test("only the secondary error panels announce politely", async () => {
  const status = [
    "components/dashboard/NotificationPanel.tsx",
    "components/dashboard/DeviceOfflineCard.tsx",
  ];
  const alert = [
    "components/dashboard/DashboardOverview.tsx",
    "components/dashboard/HistoryView.tsx",
    "components/dashboard/DoctorReportView.tsx",
    "features/profile/client/ProfileProvider.tsx",
  ];
  for (const file of status) {
    assert.match(await read(file), /live="status"/, `${file} should be a status panel`);
  }
  for (const file of alert) {
    assert.doesNotMatch(await read(file), /live="status"/, `${file} should stay an alert`);
  }
});

test("HttpError has one home", async () => {
  const files = await sourceFiles(sourceDirectory);
  const declaring = [];
  for (const file of files) {
    if (/class HttpError\b/.test(await readFile(file, "utf8"))) {
      declaring.push(path.relative(sourceDirectory, file));
    }
  }
  assert.deepEqual(declaring, ["components/ui/FetchError.ts"]);
  assert.match(await read("components/ui/FetchError.ts"), /constructor\(readonly status\?: number\)/);
});

test("dead bind code and dead dashboard motion are gone", async () => {
  const service = await read("features/device/server/services/DeviceService.ts");
  const errors = await read("features/device/server/DeviceServiceError.ts");
  assert.doesNotMatch(service, /bindDevice|BackendBindResponseSchema|DeviceServiceError/);
  assert.match(service, /export async function checkDeviceBound/);
  assert.doesNotMatch(errors, /class DeviceServiceError/);
  for (const name of ["DEVICE_SERVICE_UNAVAILABLE", "DEVICE_NOT_FOUND", "DEVICE_ALREADY_BOUND"]) {
    assert.match(errors, new RegExp(`export const ${name}`));
  }

  const css = await read("app/globals.css");
  assert.doesNotMatch(css, /signal-draw|monitor-sweep/);
  for (const file of await sourceFiles(sourceDirectory)) {
    assert.doesNotMatch(await readFile(file, "utf8"), /signal-draw|monitor-sweep/, file);
  }
});

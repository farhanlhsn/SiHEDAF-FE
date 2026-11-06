# History Detail, Doctor Report, and First-Run Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people open one analysis in detail, print a doctor-ready report for a date range, and give brand-new users a 3-step guide on an empty dashboard.

**Architecture:** All new behaviour sits on the existing API (`/api/v1/measurement/history`, `/latest`, `/my-device`) and profile provider. Logic that can be wrong lives in pure, unit-tested modules (`DashboardFormat.ts`, `ReportRange.ts`, `ReportData.ts`, `FirstRun.ts`); React hooks own fetching and state; components only render. The report is a print-styled route inside the `(dashboard)` group, saved as PDF through the browser print dialog.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, TypeScript 6, Tailwind CSS 4, `@daypicker/react`, Lucide React, Node test runner via `tsx --test`, Playwright for the smoke check.

**Spec:** `docs/superpowers/specs/2026-11-06-history-detail-report-onboarding-design.md`

## Global Constraints

- No new API endpoints and no new npm dependencies.
- No seconds, BPM, or peak detection anywhere: the PPG sampling rate is unknown; charts have no time axis.
- Missing values render as "—" or "Tidak tersedia" via `DashboardFormat.ts`; never a made-up number.
- Every AF presentation pairs colour with icon/label and points to a doctor; copy states the result is not a diagnosis.
- Dashboard styling rules from `src/tests/DashboardRedesign.test.mjs` apply to every new component file: tokens only (no `-[#` colours), type ≥ 13px, navy text ≥ `/70`, no `font-serif`.
- Dates are Asia/Jakarta calendar days formatted `YYYY-MM-DD`.
- Components PascalCase; state/fetch/handlers in `components/dashboard/hooks/Use*.ts`; internal imports use `@/`.
- Quality gate before claiming done: `npm test`, `npm run lint`, `npm run build`.

## Review Focus

- A history item with no or a single-sample `rawPpgData`: detail modal and report must show "Grafik tidak tersedia", not crash or draw a dot → test in Task 1.
- A report range with no records (API `totalPages` 0 or 1 with empty `data`): one request, empty AF list, no loop → test in Task 4.
- An AF item without `requestedAt`: still listed, sorted last, time shown as "—" → test in Task 4.
- Hand-edited or stale URLs (`from=abc`, `2026-02-30`, reversed range, repeated params): fall back to the default 30-day range → test in Task 2.
- Changing the report range quickly: an older, slower response must not overwrite the newer range's data → contract test in Task 5.

---

### Task 1: Shared trace path and `PpgTrace`

**Files:**
- Modify: `src/components/dashboard/DashboardFormat.ts`
- Modify: `src/components/dashboard/Sparkline.tsx`, `src/components/dashboard/SignalChart.tsx`
- Create: `src/components/dashboard/PpgTrace.tsx`
- Test: `src/tests/DashboardFormat.test.ts`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Produces: `tracePath(data: ReadonlyArray<number> | undefined, width: number, height: number, padding?: number): string | null` — `null` when fewer than 2 points; x evenly spread `0…width`; y maps max → `padding`, min → `height − padding`; flat data → `height / 2`; numbers rounded to 1 decimal, rendered without trailing `.0`.
- Produces: `PpgTrace` props `{ data?: number[]; tone?: "blue" | "pink"; label: string; className?: string }` — `role="img"`, `aria-label={label}`, viewBox `0 0 600 120`, `preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"`, padding 8; renders the text "Grafik tidak tersedia" when `tracePath` is `null`.

- [ ] **Step 1: Write the failing tests** in `src/tests/DashboardFormat.test.ts`

```ts
test("draws a PPG trace with the highest value at the top", () => {
  assert.equal(tracePath([0, 10, 5], 100, 40), "M0 40L50 0L100 20");
  assert.equal(tracePath([0, 10, 5], 100, 40, 4), "M0 36L50 4L100 20");
});

test("refuses to draw a trace from missing or single-sample data", () => {
  assert.equal(tracePath(undefined, 100, 40), null);
  assert.equal(tracePath([], 100, 40), null);
  assert.equal(tracePath([7], 100, 40), null);
});

test("centres a flat signal instead of dividing by zero", () => {
  assert.equal(tracePath([3, 3, 3], 100, 40), "M0 20L50 20L100 20");
});
```

Add `"components/dashboard/PpgTrace.tsx"` to `viewFiles` in `src/tests/DashboardRedesign.test.mjs`, plus a test asserting `PpgTrace.tsx` matches `/tracePath/` and `/Grafik tidak tersedia/`, and that `Sparkline.tsx` and `SignalChart.tsx` both match `/tracePath\(/` and no longer contain `maxVal`.

- [ ] **Step 2: Run to verify RED**

Run: `npx tsx --test src/tests/DashboardFormat.test.ts src/tests/DashboardRedesign.test.mjs`
Expected: FAIL — `tracePath` is not exported; `PpgTrace.tsx` missing.

- [ ] **Step 3: Implement `tracePath` in `DashboardFormat.ts`, create `PpgTrace.tsx`, and switch `Sparkline` (`tracePath(data, 190, 34, 2) ?? placeholderPath`) and `SignalChart` (`tracePath(data, 760, 112, 8) ?? placeholderPath`) to it.** Keep each component's existing placeholder path and props; only the normalisation moves.

- [ ] **Step 4: Run to verify GREEN**

Run: `npm test`
Expected: all tests pass (existing chart tests included).

- [ ] **Step 5: Commit** — `feat(dashboard): share PPG trace path and add PpgTrace`

---

### Task 2: Report date ranges

**Files:**
- Create: `src/components/dashboard/ReportRange.ts`
- Test: `src/tests/ReportRange.test.ts`

**Interfaces:**
- Produces: `type ReportRange = { from: string; to: string }` (`YYYY-MM-DD`, Jakarta days, inclusive).
- Produces: `jakartaDay(date: Date): string`; `addDays(day: string, days: number): string`.
- Produces: `defaultReportRange(now: Date): ReportRange` → `{ from: addDays(today, -29), to: today }`.
- Produces: `rangeEndingOn(iso: string | undefined): ReportRange | null` → 30 inclusive days ending on that instant's Jakarta day; `null` for missing/invalid.
- Produces: `parseReportRange(params: { from?: string | string[]; to?: string | string[] }, now: Date): ReportRange` → returns the params only when both are single strings, match `^\d{4}-\d{2}-\d{2}$`, are real calendar dates, and `from <= to`; otherwise `defaultReportRange(now)`.
- Produces: `reportHref(range?: ReportRange | null): string` → `"/riwayat/laporan"` or `"/riwayat/laporan?from=…&to=…"`.
- Produces: `localDay(date: Date): string` (calendar picker dates, local parts); `rangeFromDateRange(range?: { from?: Date; to?: Date }): ReportRange | null` (both ends required); `toDateRange(range: ReportRange): { from: Date; to: Date }` (local midnight dates for `DateRangePicker`).

- [ ] **Step 1: Write the failing tests** in `src/tests/ReportRange.test.ts`

```ts
test("defaults to the last 30 Jakarta days, today included", () => {
  assert.deepEqual(defaultReportRange(new Date("2026-11-06T10:00:00Z")), { from: "2026-10-08", to: "2026-11-06" });
});

test("uses the Jakarta calendar day near midnight UTC", () => {
  assert.equal(jakartaDay(new Date("2026-11-06T18:30:00Z")), "2026-11-07");
  assert.deepEqual(defaultReportRange(new Date("2026-11-06T18:30:00Z")), { from: "2026-10-09", to: "2026-11-07" });
});

test("steps across month and year boundaries", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-01-01", -29), "2025-12-03");
});

test("builds the 30-day window that ends on a history item", () => {
  assert.deepEqual(rangeEndingOn("2026-11-06T10:58:00Z"), { from: "2026-10-08", to: "2026-11-06" });
  assert.equal(rangeEndingOn(undefined), null);
  assert.equal(rangeEndingOn("nope"), null);
});

test("keeps a valid range from the URL", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  assert.deepEqual(parseReportRange({ from: "2026-09-01", to: "2026-09-30" }, now), { from: "2026-09-01", to: "2026-09-30" });
});

test("falls back to the default range for hand-edited URLs", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  const fallback = { from: "2026-10-08", to: "2026-11-06" };
  for (const params of [
    {},
    { from: "2026-09-01" },
    { from: "abc", to: "2026-09-30" },
    { from: "2026-02-30", to: "2026-03-05" },
    { from: "2026-09-30", to: "2026-09-01" },
    { from: ["2026-09-01", "2026-09-02"], to: "2026-09-30" },
  ]) {
    assert.deepEqual(parseReportRange(params, now), fallback, JSON.stringify(params));
  }
});

test("links to the report with or without a range", () => {
  assert.equal(reportHref(null), "/riwayat/laporan");
  assert.equal(reportHref({ from: "2026-09-01", to: "2026-09-30" }), "/riwayat/laporan?from=2026-09-01&to=2026-09-30");
});

test("converts between picker dates and report days", () => {
  assert.equal(localDay(new Date(2026, 8, 1)), "2026-09-01");
  assert.deepEqual(rangeFromDateRange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) }), { from: "2026-09-01", to: "2026-09-30" });
  assert.equal(rangeFromDateRange({ from: new Date(2026, 8, 1) }), null);
  assert.equal(localDay(toDateRange({ from: "2026-09-01", to: "2026-09-30" }).to), "2026-09-30");
});
```

- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/ReportRange.test.ts` → FAIL, module missing.

- [ ] **Step 3: Implement `ReportRange.ts`.** `jakartaDay` uses `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" })`; `addDays` does UTC date arithmetic on the parsed day (no local-time drift); "real calendar date" means `addDays(day, 0) === day`.

- [ ] **Step 4: Run to verify GREEN** — `npx tsx --test src/tests/ReportRange.test.ts` → PASS.

- [ ] **Step 5: Commit** — `feat(dashboard): add report date range helpers`

---

### Task 3: History detail modal and clickable rows

**Files:**
- Modify: `src/components/dashboard/DashboardModal.tsx` (add `size`)
- Create: `src/components/dashboard/HistoryDetailModal.tsx`
- Modify: `src/components/dashboard/hooks/UseHistoryView.ts`, `src/components/dashboard/HistoryView.tsx`
- Test: `src/tests/HistoryReport.test.mjs` (new), `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Consumes: `PpgTrace` (Task 1); `rangeEndingOn`, `reportHref` (Task 2); `formatWib`, `formatConfidence`, `isNormalResult`; `HistoryItem` from `UseHistoryView`.
- Produces: `DashboardModal` prop `size?: "default" | "wide"` → `max-w-[480px]` / `max-w-[760px]`.
- Produces: `HistoryDetailModal` props `{ item: HistoryItem | null; onClose: () => void }`; open when `item` is not null.
- Produces: `useHistoryView()` additionally returns `selectedItem: HistoryItem | null`, `setSelectedItem(item: HistoryItem | null)`.

- [ ] **Step 1: Write failing contract tests** in `src/tests/HistoryReport.test.mjs`:
  - `HistoryView.tsx` contains a `<button` whose `aria-label` starts with `Lihat detail analisis`, calls `setSelectedItem(row)` from both the row `onClick` and the button, and renders `<HistoryDetailModal`.
  - `HistoryDetailModal.tsx` uses `DashboardModal` with `size="wide"`, `PpgTrace`, `formatConfidence`, `Tidak tersedia`, both plain-language sentences from the spec verbatim, `bukan diagnosis`, and `reportHref(rangeEndingOn(` behind the AF branch with the label `Buat laporan dokter`.
  - `DashboardModal.tsx` matches `/max-w-\[760px\]/` and `/size\?: "default" \| "wide"/`.
  - Add `HistoryDetailModal.tsx` to `viewFiles` in `DashboardRedesign.test.mjs`.

- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/HistoryReport.test.mjs src/tests/DashboardRedesign.test.mjs` → FAIL.

- [ ] **Step 3: Implement** the modal per spec §1 (facts: Waktu, Keyakinan AI, Device ID; `PpgTrace` tone by result; actions "Tutup" and, for AF only, a `Link` "Buat laporan dokter"), the `size` prop, hook state, and row interaction (row `cursor-pointer hover:bg-paper`; first cell's date/time wrapped in the accessible button). Existing pagination and table contracts must keep passing.

- [ ] **Step 4: Run to verify GREEN** — `npm test` → all pass.

- [ ] **Step 5: Commit** — `feat(dashboard): open a detail modal for each history analysis`

---

### Task 4: Report data collection

**Files:**
- Create: `src/components/dashboard/ReportData.ts`
- Test: `src/tests/ReportData.test.ts`

**Interfaces:**
- Consumes: `ReportRange` (Task 2); `isNormalResult`; `HistoryItem` (type-only import).
- Produces:
  - `type ReportSummary = { totalData: number; totalAfib: number; totalNormal: number }`
  - `type HistoryPage = { items: HistoryItem[]; totalPages: number; summary: ReportSummary }`
  - `type FetchHistoryPage = (page: number, pageSize: number, range: ReportRange) => Promise<HistoryPage>`
  - `type ReportData = { summary: ReportSummary; afEvents: HistoryItem[]; scanned: number; truncated: boolean }`
  - `collectReport(fetchPage: FetchHistoryPage, range: ReportRange, options?: { pageSize?: number; maxPages?: number }): Promise<ReportData>` — defaults `pageSize = 50`, `maxPages = 10`; fetches pages sequentially from 1 to `min(max(totalPages, 1), maxPages)`; `summary` from page 1; `afEvents` = items with `isNormalResult(label) === false`, newest `requestedAt` first, missing dates last; `truncated = totalPages > maxPages`.

- [ ] **Step 1: Write the failing tests** in `src/tests/ReportData.test.ts` with a recording fake fetcher (`calls: Array<[page, pageSize, range]>`). Name and pin:
  - `stops at the last page the API reports` → `totalPages: 2` ⇒ `calls` pages `[1, 2]`, `truncated === false`, `scanned` = total items returned.
  - `stops at maxPages and says the report is partial` → `totalPages: 5`, `{ maxPages: 2 }` ⇒ pages `[1, 2]`, `truncated === true`.
  - `fetches once for an empty range` → `totalPages: 0`, no items ⇒ pages `[1]`, `afEvents` `[]`, `scanned 0`.
  - `keeps only AF results, newest first, undated last` → items `{id:1,"Normal Rhythm"}`, `{id:2,"AF Detected",2026-11-01T…}`, `{id:3,"AF Detected",(no requestedAt)}`, `{id:4,"Atrial Fibrillation",2026-11-05T…}`, `{id:5,(no label)}` ⇒ `afEvents.map(e => e.id)` deep-equals `[4, 2, 3]`.
  - `uses the first page's summary as the official totals` → page 2 returns a different summary ⇒ result equals page 1's.
  - `passes the page size and range through` → `{ pageSize: 50 }` ⇒ every call has `50` and the same range object.
  - `rejects when a page fails` → fetcher rejects on page 2 ⇒ `assert.rejects(collectReport(...), /Gagal/)`.

- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/ReportData.test.ts` → FAIL, module missing.

- [ ] **Step 3: Implement `collectReport`** (sequential `for` loop, no parallel requests).

- [ ] **Step 4: Run to verify GREEN** — `npx tsx --test src/tests/ReportData.test.ts` → PASS.

- [ ] **Step 5: Commit** — `feat(dashboard): collect AF events and totals for the doctor report`

---

### Task 5: Doctor report page, print styles, and entry points

**Files:**
- Create: `src/app/(dashboard)/riwayat/laporan/page.tsx`
- Create: `src/components/dashboard/hooks/UseDoctorReport.ts`, `src/components/dashboard/DoctorReportView.tsx`
- Modify: `src/components/dashboard/DashboardShell.tsx` (route title, `print:hidden` on sidebar `aside`, topbar `header`, floating notification button, notification panel wrapper and both backdrops), `src/components/dashboard/DashboardSidebar.tsx` (active state), `src/components/dashboard/HistoryView.tsx` (header link), `src/app/globals.css` (print rules)
- Test: `src/tests/HistoryReport.test.mjs`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Consumes: `parseReportRange`, `reportHref`, `toDateRange`, `rangeFromDateRange`, `defaultReportRange` (Task 2); `collectReport`, `ReportData`, `HistoryPage` (Task 4); `PpgTrace` (Task 1); `useProfile`, `useMyDevice`, `PulseLoader`, `DateRangePicker`, `formatWib`, `formatConfidence`, `shareOf`.
- Produces: page `export default async function DoctorReportPage({ searchParams }: { searchParams: Promise<{ from?: string | string[]; to?: string | string[] }> })` that awaits params and renders `<DoctorReportView initialParams={…} />` (no `useSearchParams`, so no Suspense boundary is needed).
- Produces: `useDoctorReport(initialParams)` → `{ range: ReportRange; setRange(range: ReportRange): void; report: ReportData | null; isLoading: boolean; error: string | null; reload(): void; user; device; generatedAt: Date }`. `now`/`generatedAt` come from `useState(() => new Date())`; `setRange` calls `router.replace(reportHref(range))`; the real fetcher maps `/api/v1/measurement/history?page&limit&startDate&endDate` (`json.code === 200`) to `HistoryPage` and throws `Error("Gagal mengambil riwayat.")` otherwise; a per-effect `isCancelled` flag drops stale responses.

- [ ] **Step 1: Write failing contract tests** in `src/tests/HistoryReport.test.mjs`:
  - Route file exists at `app/(dashboard)/riwayat/laporan/page.tsx`, awaits `searchParams`, renders `<DoctorReportView`.
  - `DoctorReportView.tsx` contains `window.print()`, `print:hidden`, `Laporan Pemantauan Irama Jantung`, `Tidak ada AF terdeteksi pada periode ini.`, `Belum ada rekaman pada periode ini.`, `rekaman pertama pada periode ini`, `bukan diagnosis`, `Grafik ditampilkan tanpa skala waktu`, `<PpgTrace`, `<PulseLoader`, `Coba lagi`.
  - `UseDoctorReport.ts` contains `collectReport(`, `router.replace(reportHref(`, `isCancelled`, `startDate`, `endDate`.
  - `DashboardShell.tsx` has `"/riwayat/laporan": "Laporan"` and at least 4 occurrences of `print:hidden`.
  - `DashboardSidebar.tsx` matches `/pathname\.startsWith\(item\.href\)/`.
  - `HistoryView.tsx` links `Buat laporan dokter` via `reportHref(rangeFromDateRange(dateRange))`.
  - `globals.css` matches `/@media print/`, `/@page\s*{[^}]*size:\s*A4/`, `/print-color-adjust:\s*exact/`.
  - Add `DoctorReportView.tsx` to `viewFiles` in `DashboardRedesign.test.mjs`.

- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/HistoryReport.test.mjs` → FAIL.

- [ ] **Step 3: Implement** the hook, view (spec §2 content order: header, identity, summary with share bar, AF table with `print-avoid-break` rows, note), page, shell/sidebar/history changes, and print CSS (`@page { size: A4; margin: 14mm; }`, white background, `.print-avoid-break { break-inside: avoid; }`, `print-color-adjust: exact`).

- [ ] **Step 4: Run to verify GREEN** — `npm test` → all pass; `npm run build` → compiles with `/riwayat/laporan` as a dynamic route.

- [ ] **Step 5: Commit** — `feat(dashboard): add a printable doctor report`

---

### Task 6: First-run guide

**Files:**
- Create: `src/components/dashboard/FirstRun.ts`, `src/components/dashboard/FirstRunGuide.tsx`
- Modify: `src/components/dashboard/hooks/UseDashboardOverview.ts`, `src/components/dashboard/DashboardOverview.tsx`
- Test: `src/tests/FirstRun.test.ts`, `src/tests/HistoryReport.test.mjs`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Produces: `type StepStatus = "done" | "current" | "todo"`; `type FirstRunStep = { id: "wear" | "monitor" | "result"; status: StepStatus }`.
- Produces: `firstRunSteps(state: { deviceOnline: boolean; monitoringActive: boolean; hasResult: boolean }): FirstRunStep[]` — `hasResult` ⇒ all done; otherwise done flags `wear = deviceOnline || monitoringActive`, `monitor = monitoringActive`, `result = false`; the first not-done step is `current`, the rest `todo`.
- Produces: `FirstRunGuide` props `{ steps: FirstRunStep[] }` with the spec §3 titles and copy verbatim; step `monitor` contains `<a href="#monitor">`.
- Produces: `useDashboardOverview()` additionally returns `hasLoadedLatest: boolean` (set in `fetchLatest`'s `finally`).

- [ ] **Step 1: Write the failing tests** in `src/tests/FirstRun.test.ts`

```ts
const statuses = (state) => firstRunSteps(state).map((step) => step.status);

test("starts a new user on wearing the wristband", () => {
  assert.deepEqual(statuses({ deviceOnline: false, monitoringActive: false, hasResult: false }), ["current", "todo", "todo"]);
});
test("moves on once the device is online", () => {
  assert.deepEqual(statuses({ deviceOnline: true, monitoringActive: false, hasResult: false }), ["done", "current", "todo"]);
});
test("waits for the AI result while monitoring", () => {
  assert.deepEqual(statuses({ deviceOnline: true, monitoringActive: true, hasResult: false }), ["done", "done", "current"]);
});
test("treats active monitoring as proof the device was worn", () => {
  assert.deepEqual(statuses({ deviceOnline: false, monitoringActive: true, hasResult: false }), ["done", "done", "current"]);
});
test("finishes every step once a result exists", () => {
  assert.deepEqual(statuses({ deviceOnline: false, monitoringActive: false, hasResult: true }), ["done", "done", "done"]);
});
test("keeps the step order fixed", () => {
  assert.deepEqual(firstRunSteps({ deviceOnline: false, monitoringActive: false, hasResult: false }).map((s) => s.id), ["wear", "monitor", "result"]);
});
```

Contract tests in `HistoryReport.test.mjs`: `DashboardOverview.tsx` renders `<FirstRunGuide` only under `hasLoadedLatest` and `!latestData`, the signal article has `id="monitor"`, and the `h1` shows `Memuat hasil terakhir` while `!hasLoadedLatest`. Add `FirstRunGuide.tsx` to `viewFiles`.

- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/FirstRun.test.ts src/tests/HistoryReport.test.mjs` → FAIL.

- [ ] **Step 3: Implement** `FirstRun.ts`, `FirstRunGuide.tsx` (rail-with-stops visual like `AuthJourney`: check for done, `live-dot` for current, dashed ring for todo), the hook flag, and the overview wiring.

- [ ] **Step 4: Run to verify GREEN** — `npm test` → all pass.

- [ ] **Step 5: Commit** — `feat(dashboard): guide first-time users through their first analysis`

---

### Task 7: End-to-end check, docs, and push

**Files:**
- Modify: `AGENTS.md` (Dashboard section: detail modal, report route + print, first-run guide)
- Scratch only (not committed): mock API toggle `/__empty?on=1` returning no latest result and an empty history; Playwright script.

- [ ] **Step 1: Run the quality gate** — `npm test`, `npx tsc --noEmit -p .`, `npm run lint`, `npm run build`; all succeed.
- [ ] **Step 2: Smoke test on `next start` with the mock API** (Playwright, 1440×900 and 390×844):
  - clicking a history row opens the detail modal; Escape closes it;
  - `/riwayat/laporan` shows totals 23 / 3 / 20 and exactly 3 AF rows from the mock;
  - `/riwayat/laporan?from=abc` shows the default 30-day period;
  - `page.emulateMedia({ media: "print" })` screenshot has no sidebar, topbar, or toolbar;
  - with `/__empty?on=1`, `/dashboard` shows the 3-step guide with step 1 `done` (device online) and step 2 `current`;
  - no console errors.
- [ ] **Step 3: Update `AGENTS.md`** and commit — `docs: describe history detail, doctor report, and first-run guide`.
- [ ] **Step 4: Push** `feature/history-detail-report` and report results with screenshots.

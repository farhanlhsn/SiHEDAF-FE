# Text Size, Installable App, and Consistent Error States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people enlarge text (rem + a Profil setting), install SiHEDAF to their home screen, and see one honest, fixable error language for offline internet, offline wristband, expired session, and server failure.

**Architecture:** Pure, unit-tested modules carry every decision (`TextSize.ts`, `FetchError.ts`, `ProxyBackend.ts`, `DeviceState.ts`, `MonitoringSession.restartAction`). Hooks (`UseTextSize`, `UseIsStandalone`, `UseOnlineStatus`, `UseMyDevice`) wrap browser state with `useSyncExternalStore` or effects. Components render. Server routes share one session-aware proxy. The client shares one `apiFetch` that turns 401 into a single redirect to `/login?sesi=berakhir`.

**Tech Stack:** Next.js 16.4 (App Router, `app/manifest.ts`, metadata `appleWebApp`, `viewport`), React 19.3 + React Compiler, TypeScript 6, Tailwind CSS 4, `sharp` (already in node_modules, used once to rasterise icons; not added to package.json), Node test runner via `tsx --test`, Playwright for the smoke check.

**Spec:** `docs/superpowers/specs/2026-11-06-text-size-pwa-error-states-design.md`

## Global Constraints

- No new npm dependencies and no new backend endpoints.
- Indonesian UI; no technical or English message ever reaches the user.
- Dashboard styling rules: tokens only (no `-[#`), text ≥ 13px (`0.8125rem`), navy text ≥ `/70`, no `font-serif`.
- Components PascalCase; state/fetch/handlers in `Use*.ts` hooks; pure logic in tested modules; internal imports use `@/`.
- All animation respects `prefers-reduced-motion`; every interactive control has an accessible label, a focus state, and a touch target ≥ 44px.
- At default browser size (16px), the UI must look identical to before the rem conversion.
- No service worker, no offline cache, no push.
- `<html lang="id" …>` stays on one line in `src/app/layout.tsx` (guarded by DesignSystem test).
- Quality gate before claiming done: `npm test`, `npm run lint`, `npm run build`.

## Review Focus

- Stored text size is missing, garbage, or localStorage throws (private mode) → "normal", no crash, no flash → test in Task 2.
- Backend answers with an HTML error page or the network fails behind a proxied route → `502` with the Indonesian message, never a thrown JSON parse error → test in Task 4.
- Several dashboard fetches get 401 at once → exactly one redirect, no loop → test in Task 5.
- `/my-device` request fails → error state, never "Wristband belum terhubung" → test in Task 8.
- `/latest` fails for a returning user → error state, never the first-run guide → contract test in Task 6.

---

### Task 1: Convert text sizes from px to rem

**Files:**
- Modify: every `src/**/*.tsx` containing `text-[<n>px]` (≈250 occurrences in 47 files), except `src/app/opengraph-image.tsx`
- Modify: `src/app/globals.css` (the `font-size: 14px` / `16px` declarations around lines 123 and 131)
- Modify: `src/tests/DashboardRedesign.test.mjs` (min-size rule, line ~50), `src/tests/AuthPages.test.mjs` (line ~161 `text-\[16px\]`)
- Create: `src/tests/TextScale.test.mjs`

**Interfaces:**
- Produces: the conversion rule `text-[Npx]` → `text-[{N/16}rem]` where the rem value is `Number((N / 16).toFixed(4))` printed without trailing zeros (12→0.75, 13→0.8125, 14→0.875, 15→0.9375, 16→1, 17→1.0625, 18→1.125, 19→1.1875, 20→1.25, 22→1.375, 24→1.5, 26→1.625, 28→1.75).

- [ ] **Step 1: Write the failing contract tests** in `src/tests/TextScale.test.mjs`:
  - `no component sizes text in px` → walk `src/**/*.tsx` (skip `src/app/opengraph-image.tsx`), assert none matches `/text-\[\d+(?:\.\d+)?px\]/`; the failure message lists offending files.
  - `globals.css sizes text in rem` → `globals.css` has no `font-size:\s*\d+px`.
  - In `DashboardRedesign.test.mjs` replace the px min-size regex with a numeric check: for every `text-\[([\d.]+)rem\]` in the dashboard `viewFiles`, `Number(value) >= 0.8125`.
  - In `AuthPages.test.mjs` change the `text-\[16px\]` assertion to `text-\[1rem\]`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/TextScale.test.mjs src/tests/AuthPages.test.mjs` → FAIL listing px classes.
- [ ] **Step 3: Convert** with a one-off Node script (not committed) applying the rule above to every matching `.tsx` file and the two CSS declarations (14px → 0.875rem, 16px → 1rem). Do not touch `leading-*`, `tracking-*`, `h-[…px]`, `w-[…px]`, `max-w-[…px]`, or any `clamp(...)`.
- [ ] **Step 4: Run to verify GREEN** — `npm test` → all pass; `npm run lint`.
- [ ] **Step 5: Visual identity check** — on `next start` (mock API, see Task 9), capture 1440×900 screenshots of `/`, `/login`, `/dashboard`, `/riwayat` before (previous commit's build) and after; pixel-compare with Playwright `toHaveScreenshot`-style diff or ImageMagick `compare -metric AE` → 0 differing pixels expected (sub-pixel AA differences ≤ 0.1% acceptable; report the numbers).
- [ ] **Step 6: Commit** — `refactor: size text in rem so it follows the reader's font settings`

---

### Task 2: Text size setting

**Files:**
- Create: `src/components/ui/TextSize.ts`, `src/components/ui/hooks/UseTextSize.ts`, `src/components/dashboard/TextSizeSetting.tsx`
- Modify: `src/app/layout.tsx` (inline head script), `src/app/globals.css` (two `html[data-text-size]` rules), `src/components/dashboard/ProfileView.tsx` (new "Tampilan" section)
- Test: `src/tests/TextSize.test.ts`, `src/tests/TextScale.test.mjs`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Produces (`TextSize.ts`): `type TextSize = "normal" | "besar" | "sangat-besar"`; `TEXT_SIZES: readonly TextSize[]` (that order); `TEXT_SIZE_LABEL: Record<TextSize, string>` = `{ normal: "Normal", besar: "Besar", "sangat-besar": "Sangat besar" }`; `TEXT_SIZE_STORAGE_KEY = "sihedaf:text-size"`; `TEXT_SIZE_EVENT = "sihedaf:text-size-change"`; `parseTextSize(value: unknown): TextSize`; `textSizeScript(): string` (an IIFE that reads the key inside `try/catch`, parses with the same rules, and sets `document.documentElement.dataset.textSize` only for non-normal values).
- Produces (`UseTextSize.ts`): `useTextSize(): { size: TextSize; setSize(size: TextSize): void }` — `useSyncExternalStore` (server snapshot `"normal"`), subscribes to `TEXT_SIZE_EVENT` and `storage`; `setSize` writes localStorage in `try/catch`, sets/removes `data-text-size` on `<html>`, dispatches `TEXT_SIZE_EVENT`; when storage throws, the in-memory value still applies for the page lifetime.
- Produces (`TextSizeSetting.tsx`): no props; a `fieldset` with `legend` "Ukuran teks", three native radios styled as ≥48px pills, and a preview sentence "Irama terakhirmu normal.".

- [ ] **Step 1: Write the failing tests** in `src/tests/TextSize.test.ts`:
  - `reads the stored size` → `parseTextSize("besar") === "besar"`, `parseTextSize("sangat-besar") === "sangat-besar"`, `parseTextSize("normal") === "normal"`.
  - `falls back to normal for anything else` → `null`, `undefined`, `""`, `"BESAR"`, `"huge"`, `42`, `{}` all `"normal"`.
  - `keeps the option order and labels` → `TEXT_SIZES` deep-equals `["normal","besar","sangat-besar"]`; labels as above.
  - `the head script survives a throwing localStorage` → evaluate `textSizeScript()` with `new Function("window","document","localStorage", …)` style harness where `localStorage.getItem` throws → no throw, `dataset.textSize` unset; with `getItem` returning `"besar"` → `dataset.textSize === "besar"`; returning `"normal"` → unset.
  - Contract (in `TextScale.test.mjs`): `layout.tsx` contains `textSizeScript()` inside `<head>`, `<html lang="id"` is on a single line; `globals.css` contains `html[data-text-size="besar"]` with `112.5%` and `html[data-text-size="sangat-besar"]` with `125%`; `ProfileView.tsx` renders `<TextSizeSetting`; `TextSizeSetting.tsx` uses `type="radio"` and `useTextSize`. Add `TextSizeSetting.tsx` to `viewFiles`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/TextSize.test.ts src/tests/TextScale.test.mjs` → FAIL.
- [ ] **Step 3: Implement** the module, hook, CSS rules, head script (`<script dangerouslySetInnerHTML={{ __html: textSizeScript() }} />` in a `<head>` element of the root layout; read `node_modules/next/dist/docs/` on scripts in the root layout first and follow the documented way), and the Profil "Tampilan" section (place it after the account details, before account actions).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run lint`; `npm run build`.
- [ ] **Step 5: Commit** — `feat: let readers choose a larger text size`

---

### Task 3: Installable app (manifest, icons, install guide)

**Files:**
- Create: `public/icons/icon.svg`, `public/icons/icon-maskable.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `src/app/apple-icon.png`, `src/app/manifest.ts`
- Create: `src/components/ui/hooks/UseIsStandalone.ts`, `src/components/dashboard/InstallGuide.tsx`
- Modify: `src/app/layout.tsx` (`applicationName`, `appleWebApp`, `viewport.themeColor`), `src/components/dashboard/ProfileView.tsx`
- Test: `src/tests/InstallableApp.test.mjs`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Produces: manifest exactly per spec §Paket 4 (`name`, `short_name`, `description`, `lang: "id"`, `dir: "ltr"`, `start_url: "/dashboard"`, `scope: "/"`, `display: "standalone"`, `background_color` and `theme_color` `"#f5f3ee"`, `categories: ["health","medical"]`, three icons with `sizes` and `purpose`).
- Produces: `useIsStandalone(): boolean | null` — `null` on the server and before hydration (server snapshot), then `matchMedia("(display-mode: standalone)").matches || navigator.standalone === true`; subscribes to the media query's `change`.
- Produces: `InstallGuide` (no props) — renders nothing while `useIsStandalone()` is `null` or `true`; otherwise a card titled "Pasang SiHEDAF di HP" with the two instruction lines from the spec, verbatim.

- [ ] **Step 1: Write the failing tests** in `src/tests/InstallableApp.test.mjs`:
  - `manifest opens the dashboard as an app` → import is not possible from `.mjs` for TS, so read `src/app/manifest.ts` source and assert it contains `start_url: "/dashboard"`, `display: "standalone"`, `lang: "id"`, `theme_color: "#f5f3ee"`, and the three icon `src` paths with `purpose: "maskable"` on the maskable one.
  - `icons exist at the declared sizes` → read the PNG IHDR (bytes 16–23) of each file: `icon-192.png` 192×192, `icon-512.png` 512×512, `icon-maskable-512.png` 512×512, `src/app/apple-icon.png` 180×180.
  - `layout declares the iOS and theme metadata` → `layout.tsx` contains `appleWebApp`, `capable: true`, `title: "SiHEDAF"`, `applicationName: "SiHEDAF"`, `themeColor: "#f5f3ee"`.
  - `profile explains installation` → `ProfileView.tsx` renders `<InstallGuide`; `InstallGuide.tsx` contains both instruction sentences verbatim and `useIsStandalone`.
  - Add `InstallGuide.tsx` to `viewFiles`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/InstallableApp.test.mjs` → FAIL.
- [ ] **Step 3: Create the icon sources** — `icon.svg` = the `src/app/icon.svg` artwork at `viewBox 0 0 512 512` (rounded navy square, white heart, blue PPG line); `icon-maskable.svg` = full-bleed navy square with the glyph scaled to fit inside the central 80% circle. Rasterise with a one-off Node script using `require("sharp")` from `node_modules` (not committed): 192 and 512 from `icon.svg`, 512 from `icon-maskable.svg`, 180 full-bleed (from `icon-maskable.svg`) to `src/app/apple-icon.png`.
- [ ] **Step 4: Implement** `manifest.ts` (read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md` first), layout metadata and `viewport` export (merge with any existing viewport), the hook, and the guide card (in Profil after "Tampilan").
- [ ] **Step 5: Run to verify GREEN** — `npm test`; `npm run build` lists `/manifest.webmanifest` and `/apple-icon.png`.
- [ ] **Step 6: Commit** — `feat: make SiHEDAF installable on phones`

---

### Task 4: Session-aware backend proxy for all measurement and notification routes

**Files:**
- Create: `src/features/auth/session/server/ProxyBackend.ts`
- Modify: `src/app/api/v1/measurement/{bind,history,latest,my-device,signals,start,stop}/route.ts`, `src/app/api/v1/notification/route.ts`, `src/app/api/v1/notification/[id]/read/route.ts`
- Test: `src/tests/ProxyBackend.test.ts`, `src/tests/ApiRoutes.test.mjs` (new)

**Interfaces:**
- Consumes: `withSessionRefresh(operation, { cookieStore?, refresher? })`, `SessionServiceError`, `SESSION_EXPIRED` (`src/features/auth/session/server/*`), `buildBackendApiUrl(path)` (`src/features/auth/shared/server/BackendUrl.ts`).
- Produces: `BACKEND_UNAVAILABLE = "Layanan SiHEDAF sedang bermasalah."`; `proxyBackend(path: string, init?: { method?: string; body?: BodyInit | null; search?: string; contentType?: string }, options?: { fetcher?: typeof fetch; cookieStore?: ReadableSessionCookieStore; refresher?: AccessTokenRefresher }): Promise<Response>` with the behaviour in spec §Sesi: backend 401 → refresh + one retry; success/other statuses → backend JSON body and status passed through; non-JSON or network failure → `502 { code: 502, message: BACKEND_UNAVAILABLE }`; expired session → `401 { code: 401, message: "Sesi berakhir." }`.

- [ ] **Step 1: Write the failing tests** in `src/tests/ProxyBackend.test.ts` with a recording fake `fetcher`, an in-memory `cookieStore` (access + refresh tokens), and a fake `refresher`:
  - `passes a successful backend response through` → backend `200 {code:200,data:{x:1}}` → response status 200, body deep-equal, request had `Authorization: Bearer <access>` and the `search` appended.
  - `refreshes once and retries on 401` → first call 401, refresher returns `{ accessToken: "new" }`, second call 200 → status 200, two backend calls, second with `Bearer new`.
  - `reports an expired session when refresh fails` → 401 then refresher throws `SessionServiceError(SESSION_EXPIRED, 401)` → status 401, body `{ code: 401, message: "Sesi berakhir." }`.
  - `keeps backend error statuses` → backend `404 {code:404,message:"x"}` → status 404, same body.
  - `turns a non-JSON body into 502` → backend `500` with `text/html` body → status 502, body `{ code: 502, message: "Layanan SiHEDAF sedang bermasalah." }`.
  - `turns a network failure into 502` → fetcher rejects `TypeError` → 502 with the same body.
  - `forwards method, body and content type` → `{ method: "POST", body: "{}", contentType: "application/json" }` reach the fetcher.
  - Contract in `src/tests/ApiRoutes.test.mjs`: each of the nine route files imports `proxyBackend` and contains no `fetch(` call and no `buildBackendApiUrl(`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/ProxyBackend.test.ts src/tests/ApiRoutes.test.mjs` → FAIL.
- [ ] **Step 3: Implement `proxyBackend`**, then migrate each route preserving its current method, query handling (`history` forwards `page`, `limit`, `startDate`, `endDate`; `signals` forwards `minutes`; read each route first), body, and dynamic segment (`[id]` via the Next 16 async `params`).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run build`.
- [ ] **Step 5: Commit** — `feat: refresh the session for measurement and notification routes`

---

### Task 5: One client path for an expired session

**Files:**
- Create: `src/features/auth/session/client/ApiFetch.ts`, `src/components/auth/SessionExpiredNotice.tsx`
- Modify: every dashboard client fetch — `src/components/dashboard/hooks/{UseDashboardOverview,UseMonitoringSession,UseHistoryView,UseDoctorReport,UseMyDevice}.ts`, `src/components/dashboard/NotificationPanel.tsx`; 401 handling in `src/features/profile/client/ProfileProvider.tsx`, `src/components/dashboard/ProfileView.tsx` (line ~95 only; the logout redirect at ~113 stays `/login`), `src/components/dashboard/EditProfileView.tsx`; server 401 redirect in `src/app/(dashboard)/layout.tsx`; `src/app/login/page.tsx`
- Test: `src/tests/ApiFetch.test.ts`, `src/tests/SessionFlow.test.mjs` (new)

**Interfaces:**
- Produces: `SESSION_EXPIRED_PATH = "/login?sesi=berakhir"`; `class SessionExpiredError extends Error`; `createApiFetch({ fetcher, navigate }): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>` (testable factory) and `apiFetch` = `createApiFetch({ fetcher: fetch, navigate: (url) => window.location.assign(url) })`; on `status === 401` it navigates once per factory instance (later 401s skip navigation) and throws `SessionExpiredError`; any other response is returned untouched; network errors propagate.
- Produces: `SessionExpiredNotice` (client) — reads `useSearchParams().get("sesi") === "berakhir"`, renders `role="status"` banner "Sesimu sudah berakhir. Silakan masuk lagi untuk melanjutkan.", else nothing; the login page wraps it in `<Suspense fallback={null}>` so `/login` stays static (confirm in `node_modules/next/dist/docs/` for `useSearchParams` + Suspense in Next 16).

- [ ] **Step 1: Write the failing tests** in `src/tests/ApiFetch.test.ts`:
  - `returns non-401 responses untouched` → fake 200 and 500 come back as-is, `navigate` not called.
  - `redirects once and throws on 401` → three sequential 401 calls → each rejects with `SessionExpiredError`; `navigate` called exactly once with `"/login?sesi=berakhir"`.
  - `lets network errors through` → fetcher rejects `TypeError` → same `TypeError`, no navigate.
  - Contract `src/tests/SessionFlow.test.mjs`: none of the listed client files call bare `fetch(` for `/api/v1/`; each imports `apiFetch`; `ProfileProvider.tsx`, `EditProfileView.tsx`, `(dashboard)/layout.tsx` redirect to `/login?sesi=berakhir` on 401 (no bare `replace("/login")` for 401); `login/page.tsx` renders `<SessionExpiredNotice` inside `<Suspense`; the notice contains the exact sentence.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/ApiFetch.test.ts src/tests/SessionFlow.test.mjs` → FAIL.
- [ ] **Step 3: Implement** and migrate call sites. Callers treat `SessionExpiredError` as "do nothing" (no toast, no error state, no `console.error`).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run build` still shows `/login` as static (○).
- [ ] **Step 5: Commit** — `feat: send readers to login with a clear message when the session ends`

---

### Task 6: Honest error copy and a shared error state

**Files:**
- Create: `src/components/ui/FetchError.ts`, `src/components/ui/DataErrorState.tsx`, `src/components/ui/BrokenSignal.tsx`
- Modify: `src/components/dashboard/HistoryView.tsx` + `hooks/UseHistoryView.ts`, `src/components/dashboard/DoctorReportView.tsx` + `hooks/UseDoctorReport.ts`, `src/features/profile/client/ProfileProvider.tsx` (error panel), `src/components/dashboard/NotificationPanel.tsx`, `src/components/dashboard/hooks/UseDashboardOverview.ts` + `DashboardOverview.tsx`
- Test: `src/tests/FetchError.test.ts`, `src/tests/ErrorStates.test.mjs` (new), `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Consumes: `SessionExpiredError` (Task 5).
- Produces: `type FetchErrorKind = "offline" | "server" | "session"`; `describeFetchError(input: { online: boolean; status?: number; error?: unknown }): { kind: FetchErrorKind; title: string; message: string }` with the copy from spec §Pesan error.
- Produces: `BrokenSignal({ className? })` — a small broken-PPG-line SVG (`aria-hidden`), stroke draw disabled under reduced motion; reused by Task 7's banner.
- Produces: `DataErrorState({ title, message, onRetry?, compact? })` — `role="alert"`, `BrokenSignal`, title, message, and a "Coba lagi" button (≥48px) when `onRetry` is given.
- Produces: hooks expose `{ error: { title: string; message: string } | null; reload(): void }` where they previously exposed a string; `useDashboardOverview` exposes `latestError` and `reloadLatest()`; `showFirstRun` additionally requires `!latestError`.

- [ ] **Step 1: Write the failing tests** in `src/tests/FetchError.test.ts`:
  - `offline when the browser is offline` → `{ online: false, status: 500 }` → kind `offline`, title "Koneksi internet terputus".
  - `offline on a network TypeError` → `{ online: true, error: new TypeError("Failed to fetch") }` → `offline`.
  - `session on 401 or SessionExpiredError` → both → `session`.
  - `server otherwise` → `{ online: true, status: 500 }`, `{ online: true, status: 502 }`, `{ online: true, error: new Error("x") }` → `server`, title "Server SiHEDAF sedang bermasalah".
  - `never leaks the raw error text` → for `new Error("Unexpected token <")` the message does not contain "Unexpected".
  - Contract `src/tests/ErrorStates.test.mjs`: `DataErrorState` is rendered by `HistoryView.tsx`, `DoctorReportView.tsx`, `ProfileProvider.tsx`, `NotificationPanel.tsx`, `DashboardOverview.tsx`; `DashboardOverview.tsx` contains "Hasil terakhir belum bisa dimuat."; `UseDashboardOverview.ts` gates `showFirstRun` on `!latestError`; no listed file contains `err.message` or `error.message` rendered to the UI. Add the three new UI files to `viewFiles` (they must pass the dashboard styling rules).
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/FetchError.test.ts src/tests/ErrorStates.test.mjs` → FAIL.
- [ ] **Step 3: Implement** and replace each existing error UI with `DataErrorState` (keep existing "Coba lagi" wiring; Riwayat, report, notifications, profile, overview latest). `online` comes from `navigator.onLine` at the time of the failure (Task 7 adds the shared hook; here read `navigator.onLine` directly inside the catch).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run lint`.
- [ ] **Step 5: Commit** — `feat: show one honest error state with a retry across the dashboard`

---

### Task 7: Offline internet banner and reconnect refresh

**Files:**
- Create: `src/components/ui/hooks/UseOnlineStatus.ts`, `src/components/dashboard/OfflineBanner.tsx`
- Modify: `src/components/dashboard/DashboardShell.tsx`, `src/components/dashboard/MonitoringSession.ts` (`restartAction`), `src/components/dashboard/hooks/{UseDashboardOverview,UseMonitoringSession,UseHistoryView,UseDoctorReport,UseMyDevice}.ts`, `src/components/dashboard/NotificationPanel.tsx`, `src/components/dashboard/DashboardOverview.tsx`, `src/components/dashboard/AiResultModal.tsx`
- Test: `src/tests/MonitoringSession.test.ts`, `src/tests/OfflineFlow.test.mjs` (new), `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Consumes: `BrokenSignal` (Task 6).
- Produces: `useOnlineStatus(): { online: boolean; reconnectCount: number }` — module-level store over `online`/`offline` events via `useSyncExternalStore`; server snapshot `{ online: true, reconnectCount: 0 }`; `reconnectCount` increments on each offline→online transition.
- Produces: `restartAction(phase, { deviceOnline, deviceLoading?, busy, networkOnline? = true })` → adds `RestartAction` value `"no-network"` returned when `!networkOnline` (checked after the hidden-phase rule, before device checks).
- Produces: `OfflineBanner` (no props) — `print:hidden`, `role="status"`, `aria-live="polite"`; offline copy and the 4-second "Tersambung kembali. Data sedang dimuat ulang." from the spec.

- [ ] **Step 1: Write the failing tests**:
  - `MonitoringSession.test.ts`: `restartAction` → `("idle", { deviceOnline: true, busy: false, networkOnline: false })` = `"no-network"`; `("recording", { …, networkOnline: false })` = `"hidden"`; omitted `networkOnline` keeps every existing expectation.
  - Contract `src/tests/OfflineFlow.test.mjs`: `DashboardShell.tsx` renders `<OfflineBanner`; banner contains both sentences verbatim, `print:hidden`, `aria-live="polite"`; each data hook listed (and `NotificationPanel.tsx`) uses `reconnectCount` in a fetch effect's dependencies; `DashboardOverview.tsx` disables the monitoring toggle when offline and shows "Tidak ada koneksi internet." via `aria-describedby`; `AiResultModal.tsx` shows the same hint for `"no-network"`. Add `OfflineBanner.tsx` to `viewFiles`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/MonitoringSession.test.ts src/tests/OfflineFlow.test.mjs` → FAIL.
- [ ] **Step 3: Implement** the hook, banner (timer for the 4 s message lives in the banner's own hook/effect with cleanup; no setState synchronously in effects), `restartAction` input, and the `reconnectCount` dependencies. Monitoring result polling keeps running offline (failures count as attempts, as today).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run lint`.
- [ ] **Step 5: Commit** — `feat: tell readers when the internet drops and reload data when it returns`

---

### Task 8: Wristband offline card

**Files:**
- Create: `src/components/dashboard/DeviceState.ts`, `src/components/dashboard/DeviceOfflineCard.tsx`
- Modify: `src/components/dashboard/hooks/UseMyDevice.ts`, `src/components/dashboard/hooks/UseDashboardOverview.ts`, `src/components/dashboard/DashboardOverview.tsx`
- Test: `src/tests/DeviceState.test.ts`, `src/tests/ErrorStates.test.mjs`, `src/tests/DashboardRedesign.test.mjs`

**Interfaces:**
- Consumes: `apiFetch`, `SessionExpiredError` (Task 5); `describeFetchError`, `DataErrorState` (Task 6); `reconnectCount` (Task 7); `formatWib`.
- Produces: `useMyDevice(): { device: MeasurementDevice | null; isLoading: boolean; error: { title: string; message: string } | null; reload(): void }` — `json.code === 200 && json.data` → device; `json.code === 200` with empty data → `device: null, error: null`; failure → `error`.
- Produces: `type DeviceState = "loading" | "online" | "offline" | "none" | "error"`; `deviceState({ device, isLoading, error }): DeviceState` — loading first, then error, then `none` when `!device`, `online` when `device.status === "ONLINE"`, else `offline`.
- Produces: `DeviceOfflineCard({ state, lastSeen, onRetry })` rendering the spec §Wristband offline content for `offline` and `none`; nothing for `online`/`loading`; `DataErrorState` for `error`.

- [ ] **Step 1: Write the failing tests** in `src/tests/DeviceState.test.ts`:
  - `loading wins` → `{ device: null, isLoading: true, error: null }` → `loading`.
  - `an error is never reported as offline` → `{ device: { status: "OFFLINE" }, isLoading: false, error: { title: "x", message: "y" } }` → `error`.
  - `no device bound` → `{ device: null, isLoading: false, error: null }` → `none`.
  - `online` → status `"ONLINE"` → `online`; `"OFFLINE"`, `"IDLE"`, `undefined` → `offline`.
  - Contract (append to `ErrorStates.test.mjs`): `DeviceOfflineCard.tsx` contains the four steps verbatim, "Terakhir terlihat", "Belum pernah terlihat", "Belum ada perangkat terhubung", `href="/hubungkan-perangkat"`, a "Periksa lagi" button; `DashboardOverview.tsx` no longer contains "Monitoring bisa dimulai setelah perangkat terhubung kembali." and renders `<DeviceOfflineCard`. Add `DeviceOfflineCard.tsx` to `viewFiles`.
- [ ] **Step 2: Run to verify RED** — `npx tsx --test src/tests/DeviceState.test.ts src/tests/ErrorStates.test.mjs` → FAIL.
- [ ] **Step 3: Implement** the module, hook changes (reload counter + `reconnectCount` in deps), card, and overview wiring (card above the signal card when state is `offline`/`none`/`error`).
- [ ] **Step 4: Run to verify GREEN** — `npm test`; `npm run lint`; `npm run build`.
- [ ] **Step 5: Commit** — `feat: guide readers when the wristband is not connected`

---

### Task 9: End-to-end check, docs, and push

**Files:**
- Modify: `AGENTS.md` (text size + rem rule, installable app + icon regeneration note, error language: `proxyBackend`, `apiFetch`, `DataErrorState`, offline banner, wristband card; Batasan: no service worker, HTTPS needed to install)
- Scratch only (not committed): mock API toggles `/__status?route=<name>&code=<n>` (force a status per route), `/__device?status=OFFLINE|none`, `/__expire?on=1` (every route 401 and refresh fails); Playwright script.

- [ ] **Step 1: Quality gate** — `npm test`, `npx tsc --noEmit -p .`, `npm run lint`, `npm run build`.
- [ ] **Step 2: Smoke on `next start` + mock API** at 1440×900 and 390×844, no console errors:
  - "Sangat besar" chosen in Profil persists after reload and gives `scrollWidth <= clientWidth` on `/dashboard`, `/riwayat`, `/riwayat/laporan`, `/profil`, `/login` at 390px; screenshots at 125%;
  - `/manifest.webmanifest` 200 `application/manifest+json`; the three icons and `/apple-icon.png` 200 `image/png`;
  - `context.setOffline(true)` → banner + monitoring toggle disabled with the hint; `setOffline(false)` → "Tersambung kembali" and a fresh `/latest` request;
  - `/__expire?on=1` → any dashboard page lands on `/login?sesi=berakhir` with the banner, exactly one navigation;
  - `/__device?status=OFFLINE` → card with steps and "Periksa lagi"; `status=none` → "Belum ada perangkat terhubung";
  - `/__status?route=latest&code=500` → overview error state, no first-run guide; `route=history&code=500` → Riwayat error state, "Coba lagi" recovers after resetting the toggle.
- [ ] **Step 3: Update `AGENTS.md`** and commit — `docs: describe text size, installable app, and error states`.
- [ ] **Step 4: Push** `feature/a11y-pwa-errors` and report results with screenshots.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

const clientFiles = [
  "components/dashboard/hooks/UseDashboardOverview.ts",
  "components/dashboard/hooks/UseMonitoringSession.ts",
  "components/dashboard/hooks/UseHistoryView.ts",
  "components/dashboard/hooks/UseDoctorReport.ts",
  "components/dashboard/hooks/UseMyDevice.ts",
  "components/dashboard/NotificationPanel.tsx",
];

test("dashboard clients fetch through apiFetch, never bare fetch", async () => {
  for (const file of clientFiles) {
    const source = await readSource(file);
    assert.match(source, /import \{[^}]*\bapiFetch\b[^}]*\} from "@\/features\/auth\/session\/client\/ApiFetch"/, file);
    assert.doesNotMatch(source, /(?<![\w.])fetch\(/, `${file} calls bare fetch(`);
  }
});

test("clients ignore SessionExpiredError silently", async () => {
  for (const file of clientFiles) {
    const source = await readSource(file);
    assert.match(source, /SessionExpiredError/, file);
  }
});

test("a 401 sends the reader to the expired-session login", async () => {
  for (const file of [
    "features/profile/client/ProfileProvider.tsx",
    "components/dashboard/EditProfileView.tsx",
    "components/dashboard/ProfileView.tsx",
  ]) {
    const source = await readSource(file);
    assert.match(source, /SESSION_EXPIRED_PATH/, file);
    assert.doesNotMatch(source, /status === 401\) router\.replace\("\/login"\)/, file);
  }
  const profileProvider = await readSource("features/profile/client/ProfileProvider.tsx");
  assert.doesNotMatch(profileProvider, /replace\("\/login"\)/);
});

test("the dashboard layout checks the session read-only and can reach its redirect", async () => {
  const layout = await readSource("app/(dashboard)/layout.tsx");
  // A Server Component cannot write cookies: no refresh from the layout.
  assert.doesNotMatch(layout, /withSessionRefresh/);
  assert.match(layout, /const session = await readLayoutProfile\(\);/);
  // Outside any try/catch, so the redirect is not swallowed.
  assert.doesNotMatch(layout, /\btry\b|\bcatch\b/);
  assert.match(layout, /if \(!session\.hasSession\) redirect\(SESSION_EXPIRED_PATH\);/);
  assert.doesNotMatch(layout, /redirect\("\/login"\)/);
  assert.match(layout, /<DashboardShell initialUser=\{session\.user\}>/);

  const helper = await readSource("features/auth/session/server/ReadLayoutProfile.ts");
  assert.doesNotMatch(helper, /\.set\(|\.delete\(|writeAccessTokenCookie|clearSessionCookies|refreshAccessToken/);
});

test("login page shows the notice inside Suspense so it stays static", async () => {
  const page = await readSource("app/login/page.tsx");
  assert.match(page, /<Suspense fallback=\{null\}>\s*<SessionExpiredNotice \/>\s*<\/Suspense>/);

  const notice = await readSource("components/auth/SessionExpiredNotice.tsx");
  assert.match(notice, /Sesimu sudah berakhir\. Silakan masuk lagi untuk melanjutkan\./);
  assert.match(notice, /role="status"/);
  assert.match(notice, /useSearchParams/);
});

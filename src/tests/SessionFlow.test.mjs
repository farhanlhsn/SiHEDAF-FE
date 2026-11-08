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

test("a 401 sends the reader to the expired-session login through one shared redirect", async () => {
  // apiFetch is the only client that navigates there, through redirectToSessionExpired.
  const apiFetch = await readSource("features/auth/session/client/ApiFetch.ts");
  assert.match(apiFetch, /if \(response\.status === 401\) \{\s*redirect\(\);\s*throw new SessionExpiredError\(\);/);
  assert.match(apiFetch, /redirect: redirectToSessionExpired,/);
  assert.doesNotMatch(apiFetch, /hasNavigated|window\.location/);

  // Profile calls go through apiFetch; logout keeps plain fetch (a 401 there is already logged out).
  const profileClient = await readSource("features/profile/client/services/ProfileClient.ts");
  assert.match(profileClient, /import \{[^}]*\bapiFetch\b[^}]*\} from "@\/features\/auth\/session\/client\/ApiFetch"/);
  for (const name of ["fetchCurrentProfile", "updateProfile", "updatePassword"]) {
    assert.match(
      profileClient,
      new RegExp(`export async function ${name}\\([^)]*fetcher: Fetcher = apiFetch,`),
      name,
    );
  }
  assert.match(profileClient, /export async function logoutAccount\(\s*fetcher: Fetcher = fetch,/);

  // No second redirect, no error and no toast on 401.
  for (const file of [
    "features/profile/client/ProfileProvider.tsx",
    "components/dashboard/EditProfileView.tsx",
    "components/dashboard/ProfileView.tsx",
  ]) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /router\.(?:replace|push)\(SESSION_EXPIRED_PATH\)|location\.assign/, file);
    assert.doesNotMatch(source, /router\.replace\("\/login\?/, file);
    assert.match(source, /describeCaughtError\(result\.cause, result\.status\)/, file);
    assert.doesNotMatch(source, /describeCaughtError\(undefined/, file);
  }
  for (const file of ["components/dashboard/EditProfileView.tsx", "components/dashboard/ProfileView.tsx"]) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /SESSION_EXPIRED_PATH/, file);
    assert.match(source, /if \(result\.status === 401\) return;/, file);
  }
  const profileProvider = await readSource("features/profile/client/ProfileProvider.tsx");
  assert.doesNotMatch(profileProvider, /replace\("\/login"\)|useRouter/);
  // The gate drops its loader on 401 and says it is redirecting (see the
  // ProfileProvider test below); the only use of the path is the link.
  assert.equal((profileProvider.match(/SESSION_EXPIRED_PATH/g) ?? []).length, 2);
  assert.match(profileProvider, /href=\{SESSION_EXPIRED_PATH\}/);
  const failures = [...profileProvider.matchAll(/if \(!result\.success\) \{([\s\S]*?)\n\s*\}/g)];
  assert.equal(failures.length, 2);
  for (const [, body] of failures) {
    assert.match(
      body,
      /setIsLoading\(false\);\s*if \(result\.status === 401\) setSessionExpired\(true\);\s*else setError\(describeCaughtError\(result\.cause, result\.status\)\);\s*return;/,
    );
  }
  // The mutation hooks keep a 401 out of the inline error too.
  assert.match(
    await readSource("features/profile/client/hooks/UseUpdateProfile.ts"),
    /if \(result\.status !== 401\) setError\(result\);/,
  );
  assert.match(
    await readSource("features/profile/client/hooks/UseUpdatePassword.ts"),
    /if \(!result\.success && result\.status !== 401\) setError\(result\);/,
  );
});

test("the profile gate says the session ended, with a link, instead of loading forever", async () => {
  const provider = await readSource("features/profile/client/ProfileProvider.tsx");
  assert.match(provider, /const \[sessionExpired, setSessionExpired\] = useState\(false\);/);
  // Covers a redirect that was stopped (or spent): the reader is never stuck on the loader.
  const start = provider.indexOf("if (sessionExpired) {");
  assert.ok(start > provider.indexOf("if (isLoading) {"), "after the loader");
  assert.ok(start < provider.indexOf("if (error || !user) {"), "before the error panel");
  const note = provider.slice(start, provider.indexOf("\n  }\n", start));
  assert.match(note, /<p\s+className="[^"]*"\s+role="status"\s*>\s*Sesimu sudah berakhir\. Mengalihkan ke halaman masuk…\s*<\/p>/);
  assert.match(note, /<Link\s+className="[^"]*\bmin-h-12\b[^"]*"\s+href=\{SESSION_EXPIRED_PATH\}\s*>\s*Masuk lagi\s*<\/Link>/);
  assert.match(note, /focus-visible:outline-primary-300/);
  assert.doesNotMatch(note, /\[#|text-\[\d+px\]/);
  assert.doesNotMatch(note, /<DataErrorState/);
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

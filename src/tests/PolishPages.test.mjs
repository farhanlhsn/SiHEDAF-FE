import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(testsDirectory, "..");

async function readSource(relativePath) {
  return readFile(path.join(sourceDirectory, relativePath), "utf8");
}

async function exists(relativePath) {
  try {
    await access(path.join(sourceDirectory, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listSourceFiles(directory) {
  const entries = await readdir(path.join(sourceDirectory, directory), {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
    .map((entry) =>
      path.relative(sourceDirectory, path.join(entry.parentPath, entry.name)),
    );
}

test("replaces the framework 404 with a branded 'signal lost' page", async () => {
  assert.ok(await exists("app/not-found.tsx"), "app/not-found.tsx is missing");
  const notFound = await readSource("app/not-found.tsx");

  assert.match(notFound, /<SignalLost/);
  assert.match(notFound, /tidak ditemukan/);
  assert.match(notFound, /href="\/"/);
  assert.doesNotMatch(notFound, /["']use client["']/);
});

test("recovers from runtime errors with a branded retry screen", async () => {
  assert.ok(await exists("app/error.tsx"), "app/error.tsx is missing");
  const errorPage = await readSource("app/error.tsx");

  assert.match(errorPage, /^["']use client["'];/);
  assert.match(errorPage, /unstable_retry/);
  assert.match(errorPage, /Coba lagi/);
  assert.match(errorPage, /<SignalLost/);
});

test("shows a drawing pulse while dashboard data loads", async () => {
  assert.ok(
    await exists("app/(dashboard)/loading.tsx"),
    "dashboard loading.tsx is missing",
  );
  const [loading, loader, provider, profile, editProfile] = await Promise.all([
    readSource("app/(dashboard)/loading.tsx"),
    readSource("components/ui/PulseLoader.tsx"),
    readSource("features/profile/client/ProfileProvider.tsx"),
    readSource("components/dashboard/ProfileView.tsx"),
    readSource("components/dashboard/EditProfileView.tsx"),
  ]);

  assert.match(loader, /role="status"/);
  assert.match(loader, /pathLength/);
  for (const [name, source] of Object.entries({
    loading,
    provider,
    profile,
    editProfile,
  })) {
    assert.match(source, /<PulseLoader/, `${name} should use PulseLoader`);
  }
  assert.doesNotMatch(provider, /animate-spin/);
});

test("never interrupts people with native browser alerts", async () => {
  const files = [
    ...(await listSourceFiles("components")),
    ...(await listSourceFiles("features")),
  ];
  const sources = await Promise.all(files.map(readSource));

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(
      source,
      /\b(?:window\.)?alert\(/,
      `${files[index]} calls alert()`,
    );
  }
  assert.match(
    await readSource("components/dashboard/hooks/UseMonitoringSession.ts"),
    /toast\.error/,
  );
});

test("describes the site for search and link previews", async () => {
  const layout = await readSource("app/layout.tsx");

  assert.match(
    layout,
    /const siteDescription =\s*\n?\s*"[^"]{60,}"/,
    "root description is too short",
  );
  assert.match(layout, /description: siteDescription/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /locale: "id_ID"/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /process\.env\.SIHEDAF_SITE_URL/);
  assert.ok(
    await exists("app/opengraph-image.tsx"),
    "opengraph-image.tsx is missing",
  );
  assert.ok(await exists("app/icon.svg"), "line-art icon.svg is missing");

  const ogImage = await readSource("app/opengraph-image.tsx");
  assert.match(ogImage, /from "next\/og"/);
  assert.match(ogImage, /width: 1200/);
  assert.match(ogImage, /height: 630/);
  assert.match(ogImage, /export const alt/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("manifest opens the dashboard as an app", async () => {
  const source = await read("src/app/manifest.ts");

  for (const fragment of [
    'start_url: "/dashboard"',
    'display: "standalone"',
    'lang: "id"',
    'theme_color: "#f5f3ee"',
    'src: "/icons/icon-192.png"',
    'src: "/icons/icon-512.png"',
    'src: "/icons/icon-maskable-512.png"',
    'purpose: "maskable"',
  ]) {
    assert.ok(source.includes(fragment), `manifest.ts is missing ${fragment}`);
  }
});

test("icons exist at the declared sizes", async () => {
  const expected = {
    "public/icons/icon-192.png": 192,
    "public/icons/icon-512.png": 512,
    "public/icons/icon-maskable-512.png": 512,
    "src/app/apple-icon.png": 180,
  };

  for (const [file, size] of Object.entries(expected)) {
    const bytes = await readFile(path.join(root, file));
    assert.equal(bytes.readUInt32BE(16), size, `${file} width`);
    assert.equal(bytes.readUInt32BE(20), size, `${file} height`);
  }
});

test("layout declares the iOS and theme metadata", async () => {
  const layout = await read("src/app/layout.tsx");

  for (const fragment of [
    "appleWebApp",
    "capable: true",
    'title: "SiHEDAF"',
    'applicationName: "SiHEDAF"',
    'themeColor: "#f5f3ee"',
  ]) {
    assert.ok(layout.includes(fragment), `layout.tsx is missing ${fragment}`);
  }
});

test("profile explains installation", async () => {
  const [profile, guide] = await Promise.all([
    read("src/components/dashboard/ProfileView.tsx"),
    read("src/components/dashboard/InstallGuide.tsx"),
  ]);

  assert.match(profile, /<InstallGuide/);
  assert.ok(guide.includes("Buka di Safari → ketuk Bagikan → pilih Tambahkan ke Layar Utama."));
  assert.ok(guide.includes("Buka di Chrome → ketuk menu ⋮ → pilih Instal aplikasi atau Tambahkan ke layar utama."));
  assert.ok(guide.includes("Pasang SiHEDAF di HP"));
  assert.ok(guide.includes("useIsStandalone"));
});

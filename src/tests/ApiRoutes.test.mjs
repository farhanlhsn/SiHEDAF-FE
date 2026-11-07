import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routes = [
  "measurement/bind",
  "measurement/history",
  "measurement/latest",
  "measurement/my-device",
  "measurement/signals",
  "measurement/start",
  "measurement/stop",
  "notification",
  "notification/[id]/read",
];

for (const route of routes) {
  test(`${route} route goes through proxyBackend`, async () => {
    const source = await readFile(
      path.join(root, "app/api/v1", route, "route.ts"),
      "utf8",
    );
    assert.match(source, /import \{[^}]*proxyBackend[^}]*\} from/);
    assert.doesNotMatch(source, /\bfetch\(/);
    assert.doesNotMatch(source, /buildBackendApiUrl\(/);
  });
}

test("bind route guards non-object backend bodies and sets its timeout", async () => {
  const source = await readFile(
    path.join(root, "app/api/v1/measurement/bind/route.ts"),
    "utf8",
  );
  assert.match(source, /typeof raw !== "object" \|\| raw === null/);
  assert.match(source, /timeoutMs: 10_000/);
});

test("bind route answers an ended session with the shared Indonesian copy", async () => {
  const source = await readFile(
    path.join(root, "app/api/v1/measurement/bind/route.ts"),
    "utf8",
  );
  assert.match(source, /import \{ SESSION_EXPIRED \} from "@\/features\/auth\/session\/server\/SessionServiceError"/);
  assert.match(
    source,
    /response\.status === 401\) \{\s*return json\(\{ success: false, message: SESSION_EXPIRED \}, 401\);/,
  );
  assert.doesNotMatch(source, /String\(result\.message\)/);
});

test("notification read route rejects non-numeric ids before proxying", async () => {
  const source = await readFile(
    path.join(root, "app/api/v1/notification/[id]/read/route.ts"),
    "utf8",
  );
  const guard = source.indexOf("if (!/^\\d+$/.test(id))");
  assert.ok(guard > -1, "validates the id with /^\\d+$/");
  assert.ok(guard < source.indexOf("return proxyBackend("), "before proxying");
  assert.match(
    source,
    /\{ code: 400, message: "Notifikasi tidak ditemukan\." \},\s*\{ status: 400 \}/,
  );
});

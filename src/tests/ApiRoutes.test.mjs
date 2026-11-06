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

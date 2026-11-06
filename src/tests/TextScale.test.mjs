import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const skipped = path.join(root, "app", "opengraph-image.tsx");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") && full !== skipped ? [full] : [];
  });
}

test("no component sizes text in px", () => {
  const offenders = walk(root).filter((file) =>
    /text-\[\d+(?:\.\d+)?px\]/.test(readFileSync(file, "utf8")),
  );
  assert.deepEqual(
    offenders.map((file) => path.relative(root, file)),
    [],
    "text must be sized in rem so it follows the reader's font settings",
  );
});

test("globals.css sizes text in rem", () => {
  const css = readFileSync(path.join(root, "app", "globals.css"), "utf8");
  assert.doesNotMatch(css, /font-size:\s*\d+px/);
});

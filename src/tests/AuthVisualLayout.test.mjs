import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const authDirectory = path.resolve(testsDirectory, "../components/auth");

async function readAuth(filename) {
  return readFile(path.join(authDirectory, filename), "utf8");
}

test("stacks headline, journey, and illustration in one non-overlapping flow", async () => {
  const source = await readAuth("AuthVisualPanel.tsx");

  assert.match(source, /flex h-full flex-col/);
  assert.match(source, /mt-auto/);
  assert.match(source, /object-contain/);
  assert.doesNotMatch(source, /className="absolute bottom-/);

  const descriptionIndex = source.indexOf("{description}");
  const journeyIndex = source.indexOf("<AuthJourney");
  const watchIndex = source.indexOf('src="/watch.png"');

  assert.ok(descriptionIndex > -1, "panel renders the description");
  assert.ok(journeyIndex > descriptionIndex, "journey follows the description");
  assert.ok(watchIndex > journeyIndex, "illustration comes last");
  assert.match(source, /autodraw/, "line-art draws itself on load");
});

test("maps the onboarding journey in order and marks the current step", async () => {
  const source = await readAuth("AuthJourney.tsx");
  let previousIndex = -1;

  for (const step of [
    "Daftar akun",
    "Masuk",
    "Hubungkan perangkat",
    "Pantau di dashboard",
  ]) {
    const index = source.indexOf(`"${step}"`);
    assert.ok(index > previousIndex, `${step} is missing or out of order`);
    previousIndex = index;
  }

  assert.match(source, /<ol/);
  assert.match(source, /aria-current=\{[^}]*"step"/);
});

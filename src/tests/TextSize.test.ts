import assert from "node:assert/strict";
import test from "node:test";

import {
  TEXT_SIZES,
  TEXT_SIZE_LABEL,
  parseTextSize,
  textSizeScript,
} from "@/components/ui/TextSize";

test("reads the stored size", () => {
  assert.equal(parseTextSize("besar"), "besar");
  assert.equal(parseTextSize("sangat-besar"), "sangat-besar");
  assert.equal(parseTextSize("normal"), "normal");
});

test("falls back to normal for anything else", () => {
  for (const value of [null, undefined, "", "BESAR", "huge", 42, {}]) {
    assert.equal(parseTextSize(value), "normal");
  }
});

test("keeps the option order and labels", () => {
  assert.deepEqual([...TEXT_SIZES], ["normal", "besar", "sangat-besar"]);
  assert.deepEqual(TEXT_SIZE_LABEL, {
    normal: "Normal",
    besar: "Besar",
    "sangat-besar": "Sangat besar",
  });
});

function runScript(getItem: () => unknown) {
  const dataset: Record<string, string> = {};
  const document = { documentElement: { dataset } };
  const run = new Function("document", "localStorage", textSizeScript());
  run(document, { getItem });
  return dataset;
}

test("the head script survives a throwing localStorage", () => {
  const dataset = runScript(() => {
    throw new Error("blocked");
  });
  assert.equal(dataset.textSize, undefined);
});

test("the head script applies a stored size", () => {
  assert.equal(runScript(() => "besar").textSize, "besar");
  assert.equal(runScript(() => "sangat-besar").textSize, "sangat-besar");
  assert.equal(runScript(() => "normal").textSize, undefined);
  assert.equal(runScript(() => "junk").textSize, undefined);
});

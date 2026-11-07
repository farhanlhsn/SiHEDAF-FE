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

type StorageListener = (event: { key: string | null; newValue: string | null }) => void;

function loadScript(getItem: () => unknown) {
  const dataset: Record<string, string> = {};
  const document = { documentElement: { dataset } };
  const listeners: StorageListener[] = [];
  const window = {
    addEventListener(type: string, listener: StorageListener) {
      if (type === "storage") listeners.push(listener);
    },
  };
  const run = new Function("window", "document", "localStorage", textSizeScript());
  run(window, document, { getItem });
  const storage = (key: string | null, newValue: string | null) => {
    for (const listener of listeners) listener({ key, newValue });
  };
  return { dataset, listeners, storage };
}

function runScript(getItem: () => unknown) {
  return loadScript(getItem).dataset;
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

test("the head script follows a size chosen in another tab", () => {
  const { dataset, listeners, storage } = loadScript(() => null);
  assert.equal(listeners.length, 1, "listens for storage events");
  assert.equal(dataset.textSize, undefined);

  storage("sihedaf:text-size", "sangat-besar");
  assert.equal(dataset.textSize, "sangat-besar");
  storage("sihedaf:text-size", "besar");
  assert.equal(dataset.textSize, "besar");
  // Another key changes nothing.
  storage("sihedaf:other", "normal");
  assert.equal(dataset.textSize, "besar");
  // Back to normal, an unknown value, or storage cleared: the default size.
  storage("sihedaf:text-size", "normal");
  assert.equal(dataset.textSize, undefined);
  storage("sihedaf:text-size", "sangat-besar");
  storage("sihedaf:text-size", "junk");
  assert.equal(dataset.textSize, undefined);
  storage("sihedaf:text-size", "besar");
  storage(null, null);
  assert.equal(dataset.textSize, undefined);
});

test("the head script still listens when localStorage is blocked", () => {
  const { dataset, listeners, storage } = loadScript(() => {
    throw new Error("blocked");
  });
  assert.equal(listeners.length, 1);
  storage("sihedaf:text-size", "besar");
  assert.equal(dataset.textSize, "besar");
});

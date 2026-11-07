import assert from "node:assert/strict";
import test from "node:test";

import {
  formatConfidence,
  formatWib,
  isNormalResult,
  shareOf,
} from "../components/dashboard/DashboardFormat";

test("reads the AI label as normal, AF, or unknown", () => {
  assert.equal(isNormalResult("Normal Rhythm"), true);
  assert.equal(isNormalResult("normal"), true);
  assert.equal(isNormalResult("AF Detected"), false);
  assert.equal(isNormalResult("Atrial Fibrillation"), false);
  assert.equal(isNormalResult(undefined), null);
  assert.equal(isNormalResult(""), null);
});

test("formats AI confidence from either a ratio or a percentage", () => {
  assert.equal(formatConfidence(0.964), "96,4%");
  assert.equal(formatConfidence(96.4), "96,4%");
  assert.equal(formatConfidence(96), "96%");
  assert.equal(formatConfidence(1), "100%");
});

test("never invents a confidence value when the API has none", () => {
  assert.equal(formatConfidence(undefined), null);
  assert.equal(formatConfidence(null), null);
  assert.equal(formatConfidence(0), null);
  assert.equal(formatConfidence(Number.NaN), null);
  assert.equal(formatConfidence(140), null);
});

test("formats timestamps in Jakarta time with a WIB suffix", () => {
  assert.equal(formatWib("2026-11-06T10:58:00Z"), "6 Nov 2026, 17.58 WIB");
  assert.equal(formatWib("2026-11-06T10:58:00Z", "time"), "17.58 WIB");
  assert.equal(formatWib("2026-11-06T18:30:00Z", "date"), "7 November 2026");
  assert.equal(formatWib(undefined), null);
  assert.equal(formatWib("not-a-date"), null);
});

test("turns counts into whole-number shares of a total", () => {
  assert.equal(shareOf(3, 23), 13);
  assert.equal(shareOf(20, 23), 87);
  assert.equal(shareOf(0, 0), 0);
  assert.equal(shareOf(5, 0), 0);
});

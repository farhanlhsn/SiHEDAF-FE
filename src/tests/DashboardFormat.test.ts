import assert from "node:assert/strict";
import test from "node:test";

import {
  formatConfidence,
  formatWib,
  isNormalResult,
  resultStatus,
  shareOf,
  splitShares,
  tracePath,
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

test("draws a PPG trace with the highest value at the top", () => {
  assert.equal(tracePath([0, 10, 5], 100, 40), "M0 40L50 0L100 20");
  assert.equal(tracePath([0, 10, 5], 100, 40, 4), "M0 36L50 4L100 20");
});

test("refuses to draw a trace from missing or single-sample data", () => {
  assert.equal(tracePath(undefined, 100, 40), null);
  assert.equal(tracePath([], 100, 40), null);
  assert.equal(tracePath([7], 100, 40), null);
});

test("centres a flat signal instead of dividing by zero", () => {
  assert.equal(tracePath([3, 3, 3], 100, 40), "M0 20L50 20L100 20");
});

test("reads result status as normal, af, or unknown", () => {
  assert.equal(resultStatus("Normal Rhythm"), "normal");
  assert.equal(resultStatus("AF Detected"), "af");
  assert.equal(resultStatus("Atrial Fibrillation"), "af");
  assert.equal(resultStatus(undefined), "unknown");
  assert.equal(resultStatus(null), "unknown");
  assert.equal(resultStatus(""), "unknown");
});

test("splits counts into shares that always add up to 100", () => {
  assert.deepEqual(splitShares([7, 1], 8), [88, 12]);
  assert.deepEqual(splitShares([20, 3], 23), [87, 13]);
  assert.deepEqual(splitShares([19, 3], 23), [83, 13]);
  assert.deepEqual(splitShares([1, 1, 1], 3), [34, 33, 33]);
  assert.deepEqual(splitShares([0, 0], 0), [0, 0]);
  assert.deepEqual(splitShares([5, 0], 5), [100, 0]);
  assert.deepEqual(splitShares([Number.NaN, -2], 5), [0, 0]);

  for (let total = 1; total <= 60; total += 1) {
    for (let af = 0; af <= total; af += 1) {
      const [normal, afShare] = splitShares([total - af, af], total);
      assert.equal(normal + afShare, 100, `total ${total}, af ${af}`);
    }
  }
});

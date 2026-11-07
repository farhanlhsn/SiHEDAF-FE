import assert from "node:assert/strict";
import test from "node:test";

import {
  SAMPLE_RATE_HZ,
  formatDuration,
  recordingDuration,
  recordingDurationMs,
  traceTicks,
} from "../components/dashboard/Signal";

test("the wristband samples PPG at 50 Hz", () => {
  assert.equal(SAMPLE_RATE_HZ, 50);
});

test("recordingDurationMs counts samples at 50 Hz and refuses less than one", () => {
  assert.equal(recordingDurationMs(0), null);
  assert.equal(recordingDurationMs(-3), null);
  assert.equal(recordingDurationMs(Number.NaN), null);
  assert.equal(recordingDurationMs(1), 20);
  assert.equal(recordingDurationMs(2250), 45_000);
  assert.equal(recordingDurationMs(8900), 178_000);
  assert.equal(recordingDurationMs(9000), 180_000);
  // Another rate when the caller knows it.
  assert.equal(recordingDurationMs(100, 100), 1000);
});

test("formatDuration writes seconds and minutes in Indonesian", () => {
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(0), "0 dtk");
  assert.equal(formatDuration(45_000), "45 dtk");
  assert.equal(formatDuration(59_999), "59 dtk");
  assert.equal(formatDuration(60_000), "1 mnt");
  assert.equal(formatDuration(178_000), "2 mnt 58 dtk");
  assert.equal(formatDuration(180_000), "3 mnt");
});

test("formatDuration rounds down, so 149 samples never read as 3 seconds", () => {
  // Under 150 samples the backend says "Not Enough Data" (less than 3 s).
  assert.equal(formatDuration(recordingDurationMs(149)), "2 dtk");
  assert.equal(formatDuration(recordingDurationMs(150)), "3 dtk");
});

test("formatDuration says a sub-second recording is under one second", () => {
  assert.equal(formatDuration(recordingDurationMs(1)), "kurang dari 1 dtk");
  assert.equal(formatDuration(999), "kurang dari 1 dtk");
});

test("formatDuration refuses broken input", () => {
  assert.equal(formatDuration(-1), null);
  assert.equal(formatDuration(Number.NaN), null);
  assert.equal(formatDuration(Number.POSITIVE_INFINITY), null);
});

test("the samples in the spec read as expected", () => {
  assert.equal(formatDuration(recordingDurationMs(2250)), "45 dtk");
  assert.equal(formatDuration(recordingDurationMs(8900)), "2 mnt 58 dtk");
  assert.equal(formatDuration(recordingDurationMs(9000)), "3 mnt");
});

test("recordingDuration labels a PPG array, or null when it is empty or missing", () => {
  assert.equal(recordingDuration(new Array(2250).fill(0)), "45 dtk");
  assert.equal(recordingDuration([]), null);
  assert.equal(recordingDuration(undefined), null);
  assert.equal(recordingDuration(null), null);
});

test("traceTicks gives start, middle and end of a drawable trace", () => {
  assert.deepEqual(traceTicks(2250, 50), ["0 dtk", "22 dtk", "45 dtk"]);
  assert.deepEqual(traceTicks(8900, 50), ["0 dtk", "1 mnt 29 dtk", "2 mnt 58 dtk"]);
  assert.deepEqual(traceTicks(9000, 50), ["0 dtk", "1 mnt 30 dtk", "3 mnt"]);
  // Fewer than two points draw no line, so there is no axis either.
  assert.equal(traceTicks(1, 50), null);
  assert.equal(traceTicks(0, 50), null);
  assert.equal(traceTicks(2250, 0), null);
  assert.equal(traceTicks(2250, Number.NaN), null);
});

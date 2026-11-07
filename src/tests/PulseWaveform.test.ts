import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSvgPath,
  createPulseStream,
  createRandom,
  formatSeconds,
  ppgBeatShape,
  rhythmWindow,
  rrIntervals,
} from "../components/landing/PulseWaveform";

function coefficientOfVariation(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance) / mean;
}

test("shapes a PPG beat with a systolic peak and a dicrotic notch", () => {
  const onset = ppgBeatShape(0);
  const systolic = ppgBeatShape(0.16);
  const notch = ppgBeatShape(0.3);
  const dicrotic = ppgBeatShape(0.38);
  const tail = ppgBeatShape(0.9);

  assert.ok(onset < 0.05, `beat should start near baseline, got ${onset}`);
  assert.ok(systolic > 0.95, `systolic peak should be ~1, got ${systolic}`);
  assert.ok(
    notch < dicrotic,
    "dicrotic wave should rise again after the notch",
  );
  assert.ok(
    dicrotic < systolic * 0.6,
    "dicrotic wave stays below systolic peak",
  );
  assert.ok(tail < 0.08, `beat should settle back to baseline, got ${tail}`);
});

test("keeps normal rhythm regular and makes AF irregularly irregular", () => {
  const normal = rrIntervals("normal", 40, createRandom(7), 60 / 72);
  const af = rrIntervals("af", 40, createRandom(7), 60 / 72);

  assert.equal(normal.length, 40);
  assert.equal(af.length, 40);
  for (const interval of normal) {
    assert.ok(
      Math.abs(interval - 0.8333) < 0.05,
      `normal RR drifted: ${interval}`,
    );
  }
  assert.ok(coefficientOfVariation(normal) < 0.04);
  assert.ok(coefficientOfVariation(af) > 0.15);
  assert.ok(Math.max(...af) / Math.min(...af) > 1.6);
});

test("produces the same rhythm for the same seed", () => {
  assert.deepEqual(
    rrIntervals("af", 8, createRandom(42), 0.8),
    rrIntervals("af", 8, createRandom(42), 0.8),
  );
  assert.notDeepEqual(
    rrIntervals("af", 8, createRandom(42), 0.8),
    rrIntervals("af", 8, createRandom(43), 0.8),
  );
});

test("streams the scheduled rhythm and loops back to the start", () => {
  const stream = createPulseStream({
    baseBpm: 60,
    schedule: [
      { rhythm: "normal", beats: 3 },
      { rhythm: "af", beats: 4 },
    ],
    seed: 3,
  });

  assert.equal(stream.sampleAt(0.5).rhythm, "normal");
  assert.equal(stream.sampleAt(2.5).rhythm, "normal");
  assert.ok(stream.duration > 3, "loop must include the AF beats");
  assert.equal(stream.sampleAt(stream.firstBeatOf("af") + 0.01).rhythm, "af");
  assert.ok(Math.abs(stream.firstBeatOf("af") - 3) < 0.15);
  assert.equal(stream.sampleAt(stream.duration + 0.5).rhythm, "normal");
  assert.ok(Math.abs(stream.sampleAt(0.5).bpm - 60) <= 3);
});

test("maps values to an SVG path with the highest value at the top", () => {
  assert.equal(buildSvgPath([0, 1, 0.5], 100, 50), "M0 50L50 0L100 25");
  assert.equal(buildSvgPath([0.25, 0.75], 10, 8), "M0 6L10 2");
});

test("windows whole beats so intervals tile the strip exactly", () => {
  const normal = rhythmWindow({
    rhythm: "normal",
    seed: 5,
    beats: 6,
    samples: 300,
  });
  const af = rhythmWindow({ rhythm: "af", seed: 5, beats: 7, samples: 300 });

  assert.equal(normal.points.length, 301);
  assert.equal(normal.points[0].t, 0);
  assert.equal(normal.points[300].t, 1);
  assert.equal(normal.intervals.length, 6);
  assert.equal(normal.intervals[0].start, 0);
  assert.ok(Math.abs(normal.intervals[5].end - 1) < 1e-9);
  for (let index = 1; index < normal.intervals.length; index += 1) {
    assert.ok(
      Math.abs(
        normal.intervals[index].start - normal.intervals[index - 1].end,
      ) < 1e-9,
    );
  }
  for (const interval of normal.intervals) {
    assert.ok(Math.abs(interval.end - interval.start - 1 / 6) < 0.02);
    assert.ok(Math.abs(interval.seconds - 0.8333) < 0.05);
  }
  for (const point of [...normal.points, ...af.points]) {
    assert.ok(point.value >= 0 && point.value <= 1.1, `value ${point.value}`);
  }

  const afWidths = af.intervals.map(
    (interval) => interval.end - interval.start,
  );
  assert.ok(Math.max(...afWidths) / Math.min(...afWidths) > 1.4);
});

test("formats seconds with an Indonesian decimal comma", () => {
  assert.equal(formatSeconds(0.8333), "0,83");
  assert.equal(formatSeconds(1.106), "1,11");
});

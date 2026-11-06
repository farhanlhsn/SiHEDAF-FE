import assert from "node:assert/strict";
import test from "node:test";

import {
  buildThread,
  lengthAtScroll,
  pointAtLength,
  spanProgress,
} from "../components/landing/ThreadPath";

function near(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual}`,
  );
}

test("joins two downward anchors with a smooth vertical S-curve", () => {
  const model = buildThread([
    { x: 100, y: 0, dir: "down", to: "curve" },
    { x: 100, y: 200, dir: "down", to: "end" },
  ]);

  assert.equal(model.d, "M100 0C100 90 100 110 100 200");
  near(model.total, 200, 0.5, "straight curve length");
});

test("jumps over an illustration and parks the head while it draws", () => {
  const model = buildThread([
    { x: 0, y: 0, to: "line" },
    { x: 0, y: 100, to: "jump", target: "drawing" },
    { x: 50, y: 300, to: "line" },
    { x: 50, y: 400, to: "end" },
  ]);

  assert.equal(model.d, "M0 0L0 100M50 300L50 400");
  near(model.total, 200, 0.01, "jump adds no length");
  near(lengthAtScroll(model, 50), 50, 0.01, "first line");
  near(lengthAtScroll(model, 200), 100, 0.01, "parked during jump");
  near(lengthAtScroll(model, 350), 150, 0.01, "second line");
  assert.equal(model.spans.length, 1);
  assert.equal(model.spans[0].target, "drawing");
  near(spanProgress(model.spans[0], 200), 0.5, 0.001, "illustration halfway");
  assert.equal(spanProgress(model.spans[0], 0), 0);
  assert.equal(spanProgress(model.spans[0], 999), 1);
});

test("draws a clockwise loop while the reader scrolls past its diameter", () => {
  const model = buildThread([
    { x: 100, y: 0, to: "loop", radius: 50, target: "dial" },
    { x: 300, y: 300, dir: "down", to: "end" },
  ]);

  assert.ok(
    model.d.startsWith("M100 0A50 50 0 1 1 100 100A50 50 0 1 1 100 0C"),
    model.d,
  );
  const circumference = 2 * Math.PI * 50;
  near(
    lengthAtScroll(model, 50),
    circumference / 2,
    1,
    "half loop at mid scroll",
  );
  const bottom = pointAtLength(model, circumference / 2);
  near(bottom.x, 100, 1, "bottom x");
  near(bottom.y, 100, 1, "bottom y");
  const right = pointAtLength(model, circumference / 4);
  near(right.x, 150, 1, "clockwise passes the right side first");
  near(spanProgress(model.spans[0], 100), 1, 0.001, "loop complete");
});

test("draws a pulse wave between two anchors on the same baseline", () => {
  const model = buildThread([
    { x: 0, y: 100, to: "wave", amplitude: 40, seed: 3, beats: 4, lead: -50 },
    { x: 400, y: 100, to: "end", lead: 50 },
  ]);

  assert.ok(model.d.startsWith("M0 100L"), model.d.slice(0, 20));
  assert.ok(model.d.endsWith("L400 100"), model.d.slice(-20));
  for (const y of model.ys) {
    assert.ok(y >= 100 - 44 && y <= 100.5, `wave point out of band: ${y}`);
  }
  assert.ok(Math.min(...model.ys) < 70, "wave should show real peaks");
  near(lengthAtScroll(model, 50), 0, 0.01, "starts drawing at its lead");
  near(lengthAtScroll(model, 150), model.total, 0.01, "done after its trail");
});

test("never lets scroll checkpoints run backwards", () => {
  const model = buildThread([
    { x: 0, y: 300, dir: "right", to: "curve" },
    { x: 300, y: 100, dir: "up", to: "curve" },
    { x: 600, y: 500, dir: "down", to: "end" },
  ]);

  for (let index = 1; index < model.checkpoints.length; index += 1) {
    assert.ok(
      model.checkpoints[index].scroll > model.checkpoints[index - 1].scroll,
    );
    assert.ok(
      model.checkpoints[index].length >= model.checkpoints[index - 1].length,
    );
  }
  assert.equal(lengthAtScroll(model, -1000), 0);
  assert.equal(lengthAtScroll(model, 99999), model.total);
});

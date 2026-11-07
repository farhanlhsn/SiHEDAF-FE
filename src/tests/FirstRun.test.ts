import assert from "node:assert/strict";
import test from "node:test";

import { firstRunSteps } from "../components/dashboard/FirstRun";

const statuses = (state: {
  deviceOnline: boolean;
  monitoringActive: boolean;
  hasResult: boolean;
}) => firstRunSteps(state).map((step) => step.status);

test("starts a new user on wearing the wristband", () => {
  assert.deepEqual(
    statuses({ deviceOnline: false, monitoringActive: false, hasResult: false }),
    ["current", "todo", "todo"],
  );
});

test("moves on once the device is online", () => {
  assert.deepEqual(
    statuses({ deviceOnline: true, monitoringActive: false, hasResult: false }),
    ["done", "current", "todo"],
  );
});

test("waits for the AI result while monitoring", () => {
  assert.deepEqual(
    statuses({ deviceOnline: true, monitoringActive: true, hasResult: false }),
    ["done", "done", "current"],
  );
});

test("treats active monitoring as proof the device was worn", () => {
  assert.deepEqual(
    statuses({ deviceOnline: false, monitoringActive: true, hasResult: false }),
    ["done", "done", "current"],
  );
});

test("finishes every step once a result exists", () => {
  assert.deepEqual(
    statuses({ deviceOnline: false, monitoringActive: false, hasResult: true }),
    ["done", "done", "done"],
  );
});

test("keeps the step order fixed", () => {
  assert.deepEqual(
    firstRunSteps({
      deviceOnline: false,
      monitoringActive: false,
      hasResult: false,
    }).map((step) => step.id),
    ["wear", "monitor", "result"],
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import { deviceState } from "../components/dashboard/DeviceState";

const noError = null;

test("loading wins", () => {
  assert.equal(
    deviceState({ device: null, isLoading: true, error: noError }),
    "loading",
  );
});

test("an error is never reported as offline", () => {
  assert.equal(
    deviceState({
      device: { status: "OFFLINE" },
      isLoading: false,
      error: { title: "x", message: "y" },
    }),
    "error",
  );
});

test("no device bound", () => {
  assert.equal(
    deviceState({ device: null, isLoading: false, error: noError }),
    "none",
  );
});

test("online only for ONLINE", () => {
  assert.equal(
    deviceState({ device: { status: "ONLINE" }, isLoading: false, error: noError }),
    "online",
  );
});

test("any other status is offline", () => {
  for (const status of ["OFFLINE", "IDLE", undefined]) {
    assert.equal(
      deviceState({ device: { status }, isLoading: false, error: noError }),
      "offline",
    );
  }
});

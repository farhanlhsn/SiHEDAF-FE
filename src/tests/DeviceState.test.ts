import assert from "node:assert/strict";
import test from "node:test";

import {
  DEVICE_REFRESH_MS,
  DEVICE_STATUS_LABEL,
  STALE_AFTER_MS,
  answeredAt,
  deviceState,
} from "../components/dashboard/DeviceState";

const noError = null;
const now = Date.parse("2026-11-07T03:00:00Z");
const secondsAgo = (seconds: number) => new Date(now - seconds * 1000).toISOString();

test("loading wins", () => {
  assert.equal(
    deviceState({ device: null, isLoading: true, error: noError, now }),
    "loading",
  );
});

test("an error is never reported as offline", () => {
  assert.equal(
    deviceState({
      device: { status: "OFFLINE" },
      isLoading: false,
      error: { title: "x", message: "y" },
      now,
    }),
    "error",
  );
});

test("no device bound", () => {
  assert.equal(
    deviceState({ device: null, isLoading: false, error: noError, now }),
    "none",
  );
});

test("online only for ONLINE seen within the last 30 s", () => {
  assert.equal(
    deviceState({ device: { status: "ONLINE", lastSeen: secondsAgo(2) }, isLoading: false, error: noError, now }),
    "online",
  );
  assert.equal(
    deviceState({ device: { status: "ONLINE", lastSeen: secondsAgo(30) }, isLoading: false, error: noError, now }),
    "online",
  );
});

test("any other status is offline", () => {
  for (const status of ["OFFLINE", "IDLE", undefined]) {
    assert.equal(
      deviceState({ device: { status, lastSeen: secondsAgo(1) }, isLoading: false, error: noError, now }),
      "offline",
    );
  }
});

test("ONLINE but not seen for more than 30 s is stale, as the backend's start check sees it", () => {
  assert.equal(STALE_AFTER_MS, 30_000);
  for (const lastSeen of [secondsAgo(31), secondsAgo(59), secondsAgo(3600)]) {
    assert.equal(
      deviceState({ device: { status: "ONLINE", lastSeen }, isLoading: false, error: noError, now }),
      "stale",
    );
  }
  // Missing or unreadable lastSeen: we cannot say it is connected.
  for (const lastSeen of [undefined, null, "", "nope"]) {
    assert.equal(
      deviceState({ device: { status: "ONLINE", lastSeen }, isLoading: false, error: noError, now }),
      "stale",
    );
  }
  // Staleness is judged at evaluation time: the same answer goes stale as time passes.
  const device = { status: "ONLINE", lastSeen: secondsAgo(10) };
  assert.equal(deviceState({ device, isLoading: false, error: noError, now }), "online");
  assert.equal(deviceState({ device, isLoading: false, error: noError, now: now + 25_000 }), "stale");
});

test("staleness never outranks loading, error, no device or OFFLINE", () => {
  const old = secondsAgo(120);
  assert.equal(deviceState({ device: { status: "ONLINE", lastSeen: old }, isLoading: true, error: noError, now }), "loading");
  assert.equal(
    deviceState({ device: { status: "ONLINE", lastSeen: old }, isLoading: false, error: { title: "x", message: "y" }, now }),
    "error",
  );
  assert.equal(deviceState({ device: { status: "OFFLINE", lastSeen: old }, isLoading: false, error: noError, now }), "offline");
});

test("without an evaluation time an ONLINE device is not judged stale", () => {
  assert.equal(
    deviceState({ device: { status: "ONLINE", lastSeen: secondsAgo(120) }, isLoading: false, error: noError, now: null }),
    "online",
  );
});

test("the dashboard re-checks the wristband every 30 s", () => {
  assert.equal(DEVICE_REFRESH_MS, 30_000);
});

test("answeredAt reads the server clock from the Date header, else the reader's", () => {
  assert.equal(answeredAt("Sat, 07 Nov 2026 03:00:00 GMT", 5), now);
  assert.equal(answeredAt(null, 5), 5);
  assert.equal(answeredAt("", 5), 5);
  assert.equal(answeredAt("not a date", 5), 5);
});

test("the status card names every device state honestly", () => {
  assert.deepEqual(DEVICE_STATUS_LABEL, {
    loading: "Memuat...",
    online: "Terhubung",
    stale: "Koneksi tidak stabil",
    offline: "Terputus",
    none: "Belum ada perangkat",
    error: "Tidak diketahui",
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  AFTER_SESSION_RECHECK_MS,
  DEVICE_REFRESH_MS,
  DEVICE_STATUS_LABEL,
  STALE_AFTER_MS,
  answeredAt,
  deviceState,
  sessionHoldsDevice,
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
    recording: "Sedang merekam",
  });
});

test("while a session holds the wristband it is recording, whatever status and lastSeen say", () => {
  // The watch stops its idle poll while measuring, so lastSeen freezes and the
  // backend's sweep may even mark it OFFLINE mid-recording.
  const devices = [
    { status: "ONLINE", lastSeen: secondsAgo(2) },
    { status: "ONLINE", lastSeen: secondsAgo(45) },
    { status: "ONLINE", lastSeen: secondsAgo(600) },
    { status: "ONLINE" },
    { status: "OFFLINE", lastSeen: secondsAgo(120) },
  ];
  for (const device of devices) {
    assert.equal(
      deviceState({ device, isLoading: false, error: noError, now, sessionActive: true }),
      "recording",
      JSON.stringify(device),
    );
  }
  // The running session is the evidence: a loading or failed re-check does not undo it.
  assert.equal(deviceState({ device: null, isLoading: true, error: noError, now, sessionActive: true }), "recording");
  assert.equal(
    deviceState({ device: devices[1], isLoading: false, error: { title: "x", message: "y" }, now, sessionActive: true }),
    "recording",
  );
  // Without a session the same answers are judged as before.
  assert.equal(deviceState({ device: devices[1], isLoading: false, error: noError, now, sessionActive: false }), "stale");
  assert.equal(deviceState({ device: devices[4], isLoading: false, error: noError, now }), "offline");
});

test("a session holds the wristband while it records or is analysed", () => {
  for (const phase of ["recording", "analysing"] as const) {
    assert.equal(sessionHoldsDevice({ phase, endedAt: null, answerRequestedAt: null }), true);
    assert.equal(sessionHoldsDevice({ phase, endedAt: now - 60_000, answerRequestedAt: now }), true);
  }
  // No session has ended on this page: the device is judged normally.
  for (const phase of ["idle", "result", "timeout"] as const) {
    assert.equal(sessionHoldsDevice({ phase, endedAt: null, answerRequestedAt: null }), false);
    assert.equal(sessionHoldsDevice({ phase, endedAt: null, answerRequestedAt: now }), false);
  }
});

test("after a session ends the hold lasts until an answer requested at least 8 s later", () => {
  assert.equal(AFTER_SESSION_RECHECK_MS, 8_000);
  const endedAt = now;
  for (const phase of ["idle", "result", "timeout"] as const) {
    // No answer since, or only answers asked for before or soon after the end.
    assert.equal(sessionHoldsDevice({ phase, endedAt, answerRequestedAt: null }), true);
    assert.equal(sessionHoldsDevice({ phase, endedAt, answerRequestedAt: endedAt - 20_000 }), true);
    assert.equal(sessionHoldsDevice({ phase, endedAt, answerRequestedAt: endedAt + 7_999 }), true);
    // The wristband polls again when idle: an answer asked for 8 s later is judged.
    assert.equal(sessionHoldsDevice({ phase, endedAt, answerRequestedAt: endedAt + 8_000 }), false);
    assert.equal(sessionHoldsDevice({ phase, endedAt, answerRequestedAt: endedAt + 30_000 }), false);
  }
});

test("until the reload check finished the wristband is loading, not judged", () => {
  // Mid-recording after a reload the backend reports a frozen lastSeen, or even OFFLINE.
  const answers = [
    { status: "OFFLINE", lastSeen: secondsAgo(120) },
    { status: "ONLINE", lastSeen: secondsAgo(45) },
    { status: "ONLINE", lastSeen: secondsAgo(2) },
  ];
  for (const device of answers) {
    assert.equal(
      deviceState({ device, isLoading: false, error: noError, now, resumeChecked: false }),
      "loading",
      JSON.stringify(device),
    );
  }
  assert.equal(
    deviceState({ device: null, isLoading: false, error: { title: "x", message: "y" }, now, resumeChecked: false }),
    "loading",
  );
  // A session the check (or the user) started holds the wristband: recording wins.
  assert.equal(
    deviceState({ device: answers[0], isLoading: false, error: noError, now, resumeChecked: false, sessionActive: true }),
    "recording",
  );
  // Once checked (the default), the same answers are judged as before.
  assert.equal(deviceState({ device: answers[0], isLoading: false, error: noError, now, resumeChecked: true }), "offline");
  assert.equal(deviceState({ device: answers[1], isLoading: false, error: noError, now }), "stale");
});

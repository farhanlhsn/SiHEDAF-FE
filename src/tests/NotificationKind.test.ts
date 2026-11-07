import assert from "node:assert/strict";
import test from "node:test";

import {
  NOTIFICATION_KIND_LABEL,
  notificationKind,
} from "../components/dashboard/NotificationKind";

test("only AF_DETECTED notifications are rhythm alerts", () => {
  assert.equal(notificationKind({ type: "AF_DETECTED", title: "Medical Alert!" }), "alert");
  assert.equal(notificationKind({ type: "af_detected", title: "Medical Alert!" }), "alert");
});

test("SYSTEM_INFO and anything else is neutral information", () => {
  // "Pengukuran Selesai" is sent even when the AI failed: never a rhythm claim.
  assert.equal(notificationKind({ type: "SYSTEM_INFO", title: "Pengukuran Selesai" }), "info");
  assert.equal(notificationKind({ type: "OTHER", title: "x" }), "info");
  assert.equal(notificationKind({ type: undefined, title: "x" }), "info");
  assert.equal(notificationKind({ type: null, title: "x" }), "info");
});

test("the title text never decides", () => {
  assert.equal(notificationKind({ type: "SYSTEM_INFO", title: "Lihat grafik" }), "info");
  assert.equal(notificationKind({ type: "SYSTEM_INFO", title: "Atrial Fibrillation" }), "info");
  assert.equal(notificationKind({ type: "AF_DETECTED", title: "Pengukuran Selesai" }), "alert");
});

test("each kind has an Indonesian label for its icon", () => {
  assert.deepEqual(NOTIFICATION_KIND_LABEL, {
    alert: "Peringatan AF atau AFL",
    info: "Informasi",
  });
});

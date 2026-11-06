import assert from "node:assert/strict";
import test from "node:test";
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  analysisStatusLabel,
  formatElapsed,
  isFreshResult,
  sessionStartFrom,
} from "../components/dashboard/MonitoringSession";

test("polling constants", () => {
  assert.equal(POLL_INTERVAL_MS, 3000);
  assert.equal(POLL_MAX_ATTEMPTS, 20);
});

test("formatElapsed formats MM:SS and H:MM:SS", () => {
  assert.equal(formatElapsed(0), "00:00");
  assert.equal(formatElapsed(59_999), "00:59");
  assert.equal(formatElapsed(252_000), "04:12");
  assert.equal(formatElapsed(3_599_000), "59:59");
  assert.equal(formatElapsed(3_725_000), "1:02:05");
});

test("formatElapsed guards invalid input", () => {
  assert.equal(formatElapsed(-5), "00:00");
  assert.equal(formatElapsed(Number.NaN), "00:00");
  assert.equal(formatElapsed(Number.POSITIVE_INFINITY), "00:00");
});

test("isFreshResult requires a labelled result that differs from the previous one", () => {
  assert.equal(isFreshResult({ id: 6, resultLabel: "Normal" }, 5), true);
  assert.equal(isFreshResult({ id: 5, resultLabel: "Normal" }, 5), false);
  assert.equal(isFreshResult({ id: 6 }, 5), false);
  assert.equal(isFreshResult(null, 5), false);
  assert.equal(isFreshResult(undefined, null), false);
  assert.equal(isFreshResult({ id: 1, resultLabel: "AF" }, null), true);
  assert.equal(isFreshResult({ resultLabel: "AF" }, 5), true);
});

test("analysisStatusLabel maps API statuses to Indonesian", () => {
  assert.equal(analysisStatusLabel("COMPLETED"), "Selesai");
  assert.equal(analysisStatusLabel("completed"), "Selesai");
  assert.equal(analysisStatusLabel("IN_PROGRESS"), "Sedang berjalan");
  assert.equal(analysisStatusLabel("in_progress"), "Sedang berjalan");
  assert.equal(analysisStatusLabel("WHATEVER"), "—");
  assert.equal(analysisStatusLabel(undefined), "—");
  assert.equal(analysisStatusLabel(null), "—");
});

test("sessionStartFrom reads createdAt of an in-progress session", () => {
  const iso = "2026-11-06T10:00:00Z";
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS", createdAt: iso }), Date.parse(iso));
  assert.equal(sessionStartFrom({ status: "in_progress", createdAt: iso }), Date.parse(iso));
  assert.equal(sessionStartFrom({ status: "COMPLETED", createdAt: iso }), null);
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS", createdAt: "nope" }), null);
  assert.equal(sessionStartFrom({ status: "IN_PROGRESS" }), null);
  assert.equal(sessionStartFrom(null), null);
});

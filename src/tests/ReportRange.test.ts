import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  defaultReportRange,
  jakartaDay,
  localDay,
  parseReportRange,
  rangeEndingOn,
  rangeFromDateRange,
  reportHref,
  toDateRange,
} from "../components/dashboard/ReportRange";

test("defaults to the last 30 Jakarta days, today included", () => {
  assert.deepEqual(defaultReportRange(new Date("2026-11-06T10:00:00Z")), { from: "2026-10-08", to: "2026-11-06" });
});

test("uses the Jakarta calendar day near midnight UTC", () => {
  assert.equal(jakartaDay(new Date("2026-11-06T18:30:00Z")), "2026-11-07");
  assert.deepEqual(defaultReportRange(new Date("2026-11-06T18:30:00Z")), { from: "2026-10-09", to: "2026-11-07" });
});

test("steps across month and year boundaries", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-01-01", -29), "2025-12-03");
});

test("builds the 30-day window that ends on a history item", () => {
  assert.deepEqual(rangeEndingOn("2026-11-06T10:58:00Z"), { from: "2026-10-08", to: "2026-11-06" });
  assert.equal(rangeEndingOn(undefined), null);
  assert.equal(rangeEndingOn("nope"), null);
});

test("keeps a valid range from the URL", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  assert.deepEqual(parseReportRange({ from: "2026-09-01", to: "2026-09-30" }, now), { from: "2026-09-01", to: "2026-09-30" });
});

test("falls back to the default range for hand-edited URLs", () => {
  const now = new Date("2026-11-06T10:00:00Z");
  const fallback = { from: "2026-10-08", to: "2026-11-06" };
  for (const params of [
    {},
    { from: "2026-09-01" },
    { from: "abc", to: "2026-09-30" },
    { from: "2026-02-30", to: "2026-03-05" },
    { from: "2026-09-30", to: "2026-09-01" },
    { from: ["2026-09-01", "2026-09-02"], to: "2026-09-30" },
  ]) {
    assert.deepEqual(parseReportRange(params, now), fallback, JSON.stringify(params));
  }
});

test("links to the report with or without a range", () => {
  assert.equal(reportHref(null), "/riwayat/laporan");
  assert.equal(reportHref({ from: "2026-09-01", to: "2026-09-30" }), "/riwayat/laporan?from=2026-09-01&to=2026-09-30");
});

test("converts between picker dates and report days", () => {
  assert.equal(localDay(new Date(2026, 8, 1)), "2026-09-01");
  assert.deepEqual(rangeFromDateRange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) }), { from: "2026-09-01", to: "2026-09-30" });
  assert.equal(rangeFromDateRange({ from: new Date(2026, 8, 1) }), null);
  assert.equal(localDay(toDateRange({ from: "2026-09-01", to: "2026-09-30" }).to), "2026-09-30");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  dateFilterNote,
  SUMMARY_COMPUTED_NOTE,
} from "../components/dashboard/HistoryNotes";

const prefix = "Filter tanggal memakai hari UTC, jadi satu tanggal di daftar ini mencakup";

test("no note when local days are UTC days", () => {
  assert.equal(dateFilterNote(0), null);
  assert.equal(dateFilterNote(Number.NaN), null);
});

test("east of UTC: the day starts that morning and ends the next morning", () => {
  assert.equal(
    dateFilterNote(7 * 60),
    `${prefix} pukul 07.00 sampai 06.59 keesokan harinya (waktu setempat).`,
  );
  assert.equal(
    dateFilterNote(8 * 60),
    `${prefix} pukul 08.00 sampai 07.59 keesokan harinya (waktu setempat).`,
  );
});

test("offsets that are not whole hours keep their minutes", () => {
  assert.match(dateFilterNote(5 * 60 + 30) ?? "", /pukul 05\.30 sampai 05\.29 keesokan/);
  assert.match(dateFilterNote(5 * 60 + 45) ?? "", /pukul 05\.45 sampai 05\.44 keesokan/);
  assert.match(dateFilterNote(-(9 * 60 + 30)) ?? "", /pukul 14\.30 hari sebelumnya sampai 14\.29/);
});

test("west of UTC: the day starts the evening before", () => {
  assert.equal(
    dateFilterNote(-5 * 60),
    `${prefix} pukul 19.00 hari sebelumnya sampai 18.59 (waktu setempat).`,
  );
});

test("a window that ends at midnight wraps to 23.59", () => {
  assert.match(dateFilterNote(24 * 60 - 1) ?? "", /pukul 23\.59 sampai 23\.58 keesokan/);
  assert.match(dateFilterNote(-12 * 60) ?? "", /pukul 12\.00 hari sebelumnya sampai 11\.59/);
  assert.match(dateFilterNote(60) ?? "", /pukul 01\.00 sampai 00\.59 keesokan/);
});

test("the summary note says what the server counts", () => {
  assert.ok(SUMMARY_COMPUTED_NOTE.startsWith("Angka ringkasan dihitung server:"));
  assert.ok(SUMMARY_COMPUTED_NOTE.includes("Terdeteksi AF belum mencakup AFL"));
});

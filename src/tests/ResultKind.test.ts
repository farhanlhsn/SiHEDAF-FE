import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyResult,
  isAlertKind,
  RESULT_COPY,
  type ResultKind,
} from "../components/dashboard/ResultKind";

const kind = (m: Parameters<typeof classifyResult>[0]): ResultKind => classifyResult(m);

test("a measurement that is not COMPLETED is pending, whatever its fields say", () => {
  assert.equal(kind({ status: "IN_PROGRESS", resultClass: 1, resultLabel: "AFIB (A)", confidenceLevel: 0.9 }), "pending");
  assert.equal(kind({ status: "in_progress" }), "pending");
  assert.equal(kind({ status: "FAILED", resultClass: 0, confidenceLevel: 0.9 }), "pending");
  assert.equal(kind({ status: "completed", resultClass: 0, confidenceLevel: 0.9 }), "normal");
});

test("Not Enough Data is short, in any case and spacing, even with class 0", () => {
  assert.equal(kind({ status: "COMPLETED", resultClass: 0, resultLabel: "Not Enough Data", confidenceLevel: 0 }), "short");
  assert.equal(kind({ resultLabel: "  not enough DATA " }), "short");
  assert.equal(kind({ resultClass: 1, resultLabel: "NOT ENOUGH DATA", confidenceLevel: 0.9 }), "short");
  assert.equal(kind({ status: "IN_PROGRESS", resultLabel: "Not Enough Data" }), "pending");
});

test("resultClass 1 is af and 2 is flutter", () => {
  assert.equal(kind({ resultClass: 1, resultLabel: "Atrial Fibrillation", confidenceLevel: 0.8 }), "af");
  assert.equal(kind({ resultClass: 1 }), "af");
  assert.equal(kind({ resultClass: 2, resultLabel: "Atrial Flutter", confidenceLevel: 0.7 }), "flutter");
  assert.equal(kind({ resultClass: 2 }), "flutter");
});

const samples = (count: number) => ({ rawPpgData: Array.from({ length: count }, () => 0) });

test("class 0 without confidence on an analysable recording is unavailable, with confidence normal", () => {
  const full = samples(150);
  assert.equal(kind({ resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0, ppgResult: full }), "unavailable");
  assert.equal(kind({ resultClass: 0, confidenceLevel: null, ppgResult: full }), "unavailable");
  assert.equal(kind({ resultClass: 0, ppgResult: full }), "unavailable");
  assert.equal(kind({ resultClass: 0, confidenceLevel: -1, ppgResult: full }), "unavailable");
  assert.equal(kind({ resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.96 }), "normal");
  assert.equal(kind({ resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0.96, ppgResult: samples(10) }), "normal");
});

test("class 0 without confidence and under 150 samples is short: the AI never saw it", () => {
  // The backend writes "Not Enough Data" only for 1–149 samples; with none it
  // keeps "Normal (N)", class 0, confidence 0 (Stop pressed within seconds).
  const zero = { status: "COMPLETED", resultClass: 0, resultLabel: "Normal (N)", confidenceLevel: 0 };
  assert.equal(kind({ ...zero, ppgResult: samples(0) }), "short");
  assert.equal(kind({ ...zero, ppgResult: samples(149) }), "short");
  assert.equal(kind({ ...zero, ppgResult: samples(150) }), "unavailable");
  assert.equal(kind({ ...zero, ppgResult: samples(9000) }), "unavailable");
  // No PPG row or no samples at all.
  assert.equal(kind(zero), "short");
  assert.equal(kind({ ...zero, ppgResult: null }), "short");
  assert.equal(kind({ ...zero, ppgResult: {} }), "short");
  assert.equal(kind({ ...zero, ppgResult: { rawPpgData: null } }), "short");
  assert.equal(kind({ ...zero, confidenceLevel: null, ppgResult: samples(149) }), "short");
  // The label fallback follows the same rule.
  assert.equal(kind({ resultLabel: "Normal (N)", confidenceLevel: 0, ppgResult: samples(149) }), "short");
  assert.equal(kind({ resultLabel: "Normal (N)", confidenceLevel: 0, ppgResult: samples(150) }), "unavailable");
  // Alert classes and real confidence never become short.
  assert.equal(kind({ resultClass: 1, confidenceLevel: 0, ppgResult: samples(0) }), "af");
  assert.equal(kind({ resultClass: 2, ppgResult: samples(0) }), "flutter");
});

test("without resultClass the label decides", () => {
  const full = samples(150);
  assert.equal(kind({ resultLabel: "Normal (N)", confidenceLevel: 0.9 }), "normal");
  assert.equal(kind({ resultLabel: "Normal Rhythm", confidenceLevel: 0.9 }), "normal");
  assert.equal(kind({ resultLabel: "Normal (N)", confidenceLevel: 0, ppgResult: full }), "unavailable");
  assert.equal(kind({ resultLabel: "Normal (N)", ppgResult: full }), "unavailable");
  assert.equal(kind({ resultLabel: "AFIB (A)" }), "af");
  assert.equal(kind({ resultLabel: "AF Detected" }), "af");
  assert.equal(kind({ resultLabel: "Atrial Fibrillation" }), "af");
  assert.equal(kind({ resultLabel: "Atrial Flutter" }), "flutter");
  assert.equal(kind({ resultLabel: "AFL (F)" }), "flutter");
  assert.equal(kind({ resultLabel: "something else" }), "pending");
  // "normal" must be a whole word: an abnormal label is never a normal result.
  assert.equal(kind({ resultLabel: "Abnormal", confidenceLevel: 0.9 }), "pending");
  assert.equal(kind({ resultLabel: "abnormal rhythm", confidenceLevel: 0.9 }), "pending");
  assert.equal(kind({ resultLabel: "NORMAL", confidenceLevel: 0.9 }), "normal");
  assert.equal(kind({ resultLabel: "" }), "pending");
  assert.equal(kind({}), "pending");
  assert.equal(kind({ resultLabel: null, resultClass: null }), "pending");
});

test("only af and flutter are alert kinds", () => {
  const alerts = (["normal", "af", "flutter", "short", "unavailable", "pending"] as const).filter(isAlertKind);
  assert.deepEqual(alerts, ["af", "flutter"]);
});

test("copy table holds the exact Indonesian strings", () => {
  assert.deepEqual(RESULT_COPY.normal, {
    label: "Normal Rhythm",
    title: "Irama Jantung Normal",
    sentence: "Jarak antar detak pada rekaman ini terlihat teratur. Tetap pantau secara berkala.",
  });
  assert.deepEqual(RESULT_COPY.af, {
    label: "Terdeteksi AF",
    title: "Terdeteksi Potensi AF",
    sentence:
      "AI menemukan pola tidak teratur yang mirip Atrial Fibrillation. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan.",
  });
  assert.deepEqual(RESULT_COPY.flutter, {
    label: "Terdeteksi AFL",
    title: "Terdeteksi Potensi Atrial Flutter",
    sentence:
      "AI menemukan pola yang mirip Atrial Flutter, salah satu jenis irama tidak teratur. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan.",
  });
  assert.deepEqual(RESULT_COPY.short, {
    label: "Rekaman terlalu singkat",
    title: "Rekaman terlalu singkat",
    sentence:
      "Rekaman ini kurang dari 3 detik sehingga belum bisa dianalisis. Coba rekam lagi dan biarkan berjalan lebih lama.",
  });
  assert.deepEqual(RESULT_COPY.unavailable, {
    label: "Hasil AI tidak tersedia",
    title: "Hasil AI tidak tersedia",
    sentence: "Layanan AI tidak memberi hasil untuk rekaman ini. Coba rekam lagi beberapa saat lagi.",
  });
  assert.deepEqual(RESULT_COPY.pending, {
    label: "Belum ada hasil",
    title: "Hasil analisis belum tersedia",
    sentence: "Rekaman ini belum memiliki hasil analisis AI.",
  });
});

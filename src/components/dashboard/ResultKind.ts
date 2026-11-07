/**
 * The one place that decides what a measurement result means. The backend
 * writes resultClass 0/1/2 (Normal/AFIB/AFL), "Not Enough Data" for recordings
 * under 3 s and "Normal (N)" with confidence 0 when the AI call failed, so the
 * label alone is never enough. UI code must not look at label text itself.
 */
export type ResultKind =
  | "normal"
  | "af"
  | "flutter"
  | "short"
  | "unavailable"
  | "pending";

export type ClassifiableResult = {
  status?: string | null;
  resultClass?: number | null;
  resultLabel?: string | null;
  confidenceLevel?: number | null;
};

function hasConfidence(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function classifyResult(m: ClassifiableResult): ResultKind {
  if (m.status && m.status.trim().toUpperCase() !== "COMPLETED") {
    return "pending";
  }

  const label = (m.resultLabel ?? "").trim().toLowerCase();

  if (label === "not enough data") return "short";

  if (m.resultClass === 1) return "af";
  if (m.resultClass === 2) return "flutter";
  if (m.resultClass === 0) {
    return hasConfidence(m.confidenceLevel) ? "normal" : "unavailable";
  }

  // resultClass missing: fall back to the label.
  if (label.includes("flutter") || label.startsWith("afl")) return "flutter";
  if (label.includes("fibrillation") || label.startsWith("af")) return "af";
  // A whole word, so "abnormal" never reads as normal.
  if (/\bnormal\b/.test(label)) {
    return hasConfidence(m.confidenceLevel) ? "normal" : "unavailable";
  }

  return "pending";
}

/** Kinds that carry the alert styling, the AF note and the doctor report link. */
export function isAlertKind(kind: ResultKind): kind is "af" | "flutter" {
  return kind === "af" || kind === "flutter";
}

export type ResultCopy = { label: string; title: string; sentence: string };

export const RESULT_COPY: Record<ResultKind, ResultCopy> = {
  normal: {
    label: "Normal Rhythm",
    title: "Irama Jantung Normal",
    sentence:
      "Jarak antar detak pada rekaman ini terlihat teratur. Tetap pantau secara berkala.",
  },
  af: {
    label: "Terdeteksi AF",
    title: "Terdeteksi Potensi AF",
    sentence:
      "AI menemukan pola tidak teratur yang mirip Atrial Fibrillation. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan.",
  },
  flutter: {
    label: "Terdeteksi AFL",
    title: "Terdeteksi Potensi Atrial Flutter",
    sentence:
      "AI menemukan pola yang mirip Atrial Flutter, salah satu jenis irama tidak teratur. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan.",
  },
  short: {
    label: "Rekaman terlalu singkat",
    title: "Rekaman terlalu singkat",
    sentence:
      "Rekaman ini kurang dari 3 detik sehingga belum bisa dianalisis. Coba rekam lagi dan biarkan berjalan lebih lama.",
  },
  unavailable: {
    label: "Hasil AI tidak tersedia",
    title: "Hasil AI tidak tersedia",
    sentence:
      "Layanan AI tidak memberi hasil untuk rekaman ini. Coba rekam lagi beberapa saat lagi.",
  },
  pending: {
    label: "Belum ada hasil",
    title: "Hasil analisis belum tersedia",
    sentence: "Rekaman ini belum memiliki hasil analisis AI.",
  },
};

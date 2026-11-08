const MINUTES_PER_DAY = 24 * 60;

/** Shown under the summary cards: the server's counts are coarser than the list. */
export const SUMMARY_COMPUTED_NOTE =
  "Angka ringkasan dihitung server: Ritme Normal juga mencakup rekaman yang terlalu singkat atau tanpa hasil AI, dan Terdeteksi AF belum mencakup AFL. Hasil tiap rekaman ada di daftar di bawah.";

function clock(minuteOfDay: number): string {
  const wrapped = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, "0")}.${String(minutes).padStart(2, "0")}`;
}

/**
 * The backend filters on UTC days of `completedAt`, so one date in the list
 * spans a different local window. `offsetMinutes` is the reader's UTC offset
 * (`-date.getTimezoneOffset()`) at the range's start date. Returns null when
 * local days and UTC days line up.
 */
export function dateFilterNote(offsetMinutes: number): string | null {
  if (!Number.isFinite(offsetMinutes) || offsetMinutes === 0) return null;

  const start = clock(offsetMinutes);
  const end = clock(offsetMinutes - 1);
  const window =
    offsetMinutes > 0
      ? `pukul ${start} sampai ${end} keesokan harinya`
      : `pukul ${start} hari sebelumnya sampai ${end}`;
  return `Filter tanggal memakai hari UTC, jadi satu tanggal di daftar ini mencakup ${window} (waktu setempat).`;
}

# Detail Riwayat, Laporan Dokter, dan Sambutan Pengguna Baru — Design

Tanggal: 6 November 2026
Status: menunggu review

## Tujuan

Melengkapi dashboard yang sudah dirombak dengan tiga hal yang dibutuhkan pengguna awam (pasien, keluarga, lansia):

1. **Detail riwayat**: melihat satu hasil analisis dengan jelas, bukan hanya baris tabel kecil.
2. **Laporan untuk dokter**: copy kita sudah menjanjikan hasil "mudah ditunjukkan ke dokter"; laporan siap cetak/PDF memenuhi janji itu.
3. **Sambutan pengguna baru**: dashboard yang belum punya data memberi arahan 3 langkah, bukan halaman yang nyaris kosong.

Kriteria sukses: seorang pengguna bisa membuka satu hasil AF, membuat laporan 30 hari terakhir, lalu menyimpannya sebagai PDF dari HP atau laptop, dan pengguna baru tahu harus melakukan apa tanpa membaca dokumentasi.

## Konteks dan batasan

- **Tanpa endpoint API baru.** Data yang tersedia:
  - `GET /api/v1/measurement/history?page&limit&startDate&endDate` →
    `{ code, data: { data: HistoryItem[], metadata: { totalPages }, summary: { totalData, totalAfib, totalNormal } } }`.
    `HistoryItem` berisi `id`, `resultLabel`, `confidenceLevel`, `requestedAt`, `deviceId`, `ppgResult.rawPpgData`.
  - `GET /api/v1/measurement/latest` dan `GET /api/v1/measurement/my-device` (lewat `useMyDevice`).
  - Profil pengguna dari `ProfileProvider` (`useProfile`).
- **Sampling rate sinyal PPG tidak diketahui.** Karena itu tidak ada angka detik, BPM, ataupun deteksi puncak. Grafik ditampilkan tanpa skala waktu, dan hal ini dinyatakan terang-terangan di laporan.
- **Kejujuran data medis.** Nilai yang tidak dikirim API ditampilkan sebagai "—" atau "Tidak tersedia" (memakai `DashboardFormat.ts`). Setiap tampilan hasil AF menyertakan saran konsultasi ke dokter dan pengingat bahwa ini bukan diagnosis.
- Mengikuti design system hasil redesign: latar `paper`, token `primary`/`af`/`warn`, teks minimal 13px, teks navy minimal 70% opacity, motion yang menghormati `prefers-reduced-motion`.
- Mengikuti konvensi repo: komponen PascalCase, logika (state, fetch, handler) di custom hook, logika murni di modul terpisah yang bisa diuji.

## Pendekatan yang dipilih

Laporan dibuat sebagai **halaman cetak di dalam dashboard** dan disimpan sebagai PDF lewat dialog cetak browser (`window.print()`).

Alternatif yang tidak dipilih:

- PDF di browser dengan library (jsPDF/react-pdf): menambah 200–400 KB bundle, dan font serta tata letak lebih sulit dibuat rapi.
- PDF di server dengan headless Chromium: butuh infrastruktur baru, berlebihan untuk kebutuhan ini.

## 1. Detail riwayat

### Interaksi

- Setiap baris di tabel Riwayat bisa diklik untuk membuka detail.
- Aksesibilitas: sel pertama (waktu analisis) berupa `<button>` dengan nama aksesibel "Lihat detail analisis {tanggal} {jam}", sehingga bisa dibuka lewat keyboard. Klik di bagian lain baris juga membuka detail. Baris mendapat `cursor-pointer` dan hover `bg-paper`.
- State `selectedItem` dan `setSelectedItem` disimpan di `useHistoryView`.

### Komponen

- `HistoryDetailModal.tsx` (client), props `{ item: HistoryItem | null; onClose: () => void }`.
- Memakai `DashboardModal` dengan prop baru `size?: "default" | "wide"` (`max-w-[480px]` atau `max-w-[760px]`). Perilaku Escape, backdrop, dan label dialog tetap dari primitive yang sama.
- Isi modal:
  - `StatusMark` beserta label ("Normal Rhythm" atau "Terdeteksi AF") dan judul ("Irama Jantung Normal" atau "Terdeteksi Potensi AF").
  - Grafik besar `PpgTrace` (tanpa sumbu waktu), biru untuk normal dan pink untuk AF.
  - Tiga fakta: Waktu (`formatWib`), Keyakinan AI (`formatConfidence` atau "Tidak tersedia"), Device ID (`item.deviceId` atau "—").
  - Penjelasan awam:
    - Normal: "Jarak antar detak pada rekaman ini terlihat teratur. Tetap pantau secara berkala."
    - AF: "AI menemukan pola tidak teratur yang mirip Atrial Fibrillation. Ini bukan diagnosis; tunjukkan hasil ini ke dokter, terutama bila ada keluhan."
  - Aksi: "Tutup". Untuk hasil AF ada tambahan "Buat laporan dokter", yaitu link ke laporan 30 hari inklusif yang berakhir di tanggal item tersebut (Jakarta): `from = tanggal item − 29 hari`, `to = tanggal item`.

### Grafik bersama

- Helper murni baru `tracePath(data, width, height, padding)` di `DashboardFormat.ts` yang menormalkan `rawPpgData` menjadi path SVG.
- `Sparkline` dan `SignalChart` memakai helper ini, menghapus logika normalisasi yang sekarang terduplikasi.
- `PpgTrace.tsx` adalah grafik statis besar (tinggi bisa diatur, `preserveAspectRatio="none"`, `vector-effect: non-scaling-stroke`). Dipakai oleh modal dan laporan.

## 2. Laporan untuk dokter

### Route dan navigasi

- Route `src/app/(dashboard)/riwayat/laporan/page.tsx`. Sudah terlindungi oleh `proxy.ts` (matcher `/riwayat/:path*`) dan sesi di layout dashboard.
- `DashboardShell.routeTitles` mendapat entri `"/riwayat/laporan": "Laporan"`.
- `DashboardSidebar`: item Riwayat aktif untuk semua `/riwayat/*` (memakai `startsWith`, sama seperti Profil).
- Titik masuk:
  - tombol "Buat laporan dokter" di header Riwayat. Kalau ada rentang tanggal yang dipilih, `from`/`to` ikut dibawa; kalau tidak, link tanpa parameter sehingga dipakai rentang default;
  - tombol di modal detail AF.

### Rentang tanggal

- Parameter URL `from` dan `to` dengan format `YYYY-MM-DD` (zona Asia/Jakarta), sehingga laporan bisa di-refresh dan dibuka ulang dengan rentang yang sama.
- Fungsi murni:
  - `defaultReportRange(now)` → 30 hari inklusif yang berakhir hari ini (Jakarta): `from = hari ini − 29 hari`, `to = hari ini`.
  - `parseReportRange(params, now)` → rentang valid. Parameter yang hilang, tidak valid, atau terbalik (`from > to`) jatuh ke default.
- Mengubah rentang lewat `DateRangePicker` memperbarui URL dengan `router.replace`.

### Pengambilan data

- Fungsi murni `collectReport(fetchPage, { from, to, pageSize = 50, maxPages = 10 })`:
  - Mengambil halaman 1..N sampai `totalPages` atau `maxPages`, mana yang lebih dulu.
  - Mengembalikan `{ summary, afEvents, scanned, truncated }`:
    - `summary` diambil dari respons halaman pertama (total resmi untuk rentang itu);
    - `afEvents` berisi item dengan `isNormalResult(label) === false`, urut dari yang terbaru;
    - `scanned` adalah jumlah item yang sempat diperiksa;
    - `truncated` bernilai `true` jika masih ada halaman yang tidak diambil.
  - `fetchPage` di-inject agar bisa diuji tanpa jaringan.
- Hook `useDoctorReport` membungkus `collectReport` dengan `fetch` sungguhan, state loading/error/retry, `useProfile`, dan `useMyDevice`.

### Isi laporan (A4 potret)

1. Kepala: logo, judul "Laporan Pemantauan Irama Jantung", waktu dibuat (`formatWib`), dan periode.
2. Identitas: nama, email, Device ID.
3. Ringkasan: total rekaman, AF terdeteksi, ritme normal, persentase AF (`shareOf`), dan bar proporsi Normal/AF.
4. Daftar kejadian AF: tabel berisi No, Waktu, Keyakinan AI, dan grafik `PpgTrace` kecil.
   - Kalau kosong: "Tidak ada AF terdeteksi pada periode ini."
   - Kalau `truncated`: "Menampilkan kejadian AF dari {scanned} rekaman pertama pada periode ini."
5. Catatan: "Hasil berasal dari klasifikasi AI atas sinyal PPG wearable dan bukan diagnosis. Mohon dievaluasi oleh tenaga kesehatan. Grafik ditampilkan tanpa skala waktu."

### Cetak

- Toolbar (rentang tanggal + tombol "Cetak / Simpan PDF" yang memanggil `window.print()`) diberi `print:hidden`.
- Bagian shell yang ikut disembunyikan saat cetak (`print:hidden`): sidebar, topbar, tombol notifikasi, dan panel notifikasi.
- CSS cetak di `globals.css`:
  - `@page { size: A4; margin: 14mm; }`;
  - latar putih;
  - `break-inside: avoid` untuk baris tabel dan blok ringkasan;
  - warna dipertahankan dengan `print-color-adjust: exact`.

### State

- Loading: `PulseLoader`.
- Error: pesan dengan tombol "Coba lagi".
- Rentang kosong: ringkasan 0 dan pesan "Belum ada rekaman pada periode ini."

## 3. Sambutan pengguna baru

- Tampil di `DashboardOverview` ketika data terakhir **sudah selesai dimuat** dan hasilnya kosong. Untuk itu `useDashboardOverview` mendapat flag baru `hasLoadedLatest`, supaya panduan tidak berkedip sebelum data datang.
- Fungsi murni `firstRunSteps({ deviceOnline, monitoringActive, hasResult })` mengembalikan tiga langkah, masing-masing berstatus `done`, `current`, atau `todo`. `current` adalah langkah pertama yang belum selesai.
  1. **Pakai wristband**: "Kenakan SiHEDAF di pergelangan tangan dan pastikan statusnya Terhubung." Selesai jika perangkat ONLINE.
  2. **Mulai monitoring**: "Tekan Mulai Monitoring. Sinyal PPG akan direkam secara berkala." Selesai jika monitoring aktif. Langkah ini punya link "#monitor" yang menggulir ke kartu sinyal (kartu mendapat `id="monitor"`).
  3. **Tunggu hasil AI**: "Hentikan monitoring untuk melihat hasil analisis pertamamu." Selesai jika hasil sudah ada.
- Visualnya berupa rel dengan stasiun, sama seperti `AuthJourney`: langkah selesai bertanda centang, langkah aktif berdenyut, langkah berikutnya putus-putus. Judul "Belum ada hasil analisis." tetap ada; kalimat tipis di bawahnya diganti panduan ini.
- Begitu hasil pertama muncul, panduan hilang dan kalimat status biasa tampil.

## Pengujian

- **Unit test** (TDD), dengan nilai harapan ditulis manual:
  - `tracePath`: normalisasi, data kosong atau satu titik, data datar.
  - `firstRunSteps`: semua kombinasi status yang relevan.
  - `defaultReportRange` dan `parseReportRange`: default, parameter tidak valid, rentang terbalik, batas hari di zona Jakarta.
  - `collectReport`: berhenti di `totalPages`, terpotong di `maxPages` dengan `truncated`, filter AF, urutan, ringkasan dari halaman pertama, perambatan error.
- **Test kontrak**:
  - baris riwayat punya tombol detail yang aksesibel dan modal memakai `DashboardModal`;
  - route laporan ada di `(dashboard)` dan memakai `window.print` serta `print:hidden`;
  - aturan `@page` ada di CSS;
  - sidebar aktif untuk `/riwayat/*`;
  - file-file baru ikut aturan token, ukuran teks, dan kontras di `DashboardRedesign.test.mjs`.
- **Smoke test** (Playwright + mock API lokal):
  - membuka detail dari baris riwayat;
  - laporan menampilkan ringkasan dan 3 kejadian AF dari data mock;
  - screenshot dengan `emulateMedia({ media: "print" })` memastikan sidebar dan toolbar tersembunyi;
  - panduan pengguna baru tampil saat mock `latest` kosong.
- Quality gate: `npm test`, `npm run lint`, `npm run build`.

## Di luar cakupan

PDF di server, kirim laporan lewat email atau tautan berbagi, angka detik/BPM dan deteksi puncak, endpoint detail per item, serta penyimpanan laporan di server.

## Risiko

- **Batas `limit` di backend tidak diketahui.** `pageSize = 50`; kalau backend membatasi lebih kecil, perulangan tetap benar karena berpatokan pada `totalPages`.
- **Asumsi bahwa `summary` dari API mengikuti filter tanggal.** `HistoryView` saat ini sudah bergantung pada asumsi yang sama, jadi laporan memakai `summary` dari API apa adanya. Fallback (menghitung ulang dari item yang diambil) tidak dibuat sekarang; kalau backend ternyata tidak memfilter `summary`, itu ditangani sebagai perubahan terpisah.
- **Dialog cetak berbeda antarbrowser.** Tata letak diuji di Chromium; Safari iOS memakai "Bagikan → Cetak → Simpan PDF".

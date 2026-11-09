<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SiHEDAF Project Guide

Terakhir diperbarui: 8 November 2026.

## Gambaran Project

SiHEDAF adalah antarmuka web untuk wearable pemantau sinyal PPG yang membantu deteksi dini risiko Atrial Fibrillation (AF) dan stroke. Project saat ini mencakup website pemasaran, autentikasi, penyambungan perangkat, serta dashboard pemantauan kesehatan.

Bahasa utama antarmuka adalah Bahasa Indonesia. Implementasi saat ini berfokus pada UI dan pengalaman pengguna berdasarkan desain referensi; dashboard membaca data kesehatan, akun, notifikasi, dan perangkat dari backend melalui route proxy API (`src/app/api/v1/*`); hanya ilustrasi di landing page yang bersifat ilustratif.

## Tech Stack

- Next.js `16.4.5` dengan App Router dan Turbopack.
- React dan React DOM `19.3.1`.
- TypeScript 6 (`~6.0.3`). TypeScript 7 belum dipakai karena `typescript-eslint` baru mendukung `<6.1` dan TS 7 tidak lagi menyediakan API compiler lama.
- Tailwind CSS 4 melalui `@tailwindcss/postcss`.
- Lucide React untuk ikon kontrol panel yang semantic dan konsisten.
- `@daypicker/react` untuk calendar range picker yang terkontrol dan mudah dipetakan ke parameter API.
- ESLint 9 dengan `eslint-config-next`. ESLint 10 belum dipakai karena `eslint-plugin-react` (dependensi `eslint-config-next`) masih membatasi peer ke ESLint 9.
- `date-fns` 4 sebagai dependensi eksplisit (dipakai langsung oleh panel notifikasi).
- Node.js native test runner untuk source-contract tests.
- Tidak menggunakan UI kit atau chart library eksternal; ikon dan grafik dibuat dengan SVG lokal.

Sebelum mengubah API, route, layout, metadata, atau convention Next.js, baca panduan yang relevan di `node_modules/next/dist/docs/` karena versi ini memiliki perubahan dari versi Next.js sebelumnya.

## Update yang Sudah Dikerjakan

### Design foundation

- Font Switzer Variable sudah disimpan secara lokal di `src/app/fonts/switzer-variable.woff2` dan dimuat melalui `next/font/local`.
- Palet warna SiHEDAF sudah menjadi token Tailwind pada `src/app/globals.css`.
- Logo, gambar wearable utama, dan wearable dashboard tersedia di folder `public`.
- Global selection color, smooth scroll, typography, motion dashboard, dan dukungan `prefers-reduced-motion` sudah disiapkan.

### Landing page — konsep "satu garis"

- Satu garis PPG biru (`ScrollThread`) digambar mengikuti scroll dari hero sampai CTA, melewati "stasiun" bernomor di tiap section (01 Masalahnya, 02 Berjaga 24 jam, 03 Cara kerja).
- Rute garis dibaca dari anchor `ThreadPoint` / `ThreadStation` di DOM; geometrinya dihitung oleh modul murni `ThreadPath.ts` (curve, line, jump, wave, loop) sehingga mengikuti layout di setiap breakpoint. Di bawah `lg` garis berjalan lurus di rail kiri.
- Elemen yang diberi `data-thread-for="<target>"` menerima CSS variable `--thread-progress` (0–1) untuk animasi yang sinkron dengan garis: baris "Bisa bedakan?", jam 24 jam, line-art empat langkah, dan hati di CTA.
- Hero memakai `LivePulseMonitor` (canvas, sweep seperti monitor pasien) dengan episode AF ilustratif; label "Ilustrasi sinyal PPG" wajib tetap ada.
- Gelombang PPG normal/AF dibuat deterministik oleh `PulseWaveform.ts` (seed), jadi server dan client menghasilkan bentuk yang sama.
- Komponen section tetap Server Component; logika client ada di hook `src/components/landing/hooks` (`UseScrollThread`, `UseLivePulse`, `UseInView`, `UseReducedMotion`).
- Footer gelap memuat kepanjangan SiHEDAF dan disclaimer bahwa SiHEDAF bukan pengganti diagnosis dokter.
- Setiap section dipisahkan ke komponen PascalCase di `src/components/sections`; elemen visual landing ada di `src/components/landing`.

### Halaman sistem dan metadata

- `app/not-found.tsx` (404 "Sinyal hilang") dan `app/error.tsx` (memakai `unstable_retry` dari Next 16) memakai visual `SignalLost`: garis PPG yang terputus lalu tersambung lagi.
- `app/(dashboard)/loading.tsx`, gerbang sesi di `ProfileProvider`, dan skeleton profil memakai `PulseLoader` (sinyal pendek berjalan di atas garis PPG, `role="status"`).
- Tidak ada `alert()` bawaan browser; error memakai toast (`sonner`) yang ditema dengan token `primary`, `af`, dan `warn`.
- Metadata root berisi deskripsi, Open Graph (`locale: "id_ID"`), dan Twitter `summary_large_image`; `app/opengraph-image.tsx` membuat gambar pratinjau 1200×630 dengan garis PPG normal → AF, dan `app/icon.svg` adalah favicon line-art.
- Set `SIHEDAF_SITE_URL` (server-only, lihat `.env.example`) di production agar URL gambar pratinjau absolut; tanpa itu Next memakai `localhost` dan memberi peringatan saat build.

### Tim Kami

- Route `/tim-kami` dengan shared header/footer.
- Sepuluh team cards: empat anggota dengan foto dan LinkedIn, ditambah enam kartu placeholder ("Nama Anggota 5–10", tanpa foto dan tanpa tautan LinkedIn) yang menunggu data asli. Grid 1/2/4/5 kolom (`xl:grid-cols-5`); kunci daftar memakai nama, bukan peran, supaya peran yang sama tidak bentrok.
- Foto anggota selain data yang tersedia masih menggunakan tampilan placeholder.

### Authentication dan perangkat

- Route `/login`, `/register`, dan `/hubungkan-perangkat`.
- Split-screen auth layout di atas latar `paper`, dengan header (logo + tautan Beranda) dan footer berisi disclaimer.
- `AuthVisualPanel` menampilkan judul kontras tebal–tipis, `AuthJourney` (peta langkah Daftar → Masuk → Hubungkan perangkat → Dashboard dengan `aria-current="step"`), lalu ilustrasi: line-art yang menggambar diri (`autodraw`) atau foto jam untuk langkah perangkat. Di mobile journey menjadi progress bar ringkas.
- Visual panel auth memakai vertical flex flow; copy, journey, dan ilustrasi tidak boleh kembali menggunakan absolute offsets yang dapat saling overlap.
- `AuthInput`: label 15px, teks input 16px (mencegah zoom iOS), error dengan ikon + `role="alert"`, opsi `mono` dan `hint` untuk Device ID. Tombol utama memakai `btn-primary` navy; state disabled tetap terbaca.
- Active/inactive form state, validasi kelengkapan sederhana, dan toggle password.
- Login (`POST /api/v1/auth/login`) meneruskan ke backend, menyimpan access/refresh token di cookie httpOnly, lalu mengarahkan ke `/dashboard` bila perangkat sudah terikat (`hasDeviceBound`) atau ke `/hubungkan-perangkat`.
- Register mengarahkan pengguna kembali ke login.
- Form perangkat mengikat Device ID lewat `POST /api/v1/measurement/bind` (divalidasi backend) lalu mengarahkan ke `/dashboard`.
- Autentikasi, sesi, dan pengikatan perangkat memakai backend lewat route proxy `src/app/api/v1/auth/*` dan `measurement/bind`; logout (`POST /api/v1/auth/logout`) menghapus cookie sesi.

### Dashboard

- Shared route-group layout untuk `/dashboard`, `/riwayat`, `/profil`, dan `/profil/ubah`.
- Sidebar desktop dapat diciutkan dari `210px` menjadi icon rail `72px`.
- Pada mobile, sidebar berubah menjadi off-canvas drawer dengan backdrop.
- Active navigation mengikuti pathname dan state sidebar tetap hidup selama navigasi child route.
- Tombol topbar memakai ikon panel open/close; tidak ada decorative icon ganda di samping judul.
- Notification rail full-height dapat ditutup melalui `PanelRightClose`, lalu dibuka kembali melalui tombol floating `PanelRightOpen` di sisi kanan content dengan transisi width/opacity.
- Ikon notifikasi ditentukan hanya oleh `type` (`NotificationKind.ts`, `notificationKind`): `AF_DETECTED` → StatusMark AF berlabel "Peringatan AF atau AFL"; `SYSTEM_INFO` dan lainnya → ikon info netral ("Informasi"), karena backend memberi judul "Medical Alert!" untuk AF maupun AFL dan mengirim "Pengukuran Selesai" juga saat AI gagal. Jangan memutuskan dari teks judul; judul dan pesan tetap tampil apa adanya.
- Alur monitoring (fase `idle → recording → analysing → result | timeout`) dikelola `hooks/UseMonitoringSession.ts` (state, polling, timer) dengan helper murni di `MonitoringSession.ts` (`formatElapsed`, `recordingClock`, `isFreshResult`, `rememberResult`, `rememberInitial`, `rememberSession`, `runningSessionFrom`, `pollForFreshResult`, `restartAction`, `toggleBlock`, `toggleAnswer`, `afterToggleTimeout`, `afterStopRefused`, `afterAnalysisTimeout`, `showsAutoFinishNote`, `toLocalTime`, `clockOffset`, `newestHistoryRow`, `recentSessionEndAge`, `isTimeoutError`, `analysisStatusLabel`, `sessionStartFrom`, `requestSignal`, `waitFor`, `MAX_RECORDING_MS`, `AUTO_FINISH_NOTE_MIN_MS`, `RECORDING_WATCH_INTERVAL_MS`, `OVERTIME_HINT_AFTER_MS`, `POLL_INTERVAL_MS`, `POLL_MAX_ATTEMPTS`, `REQUEST_TIMEOUT_MS`, `TOGGLE_TIMEOUT_MS`); `useDashboardOverview` hanya menyusunnya. Rentang 3/6/12/30 menit hanya jendela grafik.
- Wristband merekam paling lama 3 menit (`MAX_RECORDING_MS`), lalu server menyelesaikan sesi dan menjalankan AI sendiri. Saat `recording`, kartu sinyal menampilkan "Merekam · 01:12 / 03:00" (`recordingClock`, jam dinding) dan pengingat agar wristband tetap terpasang; mulai 03:00 jam diganti "Menunggu hasil dari wristband…", dan bila lewat 30 dtk lagi tanpa hasil (`stalled`) muncul "Belum ada hasil dari wristband. Tekan Hentikan Monitoring untuk menyelesaikan rekaman." (bukan live region; dirujuk tombol Hentikan lewat `aria-describedby`). Hanya kata fase ("Merekam" / "Menunggu hasil dari wristband…" / "Menganalisis rekaman…" / "Monitoring dijeda") yang `aria-live="polite"`; elemen `role="timer"` berada di luarnya dengan `aria-live="off"` agar tidak dibacakan tiap detik. Karena `/signals` hanya berisi rekaman yang sudah selesai, baris di bawahnya saat `recording` berbunyi "Grafik menampilkan rekaman yang sudah selesai; rekaman ini tampil setelah selesai." dan grafik tetap statis (tanpa sweep atau animasi gambar); fase lain tidak berubah ("Pembaruan dihentikan sementara").
- Selama `recording` (tanpa start/stop yang sedang berjalan) `/latest` diperiksa tiap 5 dtk (`RECORDING_WATCH_INTERVAL_MS`) dengan aturan `isFreshResult` yang sama; hasil baru mengakhiri rekaman dan modal terbuka di tampilan hasil. Catatan "Rekaman selesai otomatis setelah 3 menit." hanya muncul bila sesi itu berjalan minimal `AUTO_FINISH_NOTE_MIN_MS` (03:00 − 10 dtk) saat selesai (`showsAutoFinishNote`: `requestedAt ?? createdAt` → `completedAt` baris itu, satu jam backend; tanpa keduanya jam perekaman halaman ini); hasil yang selesai lebih cepat (mis. dihentikan dari tab lain) tampil tanpa catatan itu. Hentikan langsung membatalkan pengawasan ini sehingga hanya ada satu loop.
- Saat dimuat, `GET /measurement/history?page=1&limit=1` dibaca: bila baris terbaru IN_PROGRESS (`runningSessionFrom`), fase kembali `recording` dengan waktu mulai `requestedAt ?? createdAt` dan `id` sesi itu sebagai hasil yang ditunggu (`rememberSession`), kecuali pengguna sudah bertindak. Waktu mulai itu (jam backend) dipindah ke jam HP/laptop dengan selisih header `Date` jawaban history (dari route proxy Next) terhadap jam lokal (`toLocalTime`), jadi jam perekaman tetap benar walau jam perangkat pembaca salah; tanpa header, jam lokal dipakai apa adanya. Bila baris terbaru COMPLETED dan selesai kurang dari 8 dtk lalu, penahanan wristband setelah sesi dipulihkan (lihat bullet Wristband di bagian Sesi dan keadaan error). `/latest` backend hanya mengembalikan baris COMPLETED.
- Jawaban start/stop dibaca `toggleAnswer`: 2xx dengan `code` 200 → berhasil; 5xx/502 → toast kesalahan umum, status sesi tidak berubah; 4xx (ditolak). Start ditolak → toast tetap "Wristband belum siap untuk merekam. Pastikan wristband menyala, terhubung ke internet, dan tidak sedang merekam, lalu coba lagi."; stop ditolak (biasanya wristband sudah selesai sendiri) → `/latest` dibaca sekali (`afterStopRefused`): hasil baru tampil, dengan catatan selesai otomatis hanya bila `showsAutoFinishNote` mengizinkan, selain itu `idle` + toast tetap. Teks server tidak pernah ditampilkan.
- Saat Hentikan ditekan (`analysing`), modal hasil terbuka dan `pollForFreshResult` meminta `/latest` segera lalu setiap 3 dtk, maksimal 20 permintaan (gagal, non-200, atau timeout tetap dihitung). Setiap permintaan poll dibatasi 10 dtk dan start/stop 30 dtk (`requestSignal`). Bila start/stop habis waktu (bukan karena unmount), keadaannya dibaca dulu lalu diadopsi (`afterToggleTimeout`): setelah start, baris history terbaru dibaca lebih dulu dan sesi IN_PROGRESS di sana → `recording` (waktu dari `requestedAt`); bila tidak ada, `/latest` dibaca sekali: IN_PROGRESS → tetap/kembali `recording` (waktu dari `sessionStartFrom`); selain itu stop lanjut ke polling `analysing` dan start kembali ke `idle`. Bila polling `analysing` habis tanpa hasil, baris history terbaru dibaca sekali (`afterAnalysisTimeout`): masih IN_PROGRESS → stop ternyata tidak sampai, modal ditutup, fase kembali `recording` (aturan resume yang sama) dengan toast kesalahan tetap; selain itu tampilan timeout. Toast kesalahan yang sama hanya muncul bila aksi ternyata tidak terjadi atau pembacaan gagal. Hasil dianggap baru (`isFreshResult`) bila final (jenis COMPLETED apa pun dari `classifyResult`: normal, af, flutter, short, unavailable; `pending` tidak pernah), `id`-nya berbeda dari hasil sebelumnya, bukan pengulangan timestamp (`completedAt ?? createdAt`) hasil tanpa `id`, dan — untuk sesi IN_PROGRESS yang dilanjutkan setelah reload selama `id` hasil sebelumnya belum diketahui — `id`-nya sama dengan baris itu atau `createdAt`-nya tidak lebih awal dari sesi tersebut (`rememberResult` menyimpan dasar pembandingnya). Jika tidak baru, `latestData` tidak diubah.
- Polling dibatalkan saat sesi baru dimulai dan saat unmount: satu `AbortController` per putaran polling dan satu per mount (dibuat di body effect, di-abort di cleanup; aman untuk StrictMode), sehingga tidak ada request, polling baru, atau setState setelah unmount — juga bila respons stop baru tiba setelah pengguna pindah halaman. Menutup modal tidak menghentikan polling (hasil tetap masuk ke dashboard tanpa membuka ulang modal). `/latest` awal yang lambat tetap mengisi dasar pembanding hasil baru bila masih kosong (`rememberInitial`), tetapi fase dan `latestData`-nya diabaikan bila pengguna sudah memulai/menghentikan sesi.
- `AiResultModal` punya state tampilan sendiri (`analysing | result | timeout`) dan memberi `DashboardModal` prop `contentKey={view}`: kunci itu hanya dipasang pada `<section>` dialog, sehingga tiap tampilan menjadi elemen dialog baru (fokus pindah ke dialog dan judul baru dibacakan, tanpa animasi masuk ulang) sementara backdrop tetap dan fokus saat ditutup kembali ke elemen pembuka awal. "Detail Hasil AI" membuka hasil `latestData` saat ini, kecuali selama fase `analysing`: tombol itu menampilkan tampilan "Menganalisis rekaman" (perilaku yang disengaja).
- Tampilan hasil modal memuat `PpgTrace` dengan tick waktu serta fakta Waktu, Durasi rekaman, Keyakinan AI, dan Status analisis (grid dua kolom mulai `sm`). Aksi modal: AF/AFL → "Buat laporan dokter", "Lihat Riwayat", "Mulai monitoring lagi", "Tutup"; normal → "Tutup", "Lihat Riwayat", "Mulai monitoring lagi"; short/unavailable → "Mulai monitoring lagi", "Lihat Riwayat", "Tutup"; pending → "Lihat Riwayat" + "Tutup"; menganalisis → "Tutup"; timeout → "Buka Riwayat" + "Tutup". Aksi berada di grid (satu kolom di ponsel, dua kolom mulai `sm`; bila jumlahnya ganjil aksi utama selebar dua kolom), tinggi 48px, label satu baris; jangan memakai `flex-1` di kontainer kolom.
- "Mulai monitoring lagi" hanya ditampilkan setelah sesi berakhir (fase `idle`, `result`, atau `timeout`; `restartAction`), tidak pernah saat `recording`/`analysing`. Tombol tetap tampil tetapi dinonaktifkan (teks `text-primary-900/70`, bukan opacity) saat aksi start/stop sedang berjalan atau status perangkat masih dimuat, dan dengan petunjuk di bawah aksi saat tidak ada koneksi ("Tidak ada koneksi internet."), saat status perangkat gagal dimuat (`device-unknown`: "Status perangkat belum bisa dimuat."), atau saat perangkat offline/belum ada ("Perangkat belum terhubung."). Urutan `restartAction`: hidden → no-network → loading (busy) → device-unknown → offline/none → busy/ready (`stale` dihitung siap: backend yang memutuskan).
- Fase `timeout`: modal "Hasil belum tersedia", dan selama fase ini kartu sinyal menampilkan catatan "Hasil sesi terakhir belum tersedia. Cek Riwayat beberapa saat lagi." dengan tautan "Buka Riwayat" (tetap terlihat setelah modal ditutup).
- Dashboard utama berisi hasil analisis terakhir, grafik PPG, monitoring terakhir, status wearable, dan notification rail.
- Profile pill pada topbar mengarahkan pengguna langsung ke `/profil`.
- Riwayat analisis memiliki calendar range picker bertema SiHEDAF, filter tanggal ke API, pagination aktif, dan pilihan 5/10/20 item per halaman. Kartu ringkasan (Total / Terdeteksi AF / Ritme Normal) apa adanya dari `summary` backend yang mencakup seluruh waktu, jadi blok itu berjudul "Ringkasan sepanjang waktu" dan, saat rentang tanggal dipilih, diberi catatan "Ringkasan mencakup seluruh riwayat, bukan hanya rentang tanggal yang dipilih.". Sub-baris hasil normal: "Tidak ditemukan pola AF atau AFL". Dua catatan penjelas berasal dari `HistoryNotes.ts` (fungsi murni, diuji): (1) saat rentang tanggal dipilih dan offset UTC pembaca pada tanggal awal rentang (`-from.getTimezoneOffset()`) bukan 0, catatan di bawah pemilih tanggal menjelaskan bahwa filter memakai hari UTC, mis. WIB "pukul 07.00 sampai 06.59 keesokan harinya (waktu setempat)"; barat UTC "… hari sebelumnya …"; jam dihitung dari aritmetika offset (`HH.mm`, termasuk offset setengah/seperempat jam), bukan `Intl`; offset 0 tanpa catatan; (2) di bawah kartu ringkasan selalu tampil "Angka ringkasan dihitung server: Ritme Normal juga mencakup rekaman yang terlalu singkat atau tanpa hasil AI, dan Terdeteksi AF belum mencakup AFL. …" (`SUMMARY_COMPUTED_NOTE`).
- Profil memiliki modal ubah kata sandi dengan validasi dan modal konfirmasi logout; logout memanggil `POST /api/v1/auth/logout` (menghapus cookie sesi) lalu mengarahkan pengguna ke `/login`.
- Edit profil memiliki field nama terkontrol (validasi `UpdateProfileRequestSchema`), Device ID disabled, cancel navigation, modal konfirmasi, serta toast sukses setelah penyimpanan. Nama disimpan lewat `PUT /api/v1/auth/me/update` (`useUpdateProfile` → `ProfileClient`); foto profil hanya ditampilkan dari `profileImage` dan belum bisa diganti (formulir menyatakannya).
- Primitive `DashboardModal.tsx` dipakai bersama untuk dialog akun dan hasil aksi; modal dapat ditutup melalui backdrop, tombol close, atau tombol Escape.
- Detail riwayat: baris riwayat dapat diklik dan punya tombol aksesibel "Lihat detail analisis …". `HistoryDetailModal` memakai `DashboardModal size="wide"` berisi `PpgTrace` dengan tick waktu (label "Grafik sinyal PPG, irama normal / terdeteksi AF / terdeteksi AFL / belum ada hasil") dan fakta Waktu, Durasi rekaman, Keyakinan AI, serta Device ID (`device.deviceNumber`, ID yang dipasangkan pengguna; "—" bila tidak ada, tidak pernah UUID internal `deviceId`). Untuk hasil AF/AFL tersedia tautan "Buat laporan dokter" ke jendela 30 hari yang berakhir pada `completedAt ?? requestedAt` item tersebut (laporan memfilter `completedAt`).
- Laporan dokter: route `/riwayat/laporan?from=YYYY-MM-DD&to=YYYY-MM-DD` (hari Asia/Jakarta; parameter tidak valid atau kosong kembali ke 30 hari terakhir). Logika murni ada di `ReportRange.ts` dan `ReportData.ts` (`collectReport`: halaman berisi 50 data hingga 10 halaman; karena backend memfilter `completedAt` per hari UTC, query dimulai sehari lebih awal (`startDate = from − 1`, `endDate = to`) lalu hanya item COMPLETED yang hari Jakarta `completedAt`-nya di dalam periode yang dipakai; ringkasan periode — total, AF, AFL, normal, tanpa hasil (short + unavailable) — dihitung sendiri dari item itu, tidak pernah dari `summary` API; daftar AF/AFL terbaru lebih dulu menurut `completedAt ?? requestedAt`, waktu yang sama dengan kolom Waktu tabel; catatan `truncated` bila terpotong ("… dari {scanned} rekaman terbaru pada periode ini.", karena history urut terbaru lebih dulu), dan angka ringkasan saat itu hanya mencakup rekaman yang terbaca). Hook `UseDoctorReport.ts` menjaga respons usang (stale-response guard) dan memakai `router.replace`; tampilan di `DoctorReportView.tsx`. Tombol "Cetak / Simpan PDF" memanggil `window.print()`. CSS cetak: `@page` A4 margin 14mm, `print:hidden` pada chrome shell, `.print-avoid-break`, dan `print-color-adjust: exact`. Ringkasan menampilkan "Total rekaman", "AF terdeteksi", "AFL terdeteksi", "Ritme normal", dan "Tanpa hasil" (hanya bila > 0); bar proporsi `splitShares([normal, af + flutter], total)`. Tabel kejadian berkolom No, Jenis ("AF" / "AFL"), Waktu (`completedAt ?? requestedAt`), Durasi, Keyakinan AI, dan Grafik (tick waktu), di dalam `ScrollArea` horizontal di ponsel (`min-w-[640px]`, `print:min-w-0`). "Tidak ada AF atau AFL terdeteksi pada periode ini." hanya tampil bila AF + AFL = 0 dan tidak terpotong. Catatan kaki: "… bukan diagnosis … Durasi dan skala waktu grafik dihitung dari laju sampel 50 Hz."
- Panduan pertama kali: `FirstRun.ts` (`firstRunSteps`) dan `FirstRunGuide.tsx` tampil saat `showFirstRun = hasLoadedLatest && !isDeviceLoading && !latestData && !latestError && resumeChecked`, berisi tiga langkah dengan tautan anchor `#monitor`; langkah monitoring dianggap berjalan selama fase `recording` atau `analysing`.
- `classifyResult` (`ResultKind.ts`) adalah satu-satunya sumber arti hasil untuk ringkasan, modal hasil, tabel dan detail riwayat, laporan, dan `isFreshResult`. Urutan aturan: `status` ada dan bukan COMPLETED → `pending`; label "Not Enough Data" → `short`; `resultClass` 1 → `af`, 2 → `flutter`, 0 → `normal` bila keyakinan > 0; tanpa keyakinan → `short` bila `ppgResult.rawPpgData` kurang dari 150 sampel (`MIN_ANALYSABLE_SAMPLES`, 3 dtk pada 50 Hz) atau tidak ada (backend menulis "Not Enough Data" hanya untuk 1–149 sampel; dengan 0 sampel baris tetap "Normal (N)" kelas 0 keyakinan 0 dan AI tidak dipanggil), selain itu `unavailable` (AI gagal disimpan backend sebagai "Normal (N)" keyakinan 0); tanpa `resultClass` label menjadi cadangan ("normal" harus kata utuh, `/\bnormal\b/`, dengan aturan sampel yang sama). Semua pemanggil memberikan seluruh baris (history dan `/latest` membawa `ppgResult`). Jenis alert (`isAlertKind`: af, flutter) memakai StatusMark AF, catatan AF di ringkasan, tautan laporan dokter, dan "bukan diagnosis"; jenis netral (short, unavailable, pending) tanpa StatusMark dan berwarna netral. Teks per jenis ada di `RESULT_COPY` (label/title/sentence), mis. "Terdeteksi AFL" / "Terdeteksi Potensi Atrial Flutter", "Rekaman terlalu singkat", "Hasil AI tidak tersedia". Judul ringkasan: normal "Irama terakhirmu normal.", af/flutter "Irama terakhirmu tidak teratur.", short/unavailable "Rekaman terakhir belum bisa dianalisis.". UI tidak boleh membaca teks label sendiri. `StatusMark` menerima `label` (berikan `RESULT_COPY[kind].label`) agar AFL dibacakan sebagai AFL; tampilannya tetap "af". `splitShares` (largest remainder, dengan basis `max(total, jumlah bagian)`) menjaga persentase Normal/AF selalu berjumlah 100.
- `tracePath` bersama di `DashboardFormat.ts` dipakai oleh `Sparkline`, `SignalChart`, dan `PpgTrace`.
- Semua dialog dashboard (`DashboardModal`) dirender lewat portal ke `document.body` agar overlay menutupi seluruh layar dan tidak terpotong ancestor ber-`transform` (`.dashboard-enter`).
- Item sidebar Riwayat aktif untuk semua route `/riwayat/*`.
- Tampilan dashboard memakai bahasa visual landing, tetapi latarnya putih (`bg-white`, bukan `paper`; keputusan 9 November 2026): halaman, sidebar, rail notifikasi, header, dan layar gerbang sesi `ProfileProvider` semuanya putih. Kartu tetap putih dan dipisahkan oleh border 1px `primary-900/15` (bukan `/10`); pemisah di dalam kartu (baris tabel, `divide-*`) tetap lebih tipis. Menu aktif sidebar memakai `bg-primary-50` (pil putih akan hilang di latar putih), dan bayangan drawer mobile hanya dipasang saat drawer terbuka. `paper` dipertahankan untuk landing, auth, dan permukaan pembeda di dalam kartu (kotak "Contoh teks", catatan laporan, input nonaktif, hover baris). Sidebar berupa rel dengan "stasiun" (halaman aktif = lingkaran navy terisi), ringkasan dibuka dengan kalimat status besar ("Irama terakhirmu normal/tidak teratur.") plus saran konsultasi dokter saat AF, grafik PPG bergaya monitor yang statis (hanya rekaman selesai, tanpa sweep), notifikasi sebagai timeline per hari, dan riwayat dengan angka besar + bar proporsi Normal/AF.
- Format data lewat `DashboardFormat.ts` (`formatConfidence`, `formatWib`, `shareOf`, `splitShares`, `tracePath`); fungsi ini mengembalikan `null` alih-alih mengarang nilai, jadi UI menampilkan "—" bila API tidak mengirim data (tidak ada lagi fallback keyakinan 95%, baterai 92%, atau ID perangkat `PPG001`).
- `UseMyDevice.ts` adalah satu-satunya sumber data perangkat (`/api/v1/measurement/my-device`) untuk ringkasan, profil, edit profil, dan laporan. `reload()` memeriksa ulang tanpa kembali ke `isLoading`; `isRefreshing` bernilai true sejak tombol ditekan sampai jawabannya tiba. Di `/dashboard` hook ini dipanggil dengan `refreshMs: DEVICE_REFRESH_MS` (30 dtk): pemeriksaan latar tanpa loader, satu `AbortController` per jalannya effect (reload, reconnect, unmount membatalkan request lama; tiap request 10 dtk), dijeda saat browser offline. `checkedAt` adalah waktu jawaban menurut header `Date` yang dipasang route proxy Next (jam server frontend, bukan backend; `answeredAt`), jadi jam HP/laptop yang salah tidak membuat wristband tampak tidak stabil. `requestedAt` adalah kapan request di balik jawaban (atau error) saat ini dikirim, memakai `performance.now()` (jam monoton halaman, bukan jam dinding).
- Durasi dari jumlah sampel: wristband merekam PPG 50 Hz (`Signal.ts`: `SAMPLE_RATE_HZ`, `recordingDurationMs`, `formatDuration` → "45 dtk", "2 mnt 58 dtk", "3 mnt", dibulatkan ke bawah; di bawah 1 dtk "kurang dari 1 dtk"; `recordingDuration(data)`; `traceTicks`). Detik boleh ditampilkan karena laju sampelnya diketahui; tetap tanpa BPM dan tanpa deteksi puncak. `PpgTrace` menerima `sampleRate` opsional dan menampilkan tiga tick `aria-hidden` (awal "0 dtk", tengah, akhir) bila data ≥ 2 titik; dipakai di detail riwayat, modal hasil, dan laporan. `SignalChart` tetap memakai label menit karena datanya gabungan beberapa sesi.
- Komponen dashboard hanya memakai token warna (tanpa hex mentah), teks minimal 13px (`0.8125rem`), dan teks navy minimal 70% opacity; ini dijaga oleh `DashboardRedesign.test.mjs`.
- Page entry, sidebar, notification rail, staggered rows, dan tombol menggunakan motion ringan. Grafik PPG dashboard tidak beranimasi (tanpa gambar-ulang atau sweep) karena hanya menampilkan rekaman selesai; CSS `.signal-draw` dan `.monitor-sweep` sudah dihapus.
- Card dan information surface statis tidak memakai hover-lift agar tidak memberi affordance klik palsu; motion hover hanya dipakai pada kontrol yang benar-benar interaktif.
- Rekaman tanpa hasil AI (`pending`), terlalu singkat (`short`), atau tanpa hasil AI karena layanan gagal (`unavailable`) tampil netral tanpa StatusMark dan tidak pernah dianggap normal. `DashboardModal` memindahkan fokus ke dialog saat dibuka dan mengembalikannya ke elemen pembuka saat ditutup.

### Ukuran teks

- Ukuran teks ditulis dalam rem (`text-[0.9375rem]` = 15px pada ukuran default), tidak pernah `text-[Npx]`, agar mengikuti pengaturan huruf HP/browser. `TextScale.test.mjs` melarang `text-[Npx]` di `src/**/*.tsx` (kecuali `app/opengraph-image.tsx`) dan `font-size` px di `globals.css`. Ukuran tata letak (`h-[72px]`, `max-w-[…px]`) tetap px.
- Pilihan "Normal / Besar / Sangat besar" ada di Profil, bagian "Tampilan" (`TextSizeSetting.tsx`): radio asli bergaya pil minimal 48px, langsung berlaku tanpa tombol simpan, dengan contoh netral "Contoh teks: Hasil pemantauan dan riwayatmu akan tampil dengan ukuran ini." (jangan memakai kalimat hasil kesehatan sebagai contoh).
- `src/components/ui/TextSize.ts`: `TextSize`, `TEXT_SIZES`, `TEXT_SIZE_LABEL`, `TEXT_SIZE_STORAGE_KEY` (`"sihedaf:text-size"`), `TEXT_SIZE_EVENT`, `parseTextSize` (nilai tak dikenal → `normal`), dan `textSizeScript()`. Persentasenya (112,5% dan 125%) hanya ada di CSS `html[data-text-size=…]` di `globals.css`; tidak ada konstanta `TEXT_SIZE_SCALE`.
- `textSizeScript()` disisipkan di `<head>` root layout: membaca localStorage di dalam `try/catch` dan memasang `data-text-size` sebelum halaman tampil (tanpa kedipan), lalu mendengarkan event `storage` sehingga semua tab yang terbuka ikut berubah, juga di halaman tanpa pengaturan. `<html>` memakai `suppressHydrationWarning` dan tag `<html lang="id" …>` tetap satu baris (dijaga test).
- `src/components/ui/hooks/UseTextSize.ts` (`useSyncExternalStore`, atribut `<html>` sebagai sumber): `setSize` menyimpan ke localStorage, memperbarui atribut, dan memberi tahu pelanggan lewat `TEXT_SIZE_EVENT`; tanpa localStorage (mode privat) pilihan tetap berlaku sampai halaman ditutup.

### Aplikasi terpasang

- `src/app/manifest.ts` (`start_url: "/dashboard"`, `display: "standalone"`, warna `#f5f3ee`, ikon 192/512 `any` dan 512 `maskable`); root layout memasang `applicationName`, `appleWebApp`, dan `viewport.themeColor`. `proxy.ts` tidak menghalangi manifest dan ikon.
- `InstallGuide.tsx` di Profil memberi petunjuk Safari iOS dan Chrome Android, dan disembunyikan saat aplikasi sudah berjalan standalone (`UseIsStandalone.ts`; snapshot server `null`, jadi kartu tidak dirender di server). Tidak ada tombol instal kustom (`beforeinstallprompt`).
- Tidak ada service worker, cache offline, atau push, supaya data kesehatan tidak tampil basi. Pemasangan butuh HTTPS (production).

### Sesi dan keadaan error

- Sembilan route measurement dan notification memakai `proxyBackend(path, init, options)` (`src/features/auth/session/server/ProxyBackend.ts`) yang membungkus `withSessionRefresh`: 401 atau 403 dari backend (middleware backend menjawab token kedaluwarsa/tidak valid dengan 403) → refresh token → dicoba ulang sekali; `ProfileService` memperlakukan 403 dengan cara yang sama; respons lain diteruskan apa adanya (body JSON dan status backend); body bukan JSON atau error jaringan → `502 "Layanan SiHEDAF sedang bermasalah."`; kegagalan refresh apa pun (termasuk 5xx) atau tanpa token → `401 "Sesi berakhir."`. Timeout diatur per panggilan lewat `timeoutMs` (bind: 10 dtk); tanpa itu tidak ada timeout di server.
- `measurement/bind` menjawab 401 dengan `SESSION_EXPIRED` dari `SessionServiceError.ts` (tampil di bawah field Device ID). `notification/[id]/read` menolak id selain angka (`/^\d+$/`) dengan `400 "Notifikasi tidak ditemukan."` sebelum menghubungi backend.
- Semua fetch dashboard dan profil memakai `apiFetch` (`src/features/auth/session/client/ApiFetch.ts`; `createApiFetch({ fetcher, redirect })`), kecuali `logoutAccount` yang tetap memakai `fetch` biasa (401 di sana berarti sesi memang sudah berakhir): status 401 → memanggil `redirectToSessionExpired` lalu melempar `SessionExpiredError` (pemanggil tidak menampilkan error). Pengalihan itu satu-satunya jalur otomatis sisi client ke `SESSION_EXPIRED_PATH` (`/login?sesi=berakhir`, didefinisikan di `SessionExpiredRedirect.ts`; `createSessionExpiredRedirect({ navigate, currentPath, onPageShow })` bisa disuntik untuk test): paling banyak satu kali per umur halaman, tidak melakukan apa pun bila pathname sudah `/login`, dan penjaganya direset oleh `pageshow` dengan `persisted === true` (pemulihan bfcache). `ProfileClient` (`fetchCurrentProfile`, `updateProfile`, `updatePassword`) memakai `apiFetch` secara bawaan; `SessionExpiredError` menjadi `{ success: false, status: 401 }` dan kesalahan lain membawa `cause`. Pada 401 `ProfileView` dan `EditProfileView` tidak menampilkan apa pun (tanpa `router.replace`, error, atau toast; `EditProfileView` menutup modal konfirmasinya lebih dulu; hook ubah profil/kata sandi juga tidak mengisi error inline). `ProfileProvider` pada 401 melepas loader "Memverifikasi sesi..." dan menampilkan catatan `role="status"` "Sesimu sudah berakhir. Mengalihkan ke halaman masuk…" dengan tautan "Masuk lagi" (tinggi minimal 48px) ke `SESSION_EXPIRED_PATH`, tanpa panel error dan tanpa pengalihan kedua, supaya pembaca tidak tertahan di loader bila pengalihan terhenti (mis. pemuatan dihentikan, atau penjaga satu kali sudah terpakai); tautan itu hanya diklik pengguna. Ketiganya memberi `describeCaughtError(result.cause, result.status)` untuk kegagalan lain, jadi koneksi putus terbaca "Koneksi internet terputus". Layout `(dashboard)` memeriksa sesi hanya-baca lewat `readLayoutProfile` (`session/server/ReadLayoutProfile.ts`; Server Component tidak boleh menulis cookie, jadi `withSessionRefresh` tidak dipakai di sana): access token → `getCurrentProfile`, hasilnya pengguna awal atau `null` untuk error apa pun; hanya refresh token → `null` tanpa panggilan backend; keduanya `null` lalu `ProfileProvider` memanggil `/api/v1/auth/me` (route handler boleh me-refresh dan menulis cookie); tanpa cookie sama sekali layout memanggil `redirect(SESSION_EXPIRED_PATH)` di luar try/catch (jalur sisi server). fetch yang tidak mendapat jawaban → `NetworkError` (abort dan timeout diteruskan apa adanya untuk `isTimeoutError`). `/login` membaca `?sesi=berakhir` di client (`SessionExpiredNotice` di dalam `<Suspense>`) dan menampilkan "Sesimu sudah berakhir. Silakan masuk lagi untuk melanjutkan." (`role="status"`).
- `describeFetchError` / `describeCaughtError` (`src/components/ui/FetchError.ts`) memberi judul dan pesan Indonesia tanpa teks error mentah: offline bila browser offline atau `NetworkError` ("Koneksi internet terputus"); 401 atau `SessionExpiredError` → sesi (tidak ditampilkan karena sedang dialihkan); selain itu, termasuk `TypeError` biasa → "Server SiHEDAF sedang bermasalah" / "Ini bukan masalah di HP atau laptopmu. Coba lagi beberapa saat lagi." (jangan menyebut "perangkat" untuk HP/laptop; "perangkat" berarti wristband).
- `DataErrorState.tsx` (`title`, `message`, `onRetry`, `retrying`, `compact`, `live`): garis sinyal terputus (`BrokenSignal`), tombol "Coba lagi" 48px. `live` ("alert" bawaan, atau "status") menjadi `role` panel: ringkasan (hasil terakhir), riwayat, laporan dokter, dan `ProfileProvider` tetap `alert`; panel sekunder `NotificationPanel`, `DeviceOfflineCard`, dan panel grafik di kartu sinyal memakai `live="status"`. Saat `retrying` (diberikan oleh kartu wristband dan panel grafik; panel lain langsung hilang, diganti keadaan memuat, begitu "Coba lagi" ditekan) tombol memakai `aria-disabled` (bukan `disabled`) agar fokus tetap di tombol, klik diabaikan, `aria-busy`, berlabel "Memuat ulang…", dengan tampilan nonaktif yang sama. Bila panel dilepas ketika fokus ada di dalamnya (retry membuat keadaan memuat atau konten menggantikannya), cleanup `useLayoutEffect` mencatat rantai leluhur panel (`focusChain` di `FocusHandOff.ts`: dari induk ke atas sampai dan termasuk `main`, `[role="dialog"]`, atau `body` terdekat), lalu di `requestAnimationFrame` `headingToFocus` memilih heading `h1`–`h4` pertama dari elemen rantai pertama yang masih terpasang dan memuat heading; heading itu difokuskan (`tabindex="-1"` ditambahkan bila belum ada, `preventScroll`). Itu hanya terjadi bila fokus memang jatuh (`document.activeElement` null atau `body`): bila elemen lain sudah mengambil fokus (mis. dialog hasil yang baru terbuka), fokus dibiarkan; tanpa heading tidak ada yang dilakukan. Tujuannya per pemakai: hasil terakhir dan kartu wristband → `h1` ringkasan; panel grafik → "Sinyal PPG Terbaru"; riwayat → "Daftar Riwayat"; notifikasi → "Notifikasi"; laporan dokter → judul laporan; gerbang `ProfileProvider` → tidak ada (loader-nya tanpa heading). Dipakai di ringkasan, grafik sinyal, riwayat, laporan dokter, notifikasi, `ProfileProvider`, dan kartu wristband.
- `HttpError` (`constructor(readonly status?: number)`) hanya didefinisikan di `src/components/ui/FetchError.ts` dan dipakai bersama oleh notifikasi, ringkasan, riwayat, dan laporan; test melarang salinan lain.
- `latestOutcome({ status, json })` di `FetchError.ts` membaca `/latest`: `data`, `empty` (404 atau 200 dengan `data: null`), atau `error` (semua jawaban lain, termasuk 200 dengan `code` ≠ 200). Hanya `empty` yang boleh memunculkan panduan pertama kali; `error` menampilkan "Hasil terakhir belum bisa dimuat." dengan `DataErrorState`.
- `/signals` gagal (jawaban non-200 → `HttpError`, error lain apa adanya; `describeCaughtError`): `useDashboardOverview` menyimpan `signalsError` dari pembacaan terakhir dan menyediakan `reloadSignals()` serta `isSignalsRetrying`. Selama `signalsError` ada, area grafik di kartu sinyal menampilkan `DataErrorState` `compact` `live="status"` berjudul "Grafik belum bisa dimuat" dengan pesan dari `describeCaughtError` dan "Coba lagi" (`onRetry={reloadSignals}`, `retrying={isSignalsRetrying}`, jadi panel tetap tampil sampai jawabannya), menggantikan grafik dan kalimat "Belum ada sinyal pada rentang ini."; pembacaan berikutnya yang berhasil menghapusnya. Pembacaan yang dibatalkan (permintaan lebih baru atau unmount) dan `SessionExpiredError` tidak mengubah keadaan itu.
- Internet putus: `UseOnlineStatus.ts` (`online`, `reconnectCount`) dan `OfflineBanner.tsx` tepat di bawah topbar (`role="status"`, `aria-live="polite"`, `print:hidden`; "Tersambung kembali. Data sedang dimuat ulang." selama 4 dtk). Di `/dashboard` banner memberi ruang kanan untuk tombol notifikasi melayang (`besideNotificationButton`), dan di ponsel garis sinyal berada di atas teks. Latest, perangkat, riwayat, laporan, dan notifikasi memuat ulang saat `reconnectCount` bertambah. Tanpa koneksi, Mulai/Hentikan Monitoring dan "Mulai monitoring lagi" nonaktif dengan "Tidak ada koneksi internet."; polling hasil tetap berjalan, pemeriksaan wristband 30 dtk dijeda.
- Wristband: `deviceState` (`DeviceState.ts`: `loading | online | stale | offline | none | error | recording`, dengan `now` = `checkedAt`) adalah satu-satunya sumber untuk `DeviceOfflineCard`, nilai kartu "Status Perangkat" (`DEVICE_STATUS_LABEL`: "Memuat..." / "Terhubung" / "Koneksi tidak stabil" / "Terputus" / "Belum ada perangkat" / "Tidak diketahui" / "Sedang merekam"), tombol Mulai/Hentikan (`toggleBlock`), dan `restartAction`. `stale` = ONLINE tetapi `lastSeen` kosong atau lebih dari 30 dtk (`STALE_AFTER_MS`) saat dinilai, sama dengan pemeriksaan start di backend (yang baru menandai OFFLINE setelah 60 dtk); penilaian diulang tiap jawaban (30 dtk di `/dashboard`). Request yang gagal adalah `error`, tidak pernah diklaim offline: kartu "Status wristband belum bisa dimuat" (judul, lalu jenis masalah + pesannya) dan Mulai Monitoring nonaktif dengan "Status perangkat belum bisa dimuat.". Hanya Mulai yang bergantung pada wristband: Hentikan selalu bisa selama merekam (juga saat lewat 03:00), apa pun status wristband, karena stop di backend tidak memeriksa perangkat; `stale` juga tidak memblokir Mulai (penolakan backend memunculkan toast start). Offline: "Wristband belum terhubung"; stale: "Koneksi wristband tidak stabil"; keduanya dengan "Terakhir terlihat …", langkah yang sama ("Pastikan wristband menyala dan terpasang di pergelangan tangan.", "Pastikan baterainya cukup; isi daya bila perlu.", "Pastikan wristband terhubung ke internet, lalu tunggu sekitar 1 menit.", tanpa menyebut Wi-Fi/Bluetooth), tautan "Masih belum terhubung? Sambungkan ulang perangkat.", dan "Periksa lagi". Tanpa perangkat: "Belum ada perangkat terhubung" + "Hubungkan perangkat". Wristband hanya polling (dan hanya polling yang memperbarui `lastSeen`) saat idle; selama mengukur ia hanya mengirim data tiap 2 dtk, sehingga `lastSeen` membeku dan sweep backend (tiap 2 menit, ambang 60 dtk) bisa menandainya OFFLINE di tengah rekaman. Karena itu wristband hanya dinilai di luar sesi: selama `recording`/`analysing`, dan setelah sesi berakhir (hasil, timeout, atau idle setelah stop ditolak) sampai tiba jawaban perangkat yang diminta minimal 8 dtk sesudahnya (`sessionHoldsDevice`, `AFTER_SESSION_RECHECK_MS`; `endedAt` dari `useMonitoringSession` dan `requestedAt` dari `useMyDevice`, keduanya `performance.now()` sehingga koreksi jam perangkat tidak memperpanjang atau memotong penahanan), `deviceState` menerima `sessionActive` dan mengembalikan `recording`: tanpa kartu, Mulai/"Mulai monitoring lagi" tidak diblokir karena perangkat, dan jawaban 30 dtk selama penahanan itu tidak dinilai. Selama pemeriksaan resume belum selesai (`resumeChecked` dari `useMonitoringSession`, true begitu pembacaan baris history terbaru (`fetchNewestSession`) selesai dengan cara apa pun: dilanjutkan, tidak ada sesi, gagal, atau timeout 10 dtk; tidak pernah di-set setelah unmount) wristband belum dinilai dan `deviceState` mengembalikan `loading` ("Memuat...", tanpa kartu), supaya `lastSeen` yang membeku di tengah rekaman tidak sempat tampil sebagai "Terputus". Label kartu dan titik live diputuskan `deviceStatusLabel(state, phase)` dan `deviceStatusLive(state, phase)`: `recording` saat fase `recording` → "Sedang merekam" dengan titik live; `recording` di fase lain (masa penahanan setelah sesi) → "Baru selesai merekam" tanpa titik, agar tidak bertentangan dengan kartu sinyal "Monitoring dijeda"; titik live selain itu hanya untuk `online`. Mulai/ulang/panduan pertama tetap menganggap `recording` sebagai online. `useDashboardOverview` memanggil `reloadDevice()` `AFTER_SESSION_RECHECK_DELAY_MS` (9 dtk, satu detik di atas ambang 8 dtk agar jawaban pasti lolos penilaian) setelah sesi berakhir (`afterSessionRecheckDelay`; timer dibersihkan saat unmount). `endedAt` terakhir disimpan di variabel modul hook sesi (hanya ditulis di handler lewat `markEnded`) dan dipulihkan lewat `rememberedSessionEnd` hanya selama usianya masih di bawah 8 dtk, jadi pindah ke Riwayat lalu kembali ke `/dashboard` dalam masa itu tetap menahan penilaian dan timer hanya menjadwalkan sisa waktunya; sesudahnya penilaian normal. Sesi yang selesai saat pembaca tidak berada di `/dashboard` (mis. rekaman selesai otomatis saat Riwayat terbuka) juga ditahan: bila baris history terbaru pada pemeriksaan resume COMPLETED dan `completedAt`-nya, dipindah ke jam lokal dengan selisih header `Date` jawaban itu (`clockOffset`, aturan yang sama dengan `toLocalTime`), berumur kurang dari 8 dtk (`recentSessionEndAge`; `completedAt` di masa depan karena selisih jam dihitung 0 dtk), dan pengguna belum bertindak, `markEnded(umur)` mencatat akhir sesi mundur sebesar umur itu (tidak pernah lebih awal dari akhir yang sudah tercatat), sehingga timer memeriksa ulang pada sisa waktu menuju 9 dtk. Muat ulang halaman penuh mengulang dari awal (jam monoton ikut diatur ulang); aturan `completedAt` itu tetap berlaku sesudahnya. "Periksa lagi" dan "Coba lagi" memanggil `reload()`; selama `isRefreshing` keduanya memakai `aria-disabled` (bukan `disabled`) sehingga fokus tetap di tombol dan klik diabaikan, dengan `aria-busy` ("Memeriksa…" / "Memuat ulang…") dan tampilan nonaktif yang sama, dan kartunya tetap tampil.

### Testing dan struktur

- Semua test berada di `src/tests`.
- Smoke test Playwright ada di `e2e/` (`npm run test:e2e`): backend tiruan `e2e/mock-backend.mjs` (port 4010, data sintetis, `GET /api/v1/__mode?device=offline&latest=af…` mengganti keadaan) dan `next build` + `next start` di port 3100, memakai Chrome yang terpasang (`channel: "chrome"`, tanpa unduh browser), proyek desktop dan mobile. Mencakup landing, pengalihan login, masuk → dashboard, riwayat + detail, popover tanggal tetap di dalam layar, dan profil.
- Test mencakup design system, landing page, team page, auth/device flow, dashboard routes, ukuran teks (`TextScale`, `TextSize`), aplikasi terpasang (`InstallableApp`), sesi dan proxy (`ProxyBackend`, `ApiFetch`, `SessionFlow`, `ApiRoutes`), keadaan error (`FetchError`, `ErrorStates`, `OfflineFlow`, `DeviceState`, `FocusHandOff`, `PolishNotes`), arti hasil (`ResultKind`, `ResultStatus`), monitoring (`MonitoringSession`, `MonitoringFlow`), laporan (`ReportData`, `HistoryReport`), durasi 50 Hz (`Signal`), notifikasi (`NotificationKind`), struktur PascalCase, dan organisasi test.
- Audit aksesibilitas (axe-core, tag wcag2a/2aa/21a/21aa dan best-practice) pada 13 rute × desktop dan mobile, dengan data contoh dari backend tiruan: 0 pelanggaran per 9 November 2026. Aturan yang dijaga kode: label tombol memuat kata yang terlihat (pager "Sebelumnya"/"Selanjutnya" memakai `sr-only sm:not-sr-only`, bukan `aria-label`); inisial avatar digambar lewat CSS (`data-initials`) agar bukan teks terlihat pada tautan profil; `aside` punya nama (`Menu dashboard`, `Notifikasi`); `ScrollArea` hanya menampilkan scrollbar dan menjadi region fokus bernama (`label`) saat isinya benar-benar lebih lebar, diukur ulang lewat `ResizeObserver`, `MutationObserver`, `document.fonts.ready`, dan `animationend` (baris riwayat meluncur 5px lewat `stagger-item`, sehingga tabel sempat 5px lebih lebar).
- Kolom "Waktu Analisis" di riwayat dan "Waktu" di detail memakai `completedAt ?? requestedAt`, sama dengan hasil terakhir dan laporan; "Waktu Pengukuran" di kartu Monitoring Terakhir tetap waktu mulai.
- Route framework tetap menggunakan nama wajib Next.js seperti `page.tsx` dan `layout.tsx`; seluruh file komponen buatan project menggunakan PascalCase.

## Design System

### Typography

- Font utama: `Switzer Variable` dengan rentang weight `100–900`.
- Font dimuat secara self-hosted agar tampilan stabil dan tidak bergantung pada layanan font eksternal.
- Fallback: `Arial`, `Helvetica`, lalu `sans-serif`.
- Default letter spacing body: `-0.02em`.
- Heading umumnya memakai weight `600` dan tracking rapat sekitar `-0.035em` sampai `-0.04em`.
- Body/caption menggunakan weight `400–500`; ukuran mengikuti skala visual referensi dan responsif per section.
- Variabel CSS font: `--font-switzer`.

### Primary color palette

| Token | Hex | Penggunaan utama |
| --- | --- | --- |
| `primary-50` | `#E8F1FF` | Active navigation, background sangat muda |
| `primary-100` | `#D9E9FB` | Gradient dan panel informasi |
| `primary-200` | `#B0D2FE` | Border, ring, dan aksen lembut |
| `primary-300` | `#006EFB` | CTA, link aktif, fokus, dan grafik PPG |
| `primary-400` | `#0063E2` | Hover CTA |
| `primary-500` | `#0058C9` | Primary brand color |
| `primary-600` | `#0053BC` | Aksen biru gelap |
| `primary-700` | `#004297` | Teks/aksen sekunder |
| `primary-800` | `#003171` | Heading biru gelap |
| `primary-900` | `#002758` | Foreground utama dan logo text |

Token permukaan halaman publik:

- `paper` `#F5F3EE` (latar landing, tim, dan header) dan `paper-deep` `#EBE6DC` (aksen/area tidur di jam 24 jam).

Semantic colors yang konsisten dipakai pada dashboard:

- AF/error: `#FF4572` (`af-500`) dengan background `#FFE8EE` (`af-50`); teks kecil AF memakai `#C8264F` (`af-700`) agar kontrasnya lolos AA.
- Peringatan non-medis (toast warning): `warn-50` `#FFF7E6`, `warn-500` `#C98613`, `warn-700` `#8A5A00`.
- Di visual landing, irama normal memakai biru `primary-300`, bukan hijau: pasangan hijau–pink gagal uji buta warna (deutan ΔE 2.7), sedangkan biru–pink lolos. Status selalu disertai ikon/label.
- Normal/success: sekitar `#43B956`–`#4BC35A` dengan background `#E6F7E9`.
- App background: `#F7F7F8`; card background: `#FFFFFF`.
- Border netral: sekitar `#E1E5E9`–`#EDF0F3`.
- Muted text: sekitar `#9298A1`–`#A4A9B1`.

Gunakan token `primary-*` untuk warna brand. Warna semantic health boleh memakai nilai di atas agar status AF dan Normal tetap konsisten.

### Motion

- Page enter: fade dan translate vertikal selama `420ms`.
- Grafik PPG dashboard statis: tanpa stroke draw atau sweep, karena datanya rekaman selesai, bukan sinyal langsung.
- Sidebar: transisi width/transform selama `300ms`.
- Stagger list: jeda bertahap `50ms`.
- Hover motion hanya digunakan pada kontrol interaktif; card informasi statis tidak memakai lift atau shadow hover.
- Landing: garis scroll, line-art, dan jam 24 jam digerakkan oleh scroll (bukan timer). Monitor hero berhenti saat di luar layar atau tab tidak aktif.
- Semua motion non-esensial harus tetap mengikuti `prefers-reduced-motion`; di landing, mode ini menampilkan semua ilustrasi dalam keadaan akhir yang lengkap.

## Route Map

| Route | Fungsi |
| --- | --- |
| `/` | Landing page |
| `/tim-kami` | Daftar tim pengembang |
| `/login` | Masuk akun |
| `/register` | Daftar akun |
| `/hubungkan-perangkat` | Input Device ID |
| `/dashboard` | Ringkasan monitoring |
| `/riwayat` | Riwayat analisis PPG |
| `/riwayat/laporan` | Laporan pemantauan untuk dokter (siap cetak/PDF) |
| `/profil` | Informasi dan tindakan akun |
| `/profil/ubah` | Form edit profil |

## Struktur Folder

```text
src/
├── app/
│   ├── (dashboard)/        # Shared dashboard layout dan private-style routes
│   ├── fonts/              # Self-hosted fonts
│   ├── login/
│   ├── register/
│   ├── hubungkan-perangkat/
│   └── tim-kami/
├── components/
│   ├── auth/               # Auth shell, input, dan forms
│   ├── dashboard/          # Shell, navigation, views, charts, dan status UI
│   ├── sections/           # Landing-page sections
│   └── ui/                 # Reusable shared UI primitives
└── tests/                  # Seluruh source-contract tests
```

## Coding Conventions

- Gunakan PascalCase untuk nama file dan exported React component.
- Pengecualian hanya file convention Next.js seperti `page.tsx`, `layout.tsx`, dan file framework lain yang wajib lowercase.
- Gunakan alias import `@/` untuk source internal.
- Pisahkan component berdasarkan section atau satu tanggung jawab yang jelas.
- Pisahkan logika komponen (state, data fetching, polling, event handlers) ke dalam custom React hook (misalnya `useDashboardOverview`, `useHistoryView`) agar file komponen UI tetap bersih dan hanya berfokus pada deklarasi JSX template.
- Pertahankan shared dashboard shell pada route group `(dashboard)` agar state collapse tidak reset saat berpindah halaman.
- Jangan menambahkan dependency chart hanya untuk grafik sederhana; lanjutkan pola inline SVG yang sudah ada.
- Gunakan `DateRangePicker.tsx` sebagai boundary calendar; view menerima `DateRange` terkontrol sehingga integrasi backend cukup memetakan `from` dan `to` ke query API.
- Gunakan `DashboardModal.tsx` untuk dialog dashboard baru agar backdrop, keyboard Escape, spacing, dan tema tetap konsisten.
- Semua interactive controls harus memiliki accessible label, focus state, dan reduced-motion behavior bila menggunakan animasi.
- Jangan memasukkan credential, `.env`, build output, cache, atau file editor ke repository.

## Assets

- `public/logo.png`: logo icon SiHEDAF.
- `public/watch.png`: smartwatch untuk landing/auth visual.
- `public/watch2.png`: wearable ramping untuk device-status dashboard.
- `public/icons/*`, `src/app/apple-icon.png`: ikon PWA (manifest di `src/app/manifest.ts`). Dirasterisasi dari `icon.svg` / `icon-maskable.svg` lewat skrip Node sekali jalan memakai `require("sharp")` dari `node_modules` (transitif dari Next; tidak ada di package.json dan skripnya tidak di-commit): `icon-192/512.png` dan `icon-maskable-512.png` (512), `apple-icon.png` dari varian maskable di 180.
- `src/app/favicon.ico`: favicon aplikasi.
- `src/app/fonts/switzer-variable.woff2`: font utama.

## Commands dan Quality Gate

```bash
npm run dev
npm test
npm run lint
npm run build
```

Sebelum menyatakan perubahan selesai, jalankan test, lint, dan production build. Untuk perubahan route atau komponen penting, tambahkan/update source-contract test terkait di `src/tests`.

## Batasan Saat Ini

- Dashboard memanggil route proxy `src/app/api/v1/*` (auth, measurement, notification) yang meneruskan ke backend; data kesehatan, riwayat, notifikasi, dan profil berasal dari API tersebut, bukan mock.
- Rentang monitoring, filter tanggal, dan pagination riwayat adalah state React lokal yang dipetakan ke parameter API. Profil (nama) dan kata sandi disimpan ke backend lewat `ProfileClient` (`apiFetch`); tidak ada `localStorage` untuk data profil. Foto profil belum bisa diunggah.
- Logout (`src/app/api/v1/auth/logout`) menghapus cookie access/refresh token di sisi Next lalu mengarahkan ke `/login`; backend tidak punya endpoint logout, jadi token yang sudah terbit tidak dicabut di server dan tetap berlaku sampai kedaluwarsa.
- `src/proxy.ts` mengalihkan `/dashboard`, `/riwayat`, dan `/profil` ke `/login` bila tidak ada cookie access/refresh token; ini hanya pemeriksaan keberadaan cookie, validasi token dilakukan backend.
- Frontend tidak punya database sendiri dan tidak ada device protocol di sisi frontend; sinyal PPG dibaca dari `/measurement/signals` tanpa polling dan tanpa stream: setelah `/latest` pertama menjawab (`hasLoadedLatest`; jawaban itu mengisi kunci hasil, jadi satu pemuatan halaman membuat satu permintaan `/signals`), lalu saat rentang 3/6/12/30 menit berubah, saat internet tersambung kembali (`reconnectCount`), saat hasil baru tiba (kunci `latestData?.id` dan `latestData?.completedAt`), dan saat "Coba lagi" di panel grafik; satu `AbortController` per putaran membatalkan permintaan lama dan jawaban sesudah unmount diabaikan. Backend hanya mengembalikan sesi COMPLETED, jadi memanggilnya selama merekam tidak berguna. Karena menunggu `/latest` pertama (yang tidak punya batas waktu di client), grafik baru dimuat setelah jawaban itu; "Coba lagi" pada hasil terakhir juga membaca `/signals` lagi setelah `/latest` menjawab.
- Avatar profil memakai `profileImage` dari backend atau inisial bila kosong; belum ada unggah foto.
- `summary` di `/measurement/history` mencakup seluruh waktu (tidak mengikuti filter tanggal) dan hanya menghitung AF (kelas 1); kelas 0 termasuk "Not Enough Data" dan kegagalan AI. Riwayat menampilkannya sebagai ringkasan sepanjang waktu; laporan dokter menghitung angkanya sendiri.
- Filter tanggal `/measurement/history` memakai batas hari UTC atas `completedAt`. Daftar Riwayat mengirim tanggal lokal apa adanya, jadi untuk pembaca WIB satu hari di daftar berarti 07.00–06.59 WIB (halaman Riwayat menjelaskannya lewat `dateFilterNote`); hanya laporan dokter yang melebarkan query dan menyaring ulang per hari Jakarta. Baris IN_PROGRESS/FAILED juga muncul di daftar.
- `/measurement/signals` hanya menggabungkan `rawPpgData` sesi COMPLETED yang selesai dalam N menit terakhir; grafik tidak menampilkan data sesi yang sedang berjalan.
- Kegagalan AI disimpan backend sebagai "Normal (N)" kelas 0 dengan keyakinan 0; frontend menampilkannya sebagai "Hasil AI tidak tersedia" (`unavailable`) bila rekaman berisi minimal 150 sampel, dan sebagai "Rekaman terlalu singkat" (`short`) bila kurang (termasuk 0 sampel, saat AI tidak dipanggil), tetapi notifikasi "Pengukuran Selesai" tetap berbunyi normal (teks backend, tampil apa adanya dengan ikon netral).
- PDF dihasilkan oleh dialog cetak browser (`window.print()`); tidak ada pembuatan PDF di server.
- Tidak ada service worker, cache offline, atau notifikasi push; tanpa internet dashboard hanya menampilkan banner dan data yang sudah termuat.
- Backend menjawab "belum ada pengukuran" di `/latest` dengan 200 dan `data: null`; `latestOutcome` juga menerima 404.
- Wristband menghubungi server lewat internet (polling tiap 5 dtk, hanya saat idle; selama mengukur `lastSeen` tidak diperbarui); jenis jaringannya tidak disebut di UI, dan frontend tidak bisa menyambungkan ulang wristband. Status online/stale/offline baru diperbarui tiap 30 dtk dan hanya dinilai di luar sesi (plus jeda 8 dtk setelahnya).
- Konfirmasi dengan backend: (a) kunci keyakinan AF/AFL — backend mengambil `confidence[kata pertama label]`, dan label yang diawali "Atrial…" bisa membuatnya jatuh ke probabilitas "Normal", jadi "Keyakinan AI" untuk AF/AFL mungkin bukan probabilitas kelas itu; (b) jumlah sampel nyata rekaman 3 menit penuh — contoh di handbook IoT (`totalData: 4500`) setara 25 Hz, sedangkan kode backend mengirim `sampling_rate: 50` ke AI; durasi dan tick waktu frontend memakai 50 Hz.
- Refresh token backend rusak: token hasil `auth/refresh-token` berisi payload yang ditolak middleware ("Invalid Token"), jadi 401/403 praktis selalu berakhir di `401 "Sesi berakhir."` dan pengalihan ke `/login?sesi=berakhir`. Alur refresh lalu coba ulang tetap ada dan baru diuji dengan mock.

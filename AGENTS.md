<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SiHEDAF Project Guide

Terakhir diperbarui: 6 November 2026.

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
- Empat team cards sesuai role pada desain.
- Foto anggota selain data yang tersedia masih menggunakan tampilan placeholder.

### Authentication dan perangkat

- Route `/login`, `/register`, dan `/hubungkan-perangkat`.
- Split-screen auth layout di atas latar `paper`, dengan header (logo + tautan Beranda) dan footer berisi disclaimer.
- `AuthVisualPanel` menampilkan judul kontras tebal–tipis, `AuthJourney` (peta langkah Daftar → Masuk → Hubungkan perangkat → Dashboard dengan `aria-current="step"`), lalu ilustrasi: line-art yang menggambar diri (`autodraw`) atau foto jam untuk langkah perangkat. Di mobile journey menjadi progress bar ringkas.
- Visual panel auth memakai vertical flex flow; copy, journey, dan ilustrasi tidak boleh kembali menggunakan absolute offsets yang dapat saling overlap.
- `AuthInput`: label 15px, teks input 16px (mencegah zoom iOS), error dengan ikon + `role="alert"`, opsi `mono` dan `hint` untuk Device ID. Tombol utama memakai `btn-primary` navy; state disabled tetap terbaca.
- Active/inactive form state, validasi kelengkapan sederhana, dan toggle password.
- Login mengarahkan pengguna ke penyambungan perangkat.
- Register mengarahkan pengguna kembali ke login.
- Form perangkat mengarahkan pengguna ke `/dashboard` setelah Device ID terisi.
- Belum ada backend authentication, session, API, atau validasi Device ID sebenarnya.

### Dashboard

- Shared route-group layout untuk `/dashboard`, `/riwayat`, `/profil`, dan `/profil/ubah`.
- Sidebar desktop dapat diciutkan dari `210px` menjadi icon rail `72px`.
- Pada mobile, sidebar berubah menjadi off-canvas drawer dengan backdrop.
- Active navigation mengikuti pathname dan state sidebar tetap hidup selama navigasi child route.
- Tombol topbar memakai ikon panel open/close; tidak ada decorative icon ganda di samping judul.
- Notification rail full-height dapat ditutup melalui `PanelRightClose`, lalu dibuka kembali melalui tombol floating `PanelRightOpen` di sisi kanan content dengan transisi width/opacity.
- Alur monitoring (fase `idle → recording → analysing → result | timeout`) dikelola `hooks/UseMonitoringSession.ts` (state, polling, timer) dengan helper murni di `MonitoringSession.ts` (`formatElapsed`, `isFreshResult`, `rememberResult`, `rememberInitial`, `pollForFreshResult`, `restartAction`, `afterToggleTimeout`, `isTimeoutError`, `analysisStatusLabel`, `sessionStartFrom`, `requestSignal`, `waitFor`, `POLL_INTERVAL_MS`, `POLL_MAX_ATTEMPTS`, `REQUEST_TIMEOUT_MS`, `TOGGLE_TIMEOUT_MS`); `useDashboardOverview` hanya menyusunnya. Rentang 3/6/12/30 menit hanya jendela grafik.
- Saat `recording`, kartu sinyal menampilkan "Merekam" + waktu berjalan berbasis jam dinding (dihitung dari `createdAt` sesi IN_PROGRESS bila halaman dibuka ulang) dan pengingat agar wristband tetap terpasang. Hanya kata fase ("Merekam" / "Menganalisis rekaman…" / "Monitoring dijeda") yang `aria-live="polite"`; elemen `role="timer"` berada di luarnya dengan `aria-live="off"` agar tidak dibacakan tiap detik.
- Saat Hentikan ditekan (`analysing`), modal hasil terbuka dan `pollForFreshResult` meminta `/latest` segera lalu setiap 3 dtk, maksimal 20 permintaan (gagal, non-200, atau timeout tetap dihitung). Setiap permintaan poll dibatasi 10 dtk dan start/stop 30 dtk (`requestSignal`). Bila start/stop habis waktu (bukan karena unmount), `/latest` dibaca sekali dan statusnya diadopsi (`afterToggleTimeout`): IN_PROGRESS → tetap/kembali `recording` (waktu dari `sessionStartFrom`); selain itu stop lanjut ke polling `analysing` dan start kembali ke `idle`. Toast kesalahan yang sama hanya muncul bila aksi ternyata tidak terjadi atau pembacaan gagal. Hasil dianggap baru (`isFreshResult`) bila berlabel, `id`-nya berbeda dari hasil sebelumnya, bukan pengulangan timestamp (`completedAt ?? createdAt`) hasil tanpa `id`, dan — untuk sesi IN_PROGRESS yang dilanjutkan setelah reload selama `id` hasil sebelumnya belum diketahui — `id`-nya sama dengan baris itu atau `createdAt`-nya tidak lebih awal dari sesi tersebut (`rememberResult` menyimpan dasar pembandingnya). Jika tidak baru, `latestData` tidak diubah.
- Polling dibatalkan saat sesi baru dimulai dan saat unmount: satu `AbortController` per putaran polling dan satu per mount (dibuat di body effect, di-abort di cleanup; aman untuk StrictMode), sehingga tidak ada request, polling baru, atau setState setelah unmount — juga bila respons stop baru tiba setelah pengguna pindah halaman. Menutup modal tidak menghentikan polling (hasil tetap masuk ke dashboard tanpa membuka ulang modal). `/latest` awal yang lambat tetap mengisi dasar pembanding hasil baru bila masih kosong (`rememberInitial`), tetapi fase dan `latestData`-nya diabaikan bila pengguna sudah memulai/menghentikan sesi.
- `AiResultModal` punya state tampilan sendiri (`analysing | result | timeout`) dan memberi `DashboardModal` prop `contentKey={view}`: kunci itu hanya dipasang pada `<section>` dialog, sehingga tiap tampilan menjadi elemen dialog baru (fokus pindah ke dialog dan judul baru dibacakan, tanpa animasi masuk ulang) sementara backdrop tetap dan fokus saat ditutup kembali ke elemen pembuka awal. "Detail Hasil AI" membuka hasil `latestData` saat ini, kecuali selama fase `analysing`: tombol itu menampilkan tampilan "Menganalisis rekaman" (perilaku yang disengaja).
- Aksi modal: AF → "Buat laporan dokter", "Lihat Riwayat", "Mulai monitoring lagi", "Tutup"; normal → "Tutup", "Lihat Riwayat", "Mulai monitoring lagi"; belum ada label → "Lihat Riwayat" + "Tutup"; menganalisis → "Tutup"; timeout → "Buka Riwayat" + "Tutup". Aksi berada di grid (satu kolom di ponsel, dua kolom mulai `sm`; bila jumlahnya ganjil aksi utama selebar dua kolom), tinggi 48px, label satu baris; jangan memakai `flex-1` di kontainer kolom.
- "Mulai monitoring lagi" hanya ditampilkan setelah sesi berakhir (fase `idle`, `result`, atau `timeout`; `restartAction`), tidak pernah saat `recording`/`analysing`. Tombol tetap tampil tetapi dinonaktifkan (teks `text-primary-900/70`, bukan opacity) saat aksi start/stop sedang berjalan, saat status perangkat masih dimuat, atau saat perangkat offline dengan petunjuk "Perangkat belum terhubung." di bawah aksi.
- Fase `timeout`: modal "Hasil belum tersedia", dan selama fase ini kartu sinyal menampilkan catatan "Hasil sesi terakhir belum tersedia. Cek Riwayat beberapa saat lagi." dengan tautan "Buka Riwayat" (tetap terlihat setelah modal ditutup).
- Dashboard utama berisi hasil analisis terakhir, grafik PPG, monitoring terakhir, status wearable, dan notification rail.
- Profile pill pada topbar mengarahkan pengguna langsung ke `/profil`.
- Riwayat analisis memiliki calendar range picker bertema SiHEDAF, filter data mock, pagination aktif, dan pilihan 6/10/20 item per halaman.
- Profil memiliki modal ubah kata sandi dengan validasi dan modal konfirmasi logout; logout simulasi mengarahkan pengguna ke `/login`.
- Edit profil memiliki field terkontrol, upload/preview foto maksimal 2 MB, Device ID disabled, cancel navigation, serta modal sukses setelah penyimpanan.
- Nama, email, dan avatar edit profil disimpan sementara melalui adapter `ProfileStorage.ts` berbasis `localStorage`; adapter ini adalah batas yang perlu diganti dengan query/mutation backend.
- Primitive `DashboardModal.tsx` dipakai bersama untuk dialog akun dan hasil aksi; modal dapat ditutup melalui backdrop, tombol close, atau tombol Escape.
- Detail riwayat: baris riwayat dapat diklik dan punya tombol aksesibel "Lihat detail analisis …". `HistoryDetailModal` memakai `DashboardModal size="wide"` berisi `PpgTrace` (tanpa sumbu waktu) dan fakta Waktu, Keyakinan AI, serta Device ID. Untuk hasil AF tersedia tautan "Buat laporan dokter" ke jendela 30 hari yang berakhir pada item tersebut.
- Laporan dokter: route `/riwayat/laporan?from=YYYY-MM-DD&to=YYYY-MM-DD` (hari Asia/Jakarta; parameter tidak valid atau kosong kembali ke 30 hari terakhir). Logika murni ada di `ReportRange.ts` dan `ReportData.ts` (`collectReport`: halaman berisi 50 data hingga 10 halaman, ringkasan diambil dari halaman 1, daftar AF terbaru lebih dulu, catatan `truncated` bila terpotong). Hook `UseDoctorReport.ts` menjaga respons usang (stale-response guard) dan memakai `router.replace`; tampilan di `DoctorReportView.tsx`. Tombol "Cetak / Simpan PDF" memanggil `window.print()`. CSS cetak: `@page` A4 margin 14mm, `print:hidden` pada chrome shell, `.print-avoid-break`, dan `print-color-adjust: exact`. Teks "Tidak ada AF…" hanya tampil bila jumlah AF pada ringkasan adalah 0.
- Panduan pertama kali: `FirstRun.ts` (`firstRunSteps`) dan `FirstRunGuide.tsx` tampil saat `showFirstRun = hasLoadedLatest && !isDeviceLoading && !latestData`, berisi tiga langkah dengan tautan anchor `#monitor`; langkah monitoring dianggap berjalan selama fase `recording` atau `analysing`.
- `resultStatus` (`normal` / `af` / `unknown`) di `DashboardFormat.ts` adalah satu-satunya sumber status hasil untuk ringkasan, tabel riwayat, dan modal detail; `splitShares` (largest remainder, dengan basis `max(total, jumlah bagian)`) menjaga persentase Normal/AF selalu berjumlah 100.
- `tracePath` bersama di `DashboardFormat.ts` dipakai oleh `Sparkline`, `SignalChart`, dan `PpgTrace`.
- Semua dialog dashboard (`DashboardModal`) dirender lewat portal ke `document.body` agar overlay menutupi seluruh layar dan tidak terpotong ancestor ber-`transform` (`.dashboard-enter`).
- Item sidebar Riwayat aktif untuk semua route `/riwayat/*`.
- Tampilan dashboard memakai bahasa visual landing: latar `paper`, sidebar berupa rel dengan "stasiun" (halaman aktif = lingkaran navy terisi), ringkasan dibuka dengan kalimat status besar ("Irama terakhirmu normal/tidak teratur.") plus saran konsultasi dokter saat AF, grafik PPG bergaya monitor dengan sweep saat monitoring aktif, notifikasi sebagai timeline per hari, dan riwayat dengan angka besar + bar proporsi Normal/AF.
- Format data lewat `DashboardFormat.ts` (`formatConfidence`, `formatWib`, `isNormalResult`, `shareOf`); fungsi ini mengembalikan `null` alih-alih mengarang nilai, jadi UI menampilkan "—" bila API tidak mengirim data (tidak ada lagi fallback keyakinan 95%, baterai 92%, atau ID perangkat `PPG001`).
- `UseMyDevice.ts` adalah satu-satunya sumber data perangkat (`/api/v1/measurement/my-device`) untuk ringkasan, profil, dan edit profil.
- Komponen dashboard hanya memakai token warna (tanpa hex mentah), teks minimal 13px, dan teks navy minimal 70% opacity; ini dijaga oleh `DashboardRedesign.test.mjs`.
- Page entry, sidebar, notification rail, chart draw, staggered rows, dan tombol menggunakan motion ringan.
- Card dan information surface statis tidak memakai hover-lift agar tidak memberi affordance klik palsu; motion hover hanya dipakai pada kontrol yang benar-benar interaktif.
- Rekaman tanpa label hasil AI tampil netral ("Belum ada hasil" / "Hasil analisis belum tersedia", tanpa StatusMark) dan tidak dianggap normal. `DashboardModal` memindahkan fokus ke dialog saat dibuka dan mengembalikannya ke elemen pembuka saat ditutup.

### Testing dan struktur

- Semua test berada di `src/tests`.
- Test mencakup design system, landing page, team page, auth/device flow, dashboard routes, struktur PascalCase, dan organisasi test.
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
- SVG PPG: stroke draw selama `1.35s`.
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
- Monitoring range, calendar filter, pagination, dan password menggunakan state React lokal.
- Edit profile dan avatar menggunakan `localStorage` sebagai persistence simulasi; upload belum dikirim ke object storage/backend.
- Logout baru mengarahkan ke `/login` dan belum menghapus session/token karena authentication backend belum tersedia.
- `src/proxy.ts` mengalihkan `/dashboard`, `/riwayat`, dan `/profil` ke `/login` bila tidak ada cookie access/refresh token; ini hanya pemeriksaan keberadaan cookie, validasi token dilakukan backend.
- Frontend tidak punya database sendiri dan tidak ada device protocol di sisi frontend; sinyal PPG di-polling setiap 3 detik dari `/measurement/signals`, bukan di-stream secara real-time.
- Avatar profil menggunakan placeholder dan dapat diganti setelah asset final tersedia.
- Laporan dokter bergantung pada `summary` API yang menghormati filter tanggal.
- PDF dihasilkan oleh dialog cetak browser (`window.print()`); tidak ada pembuatan PDF di server.

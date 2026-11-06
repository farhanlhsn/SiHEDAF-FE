<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SiHEDAF Project Guide

Terakhir diperbarui: 6 November 2026.

## Gambaran Project

SiHEDAF adalah antarmuka web untuk wearable pemantau sinyal PPG yang membantu deteksi dini risiko Atrial Fibrillation (AF) dan stroke. Project saat ini mencakup website pemasaran, autentikasi, penyambungan perangkat, serta dashboard pemantauan kesehatan.

Bahasa utama antarmuka adalah Bahasa Indonesia. Implementasi saat ini berfokus pada UI dan pengalaman pengguna berdasarkan desain referensi; data kesehatan, akun, notifikasi, dan perangkat masih berupa data statis/mock.

## Tech Stack

- Next.js `16.2.10` dengan App Router dan Turbopack.
- React dan React DOM `19.2.4`.
- TypeScript 5.
- Tailwind CSS 4 melalui `@tailwindcss/postcss`.
- Lucide React untuk ikon kontrol panel yang semantic dan konsisten.
- `@daypicker/react` untuk calendar range picker yang terkontrol dan mudah dipetakan ke parameter API.
- ESLint 9 dengan `eslint-config-next`.
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

### Tim Kami

- Route `/tim-kami` dengan shared header/footer.
- Empat team cards sesuai role pada desain.
- Foto anggota selain data yang tersedia masih menggunakan tampilan placeholder.

### Authentication dan perangkat

- Route `/login`, `/register`, dan `/hubungkan-perangkat`.
- Split-screen auth layout yang responsif.
- Visual panel auth memakai vertical flex flow; logo, copy, dan smartwatch tidak boleh kembali menggunakan absolute offsets yang dapat saling overlap.
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
- Tombol monitoring memiliki state UI aktif/dijeda: ikon Pause menghentikan tampilan live, sedangkan ikon Play memulai kembali status dan animasi grafik. Rentang monitoring dapat dipilih antara 3, 6, 12, dan 30 menit.
- Dashboard utama berisi hasil analisis terakhir, grafik PPG, monitoring terakhir, status wearable, dan notification rail.
- Profile pill pada topbar mengarahkan pengguna langsung ke `/profil`.
- Riwayat analisis memiliki calendar range picker bertema SiHEDAF, filter data mock, pagination aktif, dan pilihan 6/10/20 item per halaman.
- Profil memiliki modal ubah kata sandi dengan validasi dan modal konfirmasi logout; logout simulasi mengarahkan pengguna ke `/login`.
- Edit profil memiliki field terkontrol, upload/preview foto maksimal 2 MB, Device ID disabled, cancel navigation, serta modal sukses setelah penyimpanan.
- Nama, email, dan avatar edit profil disimpan sementara melalui adapter `ProfileStorage.ts` berbasis `localStorage`; adapter ini adalah batas yang perlu diganti dengan query/mutation backend.
- Primitive `DashboardModal.tsx` dipakai bersama untuk dialog akun dan hasil aksi; modal dapat ditutup melalui backdrop, tombol close, atau tombol Escape.
- Page entry, sidebar, notification rail, chart draw, staggered rows, dan tombol menggunakan motion ringan.
- Card dan information surface statis tidak memakai hover-lift agar tidak memberi affordance klik palsu; motion hover hanya dipakai pada kontrol yang benar-benar interaktif.

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

- Seluruh health data, history, notification, dan profile data masih mock; kontrol UI sudah aktif tetapi belum memanggil API.
- Monitoring range, calendar filter, pagination, dan password menggunakan state React lokal.
- Edit profile dan avatar menggunakan `localStorage` sebagai persistence simulasi; upload belum dikirim ke object storage/backend.
- Logout baru mengarahkan ke `/login` dan belum menghapus session/token karena authentication backend belum tersedia.
- Tidak ada proteksi route/session untuk dashboard.
- Tidak ada database, API, device protocol, atau real-time PPG stream.
- Avatar profil menggunakan placeholder dan dapat diganti setelah asset final tersedia.

# Ukuran Teks, Aplikasi Terpasang, dan Keadaan Error — Design

Tanggal: 6 November 2026
Status: menunggu review

## Tujuan

Membuat SiHEDAF lebih nyaman dan bisa diandalkan untuk pengguna awam, terutama lansia dan keluarganya:

1. **Ukuran teks (Paket 3):** teks bisa diperbesar, baik lewat pengaturan huruf HP/browser maupun pilihan di Profil.
2. **Bisa dipasang (Paket 4):** SiHEDAF bisa ditambahkan ke layar utama HP dan dibuka seperti aplikasi.
3. **Keadaan error yang konsisten (Paket 5):** internet putus, wristband offline, sesi berakhir, dan server bermasalah tampil dengan gaya yang sama ("sinyal hilang") dan selalu disertai langkah perbaikan.

Kriteria sukses:
- Pengguna yang memilih "Sangat besar" bisa memakai dashboard di HP 390px tanpa scroll horizontal atau teks terpotong.
- SiHEDAF bisa dipasang dari Chrome Android dan Safari iOS.
- Saat ada masalah, pengguna selalu tahu apa yang terjadi dan apa yang bisa dilakukan, tanpa pesan teknis berbahasa Inggris.

## Keputusan dari diskusi

- Ukuran teks: ubah semua ukuran px ke **rem**, lalu tambah pilihan **Normal / Besar / Sangat besar** di Profil.
- PWA: **bisa dipasang saja, tanpa service worker.** Tidak ada cache supaya data kesehatan tidak tampil basi.
- Sesi: route measurement dan notification **ikut memakai refresh token** (`withSessionRefresh`). Kalau refresh juga gagal, pengguna diarahkan ke login dengan pesan.
- Wristband offline: cara wristband tersambung (Wi-Fi/Bluetooth) **tidak diketahui**, jadi langkah perbaikannya umum dan tidak menyebut teknologi koneksi.

## Batasan global

- Tanpa dependensi npm baru dan tanpa endpoint backend baru.
- Bahasa antarmuka Indonesia; tidak ada pesan teknis/Inggris yang sampai ke pengguna.
- Aturan gaya dashboard tetap berlaku: token warna saja (tanpa `-[#`), teks minimal 13px (setara `0.8125rem`), teks navy minimal `/70`, tanpa `font-serif`.
- Komponen PascalCase. State, fetch, dan handler di hook `Use*.ts`; logika murni di modul yang diuji.
- Semua animasi mengikuti `prefers-reduced-motion`. Semua kontrol interaktif punya label aksesibel dan focus state, dengan target sentuh minimal 44px.
- Quality gate: `npm test`, `npm run lint`, `npm run build`.

## Paket 3: Ukuran teks

### Konversi px → rem

- Setiap kelas `text-[Npx]` di `src/**/*.tsx` diganti `text-[{N/16}rem]`. Contoh:

  | px | rem |
  | --- | --- |
  | 12 | 0.75rem |
  | 13 | 0.8125rem |
  | 14 | 0.875rem |
  | 15 | 0.9375rem |
  | 16 | 1rem |
  | 17 | 1.0625rem |
  | 18 | 1.125rem |
  | 20 | 1.25rem |

- Pengecualian: `src/app/opengraph-image.tsx`, karena gambar dirender ke ukuran tetap 1200×630.
- Deklarasi `font-size` berbasis px di `globals.css` (misalnya `.rdp-*` 14px dan 16px) juga diubah ke rem.
- Ukuran tata letak (`h-[72px]`, `max-w-[…px]`, dan sejenisnya) **tidak** diubah. Kelas bawaan Tailwind (`h-12`, `px-5`, dan seterusnya) sudah berbasis rem, jadi tombol ikut membesar.
- Pada ukuran default browser (16px), tampilan harus identik dengan sebelumnya.
- Test kontrak baru melarang `text-[<angka>px]` di `src/**/*.tsx` (kecuali OG image).
- Aturan ukuran minimum di `DashboardRedesign.test.mjs` diubah dari px ke padanan rem: tidak boleh di bawah `0.8125rem`.

### Pilihan ukuran teks

- Modul murni `src/components/ui/TextSize.ts`:
  - `type TextSize = "normal" | "besar" | "sangat-besar"`;
  - `TEXT_SIZE_STORAGE_KEY = "sihedaf:text-size"`;
  - `parseTextSize(value: unknown): TextSize` — nilai tidak dikenal dianggap `"normal"`;
  - `TEXT_SIZE_SCALE`: normal 100%, besar 112.5%, sangat-besar 125%;
  - `textSizeScript(): string` — skrip inline untuk `<head>`.
- CSS di `globals.css`:
  - `html[data-text-size="besar"] { font-size: 112.5%; }`
  - `html[data-text-size="sangat-besar"] { font-size: 125%; }`

  Persentase dihitung dari ukuran default browser, jadi efeknya bertumpuk dengan pengaturan huruf HP.
- Root layout menyisipkan skrip inline di `<head>`. Skrip itu membaca localStorage (di dalam `try/catch`) dan memasang `data-text-size` di `<html>` sebelum halaman tampil, supaya tidak ada kedipan.
  - `<html>` diberi `suppressHydrationWarning`.
  - Tag `<html lang="id" …>` harus tetap satu baris, karena dijaga test DesignSystem.
- Hook `src/components/ui/hooks/UseTextSize.ts` (memakai `useSyncExternalStore`) mengembalikan `{ size, setSize }`.
  - `setSize` menyimpan ke localStorage, memperbarui atribut `<html>`, dan memberi tahu pelanggan lain lewat event kustom; event `storage` menyinkronkan antar-tab.
  - Kalau localStorage tidak tersedia (mode privat), pilihan tetap berlaku sampai halaman ditutup.
- UI di Profil, bagian baru **"Tampilan"**:
  - Judul "Ukuran teks" dengan grup radio berisi tiga pilihan: "Normal", "Besar", "Sangat besar". Berupa `<input type="radio">` asli yang ditata sebagai pil, tinggi minimal 48px, dengan focus ring.
  - Contoh teks netral yang langsung berubah ukuran: "Contoh teks:" lalu "Hasil pemantauan dan riwayatmu akan tampil dengan ukuran ini." (bukan kalimat hasil kesehatan).
  - Tidak perlu tombol simpan; perubahan langsung berlaku.
- Pilihan berlaku di semua halaman (landing, login, dashboard).

### Verifikasi

Di 125% dan lebar 390px, halaman `/dashboard`, `/riwayat`, `/riwayat/laporan`, `/profil`, dan `/login` tidak boleh punya scroll horizontal (`scrollWidth <= clientWidth`). Topbar, tombol, dan pil tidak boleh terpotong. Screenshot dibandingkan secara visual.

## Paket 4: Bisa dipasang

- `src/app/manifest.ts` (`MetadataRoute.Manifest`):
  - `name: "SiHEDAF — Pemantau Irama Jantung"`, `short_name: "SiHEDAF"`;
  - `description`: "Pantau irama jantung dari wristband SiHEDAF dan simpan hasilnya untuk dokter.";
  - `lang: "id"`, `dir: "ltr"`;
  - `start_url: "/dashboard"`, `scope: "/"`, `display: "standalone"`;
  - `background_color: "#f5f3ee"`, `theme_color: "#f5f3ee"`;
  - `categories: ["health", "medical"]`;
  - `icons`:
    - `/icons/icon-192.png` (192, purpose `any`)
    - `/icons/icon-512.png` (512, purpose `any`)
    - `/icons/icon-maskable-512.png` (512, purpose `maskable`)
  - Orientasi tidak dikunci.
- **Ikon**
  - Ikon PNG di-commit di `public/icons/`, dirasterisasi dari geometri `src/app/icon.svg` (hati dan garis PPG di atas navy).
  - Varian `any` memakai sudut membulat seperti favicon.
  - Varian maskable full-bleed navy dengan glyph di dalam zona aman 80%.
  - `src/app/apple-icon.png` berukuran 180×180, full-bleed (iOS membulatkan sudutnya sendiri).
  - SVG sumber disimpan di `public/icons/` (`icon.svg`, `icon-maskable.svg`) supaya bisa dibuat ulang. Rasterisasi memakai `sharp` dari `node_modules` (transitif dari Next) lewat skrip sekali jalan yang **tidak** di-commit; caranya dicatat di AGENTS.md.
- **Root layout**
  - `metadata.applicationName = "SiHEDAF"`;
  - `appleWebApp: { capable: true, title: "SiHEDAF", statusBarStyle: "default" }`;
  - `export const viewport: Viewport = { themeColor: "#f5f3ee" }`, digabung dengan `viewport` yang sudah ada bila ada.
- `proxy.ts` tidak boleh menghalangi `/manifest.webmanifest`, `/icons/*`, dan `/apple-icon.png`. Matcher saat ini hanya route dashboard; ini diverifikasi.
- **Kartu "Pasang SiHEDAF di HP" di Profil** (`InstallGuide.tsx`):
  - Isi petunjuk:
    - iPhone/iPad: "Buka di Safari → ketuk Bagikan → pilih Tambahkan ke Layar Utama."
    - Android: "Buka di Chrome → ketuk menu ⋮ → pilih Instal aplikasi atau Tambahkan ke layar utama."
  - Hook `useIsStandalone()` memakai `matchMedia("(display-mode: standalone)")` atau `navigator.standalone`. Snapshot server dianggap "belum diketahui", sehingga kartu tidak dirender di server dan tidak terjadi hydration mismatch.
  - Kartu disembunyikan bila aplikasi sudah berjalan dalam mode standalone.
  - Tidak ada tombol instal kustom (`beforeinstallprompt`), sesuai saran panduan PWA Next.js.
- Batasan: pemasangan butuh HTTPS (production). Tidak ada service worker, notifikasi push, atau cache offline.

## Paket 5: Keadaan error yang konsisten

### Sesi: refresh otomatis di semua route

- Helper server baru `src/features/auth/session/server/ProxyBackend.ts`:

  ```ts
  proxyBackend(
    path: string,
    init?: { method?: string; body?: BodyInit | null; search?: string; contentType?: string },
    options?: { fetcher?: typeof fetch; cookieStore?; refresher? },
  ): Promise<Response>
  ```

  - Membungkus `withSessionRefresh`. Operasinya memanggil `buildBackendApiUrl(path)` (+ `search`) dengan `Authorization: Bearer <token>` dan `cache: "no-store"`.
  - Backend menjawab 401 → lempar `SessionServiceError(SESSION_EXPIRED, 401)`. Ini memicu refresh, lalu request dicoba ulang sekali.
  - Respons lain diteruskan apa adanya: body JSON backend dan status HTTP backend, sehingga amplop `{ code, data, … }` yang dipakai klien tidak berubah.
  - Body yang bukan JSON atau error jaringan → `502 { code: 502, message: "Layanan SiHEDAF sedang bermasalah." }`.
  - Refresh gagal atau tidak ada token → `401 { code: 401, message: "Sesi berakhir." }`.
- Sembilan route dipindah ke `proxyBackend`, dengan method, query, dan body sesuai perilaku sekarang:
  - `measurement/bind`, `history`, `latest`, `my-device`, `signals`, `start`, `stop`;
  - `notification`, `notification/[id]/read`.
- Klien: `src/features/auth/session/client/ApiFetch.ts`:
  - `apiFetch(input, init)` meneruskan ke `fetch`.
  - Bila status 401, `apiFetch` memanggil `redirectToSessionExpired()` (sekali saja) lalu melempar `SessionExpiredError`. Fungsi itu menjalankan `window.location.assign("/login?sesi=berakhir")`.
- Semua fetch dashboard memakai `apiFetch`:
  - hook overview dan monitoring, `UseHistoryView`, `UseDoctorReport`, `UseMyDevice`;
  - pengambilan notifikasi, `ProfileProvider`, `ProfileView`, `EditProfileView`.
  - Pengalihan 401 yang sudah ada (`router.replace("/login")`) diganti ke alur yang sama supaya pesannya muncul.
- Halaman login, bila `?sesi=berakhir`, menampilkan banner `role="status"`: "Sesimu sudah berakhir. Silakan masuk lagi untuk melanjutkan."
  - `/login` tetap statis: parameter dibaca di client (`useSearchParams` dalam `<Suspense>`). Pola ini diverifikasi di dokumentasi Next 16.

### Pesan error yang jujur dan seragam

- Modul murni `src/components/ui/FetchError.ts`:

  ```ts
  describeFetchError({ online, status, error }) →
    { kind: "offline" | "server" | "session"; title: string; message: string }
  ```

  - `online === false` atau `NetworkError` (dilempar `apiFetch` bila fetch tidak mendapat jawaban; abort/timeout tidak dibungkus) → `offline`: "Koneksi internet terputus" / "Periksa koneksi internet HP atau laptopmu, lalu coba lagi."
  - `status === 401` atau `SessionExpiredError` → `session` (UI tidak menampilkannya karena pengguna sedang dialihkan).
  - Selain itu (termasuk `TypeError` biasa) → `server`: "Server SiHEDAF sedang bermasalah" / "Ini bukan masalah di HP atau laptopmu. Coba lagi beberapa saat lagi."
- Komponen bersama `src/components/ui/DataErrorState.tsx`:
  - props: `{ title, message, onRetry?, compact? }`;
  - visual: garis sinyal terputus versi kecil, sebahasa dengan `SignalLost`;
  - judul, pesan, dan tombol "Coba lagi" (minimal 48px);
  - `role="alert"`, mengikuti `prefers-reduced-motion`.
- Dipakai di:
  - error Riwayat (menggantikan UI error sekarang);
  - error laporan dokter;
  - panel error `ProfileProvider`;
  - gagal memuat notifikasi;
  - ringkasan dashboard.
- **Ringkasan dashboard:**
  - Kalau `/latest` gagal, hook menyimpan `latestError`.
  - Judul menjadi "Hasil terakhir belum bisa dimuat.", dan `DataErrorState` tampil dengan "Coba lagi".
  - Panduan pengguna baru **tidak** tampil (`showFirstRun` mensyaratkan tidak ada error). Ini menutup bug lama: sebelumnya pengguna lama melihat panduan pengguna baru saat API gagal.

### Internet putus

- Store modul + hook `src/components/ui/hooks/UseOnlineStatus.ts` (`useSyncExternalStore` pada event `online`/`offline`; snapshot server `online: true`) mengembalikan `{ online, reconnectCount }`. `reconnectCount` bertambah setiap kali koneksi pulih.
- `OfflineBanner.tsx` di `DashboardShell`, tepat di bawah topbar (`print:hidden`, `role="status"`, `aria-live="polite"`):
  - Saat offline: garis sinyal terputus kecil + "Koneksi internet terputus. Data yang tampil mungkin bukan yang terbaru; SiHEDAF akan memuat ulang otomatis saat tersambung."
  - Saat pulih: "Tersambung kembali. Data sedang dimuat ulang." selama 4 detik.
- Pengambilan data dashboard memasukkan `reconnectCount` sebagai dependensi, sehingga data dimuat ulang saat koneksi pulih: latest, perangkat, riwayat, laporan, notifikasi.
- Monitoring saat offline:
  - Tombol Mulai/Hentikan dinonaktifkan dengan alasan "Tidak ada koneksi internet." (`aria-describedby`).
  - `restartAction` mendapat masukan koneksi; tanpa koneksi, "Mulai monitoring lagi" juga nonaktif dengan petunjuk yang sama.
  - Polling hasil tetap berjalan; kegagalan dihitung sebagai percobaan, seperti sekarang.

### Wristband offline

- `DeviceOfflineCard.tsx` di ringkasan dashboard menggantikan kalimat tunggal "Monitoring bisa dimulai setelah perangkat terhubung kembali.":
  - **Perangkat ada, status bukan ONLINE:**
    - Judul "Wristband belum terhubung" dan "Terakhir terlihat {formatWib(lastSeen)}" (atau "Belum pernah terlihat").
    - Langkah:
      1. "Pastikan wristband menyala dan terpasang di pergelangan tangan."
      2. "Pastikan baterainya cukup; isi daya bila perlu."
      3. "Pastikan wristband berada di dekat jaringan yang biasa dipakai saat penyambungan, lalu tunggu beberapa menit."
      4. "Masih belum terhubung? Sambungkan ulang perangkat." (tautan ke `/hubungkan-perangkat`)
    - Tombol "Periksa lagi" memanggil `reload()` baru di `useMyDevice`.
  - **Tidak ada perangkat:** judul "Belum ada perangkat terhubung", tautan "Hubungkan perangkat".
  - **Gagal memuat `/my-device`:** `DataErrorState`. Jangan mengklaim wristband offline.
- Kartu "Status Perangkat" mengikuti `deviceState` yang sama (keputusan review akhir: kejujuran didahulukan): Memuat... / Terhubung / Terputus / Belum ada perangkat / Tidak diketahui. Saat status gagal dimuat, Mulai Monitoring dan "Mulai monitoring lagi" nonaktif dengan "Status perangkat belum bisa dimuat.".

## Pengujian

- **Unit test** dengan nilai harapan ditulis manual:
  - `parseTextSize` (nilai valid, tidak dikenal, null);
  - `describeFetchError` (offline, `NetworkError`, `TypeError` biasa saat online → server, 401, 500, 502) dan `latestOutcome`;
  - `proxyBackend` dengan `fetcher` dan `refresher` palsu: 200 diteruskan, 401 → refresh → retry, refresh gagal → 401 dengan pesan, bukan-JSON → 502, error jaringan → 502;
  - `restartAction` dengan masukan koneksi.
- **Test kontrak:**
  - tidak ada `text-[Npx]` di `src/**/*.tsx` (kecuali OG image);
  - aturan ukuran minimum dashboard dalam rem;
  - skrip ukuran teks ada di root layout dan `<html>` tetap satu baris;
  - isi manifest (`start_url`, `display`, tiga ikon termasuk maskable);
  - `appleWebApp` dan `themeColor` ada;
  - ikon PNG ada dengan ukuran yang benar (baca header PNG);
  - sembilan route memakai `proxyBackend` dan tidak lagi memanggil `fetch` backend langsung;
  - hook dashboard memakai `apiFetch`;
  - banner login `sesi=berakhir`;
  - `DataErrorState` dipakai di semua lokasi yang disebut;
  - file baru masuk `viewFiles`.
- **Smoke test Playwright** di `next start` + mock API, di 1440×900 dan 390×844:
  - ukuran "Sangat besar" tanpa scroll horizontal di halaman yang disebut, ditambah screenshot;
  - `/manifest.webmanifest` dan ikon mengembalikan 200 dengan tipe yang benar;
  - `context.setOffline(true)` menampilkan banner dan menonaktifkan tombol monitoring; online lagi → banner "Tersambung kembali" dan data dimuat ulang;
  - mock toggle 401 → diarahkan ke `/login?sesi=berakhir` dan banner tampil;
  - mock wristband OFFLINE → kartu langkah perbaikan;
  - mock `/latest` 500 → `DataErrorState` (bukan panduan pengguna baru);
  - mock riwayat 500 → `DataErrorState` dengan "Coba lagi" yang berfungsi;
  - tanpa error di console.
- Quality gate: `npm test`, `npm run lint`, `npm run build`.

## Di luar cakupan

- Service worker, cache offline, dan notifikasi push.
- Mode gelap.
- Pengaturan kontras tinggi terpisah.
- Protokol atau penyambungan ulang wristband dari web.
- Penyimpanan preferensi ukuran teks di server (akun).

## Risiko

- **Konversi besar (250 tempat).** Konversinya mekanis dan pada ukuran default seharusnya identik. Risikonya dikendalikan dengan screenshot sebelum/sesudah di ukuran default.
- **Tata letak di 125%.** Elemen dengan tinggi px tetap (topbar 72px, pil) bisa sesak. Verifikasi Playwright di 390px wajib; perbaiki dengan `min-h` bila perlu.
- **`proxyBackend` mengubah sembilan route sekaligus.** Bentuk respons harus identik untuk kasus sukses. Unit test dan smoke test dengan mock menjaga ini, tapi perilaku backend asli untuk token kedaluwarsa belum pernah diuji di lingkungan ini.
- **Deteksi standalone di iOS** memakai `navigator.standalone` yang non-standar. Bila salah, akibatnya hanya kartu petunjuk yang tetap tampil.

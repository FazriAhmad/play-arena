# Status Progress — PlayArena (Booking Venue Olahraga)

> File ini dipakai sebagai checkpoint lintas-sesi. Lanjutkan di sesi chat baru dengan minta Claude baca file ini dulu.

## Ringkasan Proyek

Platform booking online untuk venue olahraga (futsal, badminton, basket, tenis, dsb) — **satu pemilik usaha, bisa multi-venue** (seperti cabang, bukan marketplace terbuka). Nama produk: **PlayArena** (sebelumnya nama kerja-sementara "GORin", diganti 2026-08-27 sesuai logo resmi yang sudah dibuat user — lihat `logo-rec-center.jpg`).

## 📄 PRD

Dibuat sebagai artifact HTML interaktif (sidebar TOC, 21 modul fitur dalam 3 fase, tabel peran & akses, tech stack, alur booking, entitas data inti, roadmap, batasan & non-goal), sudah di-rebrand pakai logo &amp; palet warna PlayArena (biru/oranye) yang asli:
**https://claude.ai/code/artifact/5a994b1f-7c2a-423c-8361-d9a40a8f9312**

Kalau mau baca PRD lengkap, buka link di atas — jangan re-generate dari nol, artifact-nya masih ada dan sudah final untuk versi saat ini.

## 🔗 Repository

**https://github.com/FazriAhmad/play-arena.git** — seluruh isi folder ini (STATUS.md, logo, referensi-play-arena, Ui-PlayArena, Api-PlayArena) di-push sebagai satu repo, sama seperti pola LMS. `.env`/`vendor`/`node_modules` semua ter-exclude lewat `.gitignore` masing-masing folder.
- Branch `main` — backend Modul 01 (Api-PlayArena) selesai.
- Branch `dev` — **branch kerja saat ini**, berisi `main` + frontend Modul 01 (Ui-PlayArena). Belum di-merge ke `main` atas permintaan user ("simpan di branch dev dulu") — merge ke `main` nanti kalau user minta.

## 🎨 Referensi &amp; Aset yang Sudah Dibuat User

- **`logo-rec-center.jpg`** — logo resmi PlayArena ("Unleash the Spirit"), palet biru (`#1d5fc4`) &amp; oranye. Sudah dipakai di PRD artifact (sidebar + cover).
- **`referensi-play-arena/`** — reference frontend React 19 + TypeScript + Vite + Tailwind v4 (mock data, belum tersambung backend). Berguna untuk tipe data (`src/lib/types.ts`: Venue, Court, Booking, Customer, Voucher, Staff, BlockSlot, dst.) dan komponen UI (SlotGrid, VenueCards, InvoiceSheet). **Cuma referensi tampilan/tipe data — bukan acuan tech stack.** Tech stack tetap sesuai Keputusan Kunci di bawah (Laravel 12 + PostgreSQL di backend), bukan ikut apa pun yang tersirat dari reference ini (reference murni frontend mock, tidak punya backend/payment/DB constraint sama sekali).
- **Tabel database `play_arena`** — sudah dibuat user langsung di PostgreSQL lokal (di luar repo, tidak ada file SQL yang di-commit).

## Keputusan Kunci (jangan diubah tanpa diskusi ulang)

- **Model bisnis: satu pemilik, multi-venue** — bukan marketplace terbuka (tidak ada alur approval vendor/komisi platform/payout ke banyak pemilik). Kalau ini berubah nanti, itu perubahan arsitektur besar (isolasi data per tenant), bukan modul tambahan biasa.
- **Fitur paling kritis: deteksi bentrok jadwal.** Dijamin lewat PostgreSQL `EXCLUDE USING gist` pada rentang waktu booking per lapangan — database yang menolak insert overlap, bukan cuma dicek di kode aplikasi. Ini alasan PostgreSQL dipertahankan sebagai database, bukan cuma ikut kebiasaan proyek lain.
- **Tidak pakai WebSocket/real-time push** untuk kalender — cukup refetch berkala, karena kebenaran data sudah dijamin di level database, bukan di real-time-nya.
- **Tech stack** disamakan dengan proyek lain: Laravel 12 + PostgreSQL (backend), React 19 + TypeScript + Vite + Tailwind (frontend).
- **Payment gateway: Midtrans, SANDBOX SAJA** (keputusan 2026-08-27) — proyek ini portofolio/demo, tidak akan deploy ke production sungguhan. Jangan bikin akun merchant terverifikasi atau proses go-live, cukup sandbox environment yang memang gratis tanpa verifikasi apa pun.
- **Konfirmasi booking: manual via WhatsApp click-to-chat (`wa.me`), BUKAN WhatsApp Business API** (keputusan 2026-08-27, revisi dari rencana awal pakai Cloud API resmi). Alur baru: booking dibuat → slot langsung ter-hold → status "Menunggu ACC Admin" → link `wa.me` ke nomor admin venue otomatis disiapkan/dibuka di sisi pelanggan (bukan server yang kirim, karena tanpa API server tidak bisa auto-kirim WA) → admin ACC/reject manual dari dashboard → **setelah ACC baru muncul pembayaran** (Midtrans). Kalau 10 menit belum di-ACC, tombol "Chat Admin via WhatsApp" muncul di halaman status booking pelanggan untuk follow-up manual (bisa ditekan berkali-kali). Reminder tetap otomatis tapi lewat Email (bukan WA, karena WA di sini murni manual). Upgrade ke WA Business API resmi dicatat sebagai langkah lanjutan kalau volume booking bikin ACC manual jadi bottleneck.
- **Form booking wajib isi nomor WA yang bisa dihubungi** (keputusan 2026-08-27) — dipakai admin buat kontak manual kalau perlu, BUKAN kanal reminder otomatis. Reminder tetap 2x lewat Email: **H-1 dan H-2jam** sebelum jadwal main (sebelumnya cuma H-1, ditambah H-2jam sesuai request). Alasan tetap Email bukan WA: reminder itu sistem yang harus proaktif kirim tanpa ada pelanggan yang menekan tombol — `wa.me` click-to-chat tidak bisa itu, butuh WA Business API asli (balik ke opsi berbayar yang sudah ditolak sebelumnya).
- **Promo &amp; pengumuman (Modul 16): tampil di web saja untuk sekarang** (keputusan 2026-08-27) — banner di beranda + daftar pengumuman di akun pelanggan begitu mereka login, TIDAK didorong keluar lewat WA/Email. Broadcast aktif (push ke semua pelanggan sekaligus) ditunda, bukan prioritas MVP.
- **Peta lokasi: Leaflet.js + OpenStreetMap** — gratis tanpa API key/billing, dipilih di atas Google Maps yang butuh akun billing aktif.
- **Tiga peran:** Owner/Admin (akses penuh semua venue), Staff/Kasir (terbatas ke venue yang ditugaskan), Pelanggan (publik).
- **Dependensi eksternal:** tidak ada — sudah tidak relevan sejak Midtrans diputuskan sandbox-only (lihat poin di atas).

## Struktur Folder

```
C:\Users\Fazri\portofolio\rec-center-book\
├── STATUS.md                  (file ini)
├── logo-rec-center.jpg         (logo resmi PlayArena)
├── referensi-play-arena/       (reference frontend React+Vite+TS, mock data — cuma UI/tipe, bukan acuan tech stack)
├── Ui-PlayArena/                (frontend production — Vite+React+TS+Tailwind v4, di-scaffold 2026-08-27)
└── Api-PlayArena/               (backend production — Laravel 12+PostgreSQL, di-scaffold 2026-08-27)
```

### Api-PlayArena (backend) — Modul 01 (Pengguna & Role) selesai, teruji end-to-end
- Laravel 12, terhubung ke database `play_arena` (Postgres lokal, `127.0.0.1:5432`, user `postgres`)
- Port dev: **8020** (bukan 8000/8010 — biar tidak rebutan port dengan project lain di portofolio ini, termasuk LMS yang pakai 8010). Jalankan manual: `php artisan serve --host=127.0.0.1 --port=8020`
- Package terpasang: `laravel/sanctum` (auth token), `spatie/laravel-permission` (role), `laravel/boost` (dev tooling — ada `CLAUDE.md`/`AGENTS.md` sendiri di folder ini berisi guideline khusus Laravel, dibaca otomatis tiap masuk ke folder ini)
- `User` model pakai `HasApiTokens` + `HasRoles`, kolom `phone` & `is_active` ditambah lewat migration. Relasi `venues()` (staff ↔ venue via `venue_staff`) dan `ownedVenues()` (owner → venue miliknya).
- Custom `Authenticate` middleware (return JSON 401, bukan redirect ke halaman login yang nggak ada) — pola yang sama dipakai di Api-LMS setelah bug serupa pernah kejadian di project money-management
- Tabel `venues` (skema minimal — CRUD lengkap fasilitas/foto/dst nyusul di Modul 03) & `venue_staff` (pivot penugasan) sudah ada, dibutuhkan Modul 01 untuk fitur "penugasan staff ke venue"
- **3 role di-seed** (`owner`, `staff`, `pelanggan`) + 1 akun owner bootstrap: `owner@playarena.test` / `owner12345` (`database/seeders/RoleSeeder.php`, dipanggil dari `DatabaseSeeder`)
- Endpoint jalan (`routes/api.php`): `POST /register` (pelanggan saja), `POST /login` (email atau no. HP), `POST /logout`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `GET /venues`, `POST /venues` (owner), `GET|POST /staff` + `PUT /staff/{id}` (owner — assign role staff + `venue_ids`)
- **2 bug ditemukan & diperbaiki saat testing end-to-end** (bukan cuma "tidak error", dicek nilai aktualnya):
  1. `is_active` balik `null` bukan `true` setelah register/create staff — bukan bug refresh-default seperti di LMS, tapi karena kolom itu belum masuk `#[Fillable(...)]` di `User` model sehingga mass-assignment-nya di-drop diam-diam. Kalau nemu pola serupa (field kekirim tapi hasilnya null), curiga dulu ke `Fillable` sebelum ke hal lain.
  2. `forgot-password` selalu 500 karena notifikasi reset password bawaan Laravel manggil `route('password.reset', ...)` — route web yang memang tidak ada di API murni ini. Diperbaiki dengan `ResetPassword::createUrlUsing()` di `AppServiceProvider` supaya link reset mengarah ke `FRONTEND_URL` (env baru, default `http://127.0.0.1:5180`), bukan ke route Laravel.
- **Sudah teruji end-to-end**: register pelanggan → login pakai email → login pakai nomor HP → owner login → owner buat venue → owner buat staff + assign venue → staff login → staff coba akses endpoint owner-only (403) → forgot-password → link di log mengarah ke frontend dengan token valid → reset-password → login pakai password baru berhasil → logout → token lama ditolak (401)

### Ui-PlayArena (frontend) — Modul 01 (Pengguna & Role) selesai, teruji end-to-end di branch `dev`
- Vite + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + React Router + lucide-react (persis stack `referensi-play-arena/`, cuma versi production yang disambungkan ke API asli, bukan mock)
- Port dev: **5180**, sudah didaftarkan di `.claude/launch.json` sebagai `playarena-ui`
- `src/lib/api.ts` — fetch wrapper sama seperti Ui-LMS (token di localStorage key `playarena_token`, `api.get/post/put/patch/delete`, class `ApiError`)
- `src/store/AuthContext.tsx` — hydrate sesi dari token tersimpan lewat `GET /me`, `login/register/logout`
- Halaman: `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `Dashboard` (placeholder), `StaffPage` (owner-only — list staff, form tambah staff dengan pemilihan venue, toggle aktif/nonaktif)
- Route guard: `ProtectedRoute` (butuh login), `RoleRoute` (butuh role tertentu, dipakai untuk `/staff`), `GuestRoute` (redirect kalau sudah login)
- **Catatan debugging**: sempat curiga ada bug "Invalid hook call" dari console browser saat testing — setelah diselidiki (repro di komponen minimal, restart server, downgrade Vite 8→6), ternyata itu console log basi yang nyangkut di tab browser lama dari sesi sebelumnya, bukan bug di aplikasi. Tab baru selalu bersih tanpa error. Kalau nemu error serupa nanti, coba dulu di tab baru sebelum curiga ke kode.
- **Sudah teruji end-to-end di browser sungguhan**: login owner → buka Kelola Staff → isi form tambah staff (termasuk klik pilihan venue) → submit → staff baru muncul di tabel → logout → login pakai akun staff yang baru dibuat → coba akses `/staff` → otomatis diarahkan balik ke dashboard (role guard jalan)

## Progress

- [x] PRD selesai & dipublikasikan sebagai artifact (2026-08-27)
- [x] Rebrand GORin → PlayArena, logo asli diterapkan ke PRD (2026-08-27)
- [x] Referensi UI dibuat user (`referensi-play-arena/`, React+Vite+TS mock) (2026-08-27)
- [x] Tabel database `play_arena` dibuat user di PostgreSQL lokal (2026-08-27)
- [x] Setup project backend (Laravel 12 + Sanctum + Spatie Permission, terhubung `play_arena`) (2026-08-27)
- [x] Setup project frontend (Vite + React + TS + Tailwind v4, terhubung ke backend) (2026-08-27)
- [x] **Modul 01 — Pengguna & Role (backend)**: register, login (email/HP), logout, me, reset password, kelola staff + penugasan venue — teruji end-to-end (2026-08-27)
- [x] Repo di-push ke GitHub: github.com/FazriAhmad/play-arena, branch `main` (2026-08-27)
- [x] **Modul 01 — Pengguna & Role (frontend)**: Login, Register, Forgot/Reset Password, Dashboard, Kelola Staff — teruji end-to-end di browser, di-push ke branch `dev` (2026-08-27)
- [ ] **Modul 01 selesai penuh** — merge `dev` ke `main` kalau user sudah oke, lalu **lanjut Modul 02** (Direktori & Pencarian Lapangan)
- [ ] Modul 03–10 — sisa Fase 1 (Inti Booking)
- [ ] Fase 2 — Fitur Bisnis & Pertumbuhan (Modul 11–19)
- [ ] Fase 3 — Nice-to-have (Modul 20–21)

## Roadmap Modul (ringkas — detail lengkap ada di PRD)

**Fase 1 (MVP):** Pengguna & Role · Direktori & Pencarian Lapangan · Kelola Data Lapangan · Kalender & Blokir Slot · **Booking & Deteksi Bentrok (kritis)** · Pembayaran Online (DP/Full via Midtrans, setelah ACC) · Kelola Booking Masuk (ACC wajib) · Riwayat & Invoice · Cancel/Reschedule & Refund · **Konfirmasi Admin via WA (manual, click-to-chat) + Reminder Email H-1 & H-2jam**

**Fase 2 (Growth):** Booking Berulang · Split Payment/Patungan · Rating & Review · Voucher & Promo · Kelola Pelanggan · Promo & Pengumuman (web saja) · Multi-Venue & Kelola Staff · Dashboard Analitik · Laporan Pendapatan

**Fase 3 (Nice-to-have):** Sewa Perlengkapan Tambahan · Membership Bulanan

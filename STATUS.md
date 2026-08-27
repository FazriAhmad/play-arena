# Status Progress — PlayArena (Booking Venue Olahraga)

> File ini dipakai sebagai checkpoint lintas-sesi. Lanjutkan di sesi chat baru dengan minta Claude baca file ini dulu.

## Ringkasan Proyek

Platform booking online untuk venue olahraga (futsal, badminton, basket, tenis, dsb) — **satu pemilik usaha, bisa multi-venue** (seperti cabang, bukan marketplace terbuka). Nama produk: **PlayArena** (sebelumnya nama kerja-sementara "GORin", diganti 2026-08-27 sesuai logo resmi yang sudah dibuat user — lihat `logo-rec-center.jpg`).

## 📄 PRD

Dibuat sebagai artifact HTML interaktif (sidebar TOC, 21 modul fitur dalam 3 fase, tabel peran & akses, tech stack, alur booking, entitas data inti, roadmap, batasan & non-goal), sudah di-rebrand pakai logo &amp; palet warna PlayArena (biru/oranye) yang asli:
**https://claude.ai/code/artifact/5a994b1f-7c2a-423c-8361-d9a40a8f9312**

Kalau mau baca PRD lengkap, buka link di atas — jangan re-generate dari nol, artifact-nya masih ada dan sudah final untuk versi saat ini.

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

### Api-PlayArena (backend) — sudah bisa jalan
- Laravel 12, terhubung ke database `play_arena` (Postgres lokal, `127.0.0.1:5432`, user `postgres`)
- Port dev: **8020** (bukan 8000/8010 — biar tidak rebutan port dengan project lain di portofolio ini, termasuk LMS yang pakai 8010). Jalankan manual: `php artisan serve --host=127.0.0.1 --port=8020`
- Package terpasang: `laravel/sanctum` (auth token), `spatie/laravel-permission` (role), `laravel/boost` (dev tooling — ada `CLAUDE.md`/`AGENTS.md` sendiri di folder ini berisi guideline khusus Laravel, dibaca otomatis tiap masuk ke folder ini)
- `User` model sudah pakai `HasApiTokens` + `HasRoles`, kolom `phone` & `is_active` ditambah lewat migration
- Custom `Authenticate` middleware (return JSON 401, bukan redirect ke halaman login yang nggak ada) — pola yang sama dipakai di Api-LMS setelah bug serupa pernah kejadian di project money-management
- `routes/api.php` baru berisi `/api/ping` (health check) — endpoint modul PRD belum ada, mulai dari Modul 01 (Pengguna & Role)
- Migrasi jalan bersih: users (+phone, +is_active), cache, jobs, personal_access_tokens, tabel permission (roles/permissions Spatie)

### Ui-PlayArena (frontend) — sudah bisa jalan
- Vite + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + React Router + lucide-react (persis stack `referensi-play-arena/`, cuma versi production yang akan disambungkan ke API asli, bukan mock)
- Port dev: **5180**, sudah didaftarkan di `.claude/launch.json` sebagai `playarena-ui` (browser preview tool bisa langsung `preview_start({name: "playarena-ui"})`)
- `src/lib/api.ts` — fetch wrapper sama seperti Ui-LMS (token di localStorage key `playarena_token`, `api.get/post/put/patch/delete`, class `ApiError`)
- `App.tsx` sementara cuma health-check ke `/api/ping` (sudah diverifikasi terhubung) — halaman modul asli belum dibangun

**Sudah diverifikasi end-to-end**: frontend (5180) berhasil manggil backend (8020) yang terhubung ke `play_arena`, tanpa error console.

## Progress

- [x] PRD selesai & dipublikasikan sebagai artifact (2026-08-27)
- [x] Rebrand GORin → PlayArena, logo asli diterapkan ke PRD (2026-08-27)
- [x] Referensi UI dibuat user (`referensi-play-arena/`, React+Vite+TS mock) (2026-08-27)
- [x] Tabel database `play_arena` dibuat user di PostgreSQL lokal (2026-08-27)
- [x] Setup project backend (Laravel 12 + Sanctum + Spatie Permission, terhubung `play_arena`) (2026-08-27)
- [x] Setup project frontend (Vite + React + TS + Tailwind v4, terhubung ke backend) (2026-08-27)
- [ ] Fase 1 — Inti Booking (Modul 01–10) — **mulai dari sini di sesi berikutnya**
- [ ] Fase 2 — Fitur Bisnis & Pertumbuhan (Modul 11–19)
- [ ] Fase 3 — Nice-to-have (Modul 20–21)

## Roadmap Modul (ringkas — detail lengkap ada di PRD)

**Fase 1 (MVP):** Pengguna & Role · Direktori & Pencarian Lapangan · Kelola Data Lapangan · Kalender & Blokir Slot · **Booking & Deteksi Bentrok (kritis)** · Pembayaran Online (DP/Full via Midtrans, setelah ACC) · Kelola Booking Masuk (ACC wajib) · Riwayat & Invoice · Cancel/Reschedule & Refund · **Konfirmasi Admin via WA (manual, click-to-chat) + Reminder Email H-1 & H-2jam**

**Fase 2 (Growth):** Booking Berulang · Split Payment/Patungan · Rating & Review · Voucher & Promo · Kelola Pelanggan · Promo & Pengumuman (web saja) · Multi-Venue & Kelola Staff · Dashboard Analitik · Laporan Pendapatan

**Fase 3 (Nice-to-have):** Sewa Perlengkapan Tambahan · Membership Bulanan

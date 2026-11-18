# BIMBEL STAR KIDS

Aplikasi simulasi TKA (Tes Kemampuan Akademik) untuk siswa kelas 6 SD/MI,
dibuat untuk kebutuhan bimbel. Mobile-first, berbahasa Indonesia, tanpa iklan.

> **Status:** MVP arsitektur & UI selesai, siap deploy ke **Vercel** dengan
> **Supabase Auth + PostgreSQL**. Tanpa env Supabase, aplikasi otomatis
> berjalan dalam mode demo in-memory (data reset saat server restart).
>
> Panduan lengkap: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
> Skema database: [`supabase/schema.sql`](supabase/schema.sql).

## Fitur

- **Siswa** — login, beranda, **latihan & tryout langsung per mata pelajaran**
  (Matematika, Bahasa Indonesia, IPAS), **materi belajar per topik**, ujian
  dengan timer server, autosave, tandai ragu, submit/auto-submit, hasil +
  analisis topik & level, review pembahasan, riwayat, profil.
- **Tutor** — ringkasan kelas, rekap nilai, laporan dengan filter + ekspor CSV,
  bank soal (soal baru tersimpan sebagai draft), review jawaban siswa.
- **Admin** — CRUD siswa, kelas, mapel/topik, bank soal, paket, laporan seluruh
  bimbel + CSV, pengaturan identitas.
- **Jenis soal** — pilihan ganda, pilihan ganda kompleks, benar/salah (grid),
  dan **isian singkat/esai** (maksimal 15 kata, simbol `! @ # $ % ^ & * ( )`
  otomatis ditolak).

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Mode demo (tanpa Supabase) langsung berjalan dengan data contoh. Untuk memakai
Supabase Auth + database:

1. Buat project Supabase, jalankan `supabase/schema.sql` di SQL Editor.
2. Salin `.env.example` → `.env.local`, isi URL, anon key, dan service role key.
3. Jalankan `npm run db:seed` untuk membuat akun + data awal.
4. `npm run dev`.

Perintah lain:

```bash
npm run typecheck  # cek TypeScript
npm run test       # unit test mesin penilaian (Vitest)
npm run build      # verifikasi build produksi
npm run db:seed    # seed Supabase (idempoten)
```

## Akun demo

| Peran | Username | Password |
| --- | --- | --- |
| Admin bimbel | `admin` | `admin123` |
| Tutor Kelas 6 | `tutor` | `tutor123` |
| Tutor tanpa kelas | `tutor2` | `tutor123` |
| Siswa Kelas 6 | `6001`–`6008` | `siswa123` |

Akun di atas dibuat oleh `npm run db:seed` pada mode Supabase, dan sudah
tersedia otomatis pada mode demo.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Auth + PostgreSQL) · JWT cookie (`jose`) untuk mode demo ·
bcrypt · Vitest.

## Deployment

Target produksi: **Vercel** + **Supabase**. Langkah rinci (schema, Auth,
seed, env Vercel, checklist) ada di [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Struktur singkat

| Folder | Isi |
| --- | --- |
| `app/(public)` | Landing, mapel, detail paket, panduan, privasi |
| `app/(siswa)` | Dashboard, latihan, tryout, materi, riwayat, profil, hasil |
| `app/ujian` | Runner ujian dan review siswa |
| `app/tutor`, `app/admin` | Area per peran |
| `app/api` | Attempt, autosave, submit, event, ekspor CSV |
| `components` | Layout, primitif UI, komponen ujian/hasil, form |
| `lib/data` | Lapisan repository (satu-satunya akses data), termasuk materi |
| `lib/supabase` | Klien Supabase, sinkronisasi store ↔ database, Auth admin |
| `lib/scoring.ts` | Mesin penilaian murni |
| `lib/essay.ts` | Aturan jawaban isian singkat (15 kata, filter simbol) |
| `supabase/schema.sql` | Skema PostgreSQL + RLS |
| `supabase/seed.ts` | Seed akun Auth + data aplikasi (idempoten) |
| `tests` | Unit test scoring dan alur attempt |

Penjelasan lengkap ada di [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Kebutuhan produk ada di [`PRD-TKA-Bimbel.md`](PRD-TKA-Bimbel.md).

## Catatan keamanan

- Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di kode klien.
- Kunci jawaban dan snapshot soal tidak boleh dikirim ke browser sebelum ujian
  selesai.
- Timer dan penilaian divalidasi di server, bukan di klien.

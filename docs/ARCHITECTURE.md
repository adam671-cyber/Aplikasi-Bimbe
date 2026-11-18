# Arsitektur BIMBEL STAR KIDS

Dokumen ini menjelaskan struktur aplikasi MVP BIMBEL STAR KIDS, batas antar-lapisan,
dan cara kerja integrasi Supabase (Auth + PostgreSQL) untuk produksi.

## 1. Ringkasan

BIMBEL STAR KIDS adalah simulasi TKA untuk siswa kelas 6 SD/MI. Aplikasi mobile-first
dengan tiga peran:

| Peran | Kebutuhan utama |
| --- | --- |
| Siswa | Login, membaca materi per mapel, memilih latihan/tryout per mapel, mengerjakan ujian dengan timer & autosave, melihat hasil, review, riwayat |
| Tutor | Memantau kelas yang diampu, laporan hasil, bank soal (membuat draft soal), review jawaban siswa |
| Admin | CRUD siswa/kelas/mapel/topik/materi/soal/paket, laporan seluruh bimbel, ekspor CSV, pengaturan |

Data produksi disimpan di **Supabase** (Auth + PostgreSQL). Saat env Supabase
tidak diisi, aplikasi memakai penyimpanan demo in-memory (`lib/data/store.ts`)
sehingga pengembangan dan test tetap berjalan tanpa database. Lapisan
repository di `lib/data/*` menyembunyikan perbedaan kedua mode dari halaman dan
komponen.

## 2. Stack

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS v4 (token di `app/globals.css`)
- `jose` untuk JWT sesi mode demo, `bcryptjs` untuk hash password mode demo
- Supabase Auth + PostgreSQL untuk produksi (`@supabase/ssr`, `@supabase/supabase-js`)
- `lucide-react` untuk ikon, `katex` untuk rumus matematika
- Vitest untuk unit test mesin penilaian

Perintah:

```bash
npm run dev        # jalankan pengembangan
npm run typecheck  # tsc --noEmit
npm run test       # unit test (Vitest)
npm run build      # verifikasi produksi
npm run db:seed    # seed Supabase (butuh env Supabase)
```

## 3. Struktur folder

```
app/
  (public)/            halaman publik: landing, mapel, paket, panduan, privasi
  login/               login semua peran
  (siswa)/             dashboard, latihan, tryout, materi, riwayat, profil, hasil
  (siswa)/materi/      daftar materi, per mapel, dan detail materi
  ujian/[attemptId]/   runner ujian + review siswa
  tutor/               area tutor
  admin/               area admin
  api/                 route handler: attempt, autosave, submit, event, ekspor CSV

supabase/schema.sql    skema Supabase (DDL + RLS + trigger Auth)
supabase/seed.ts       seed akun Auth + data aplikasi (idempoten)

components/
  layout/              AppShell, header publik, page header, navigasi
  ui/                  primitif (button, card, input, badge, table, dst.)
  exam/                runner ujian, renderer soal, navigator, indikator simpan
  result/              tampilan hasil & daftar review (dipakai 3 peran)
  forms/               form soal, paket, ubah password

lib/
  types.ts             tipe domain lintas lapisan (enum, payload, hasil)
  scoring.ts           mesin penilaian murni (tanpa I/O)
  essay.ts             aturan jawaban isian singkat (maks. 15 kata, filter simbol)
  utils.ts             format tanggal, durasi, slugify, cn
  navigation.ts        konfigurasi menu per peran
  auth/                sesi JWT, guard, rate limit, server actions login
  actions/             server actions admin & soal
  data/                LAPISAN DATA (satu-satunya akses ke store/Supabase)
    store.ts           cache in-memory (mode demo & cache Supabase)
    seed.ts            data contoh
    users.ts           user & sesi
    students.ts        siswa, kelas, tutor
    catalog.ts         mapel, topik, paket
    materials.ts       materi belajar per mapel/topik
    questions.ts       bank soal
    attempts.ts        lifecycle attempt, penilaian, review
    stats.ts           agregasi dashboard & laporan
    settings.ts        pengaturan aplikasi
    snapshots.ts       pembuatan snapshot soal
  supabase/
    config.ts          deteksi env + pemetaan NIS → email Auth
    server.ts          klien cookie (sesi) & klien service role (data)
    admin.ts           Admin API: buat/ubah/nonaktifkan akun Auth
    store-sync.ts      muat data ke store + write-through ke Supabase
```

Aturan penting: **halaman dan komponen tidak mengimpor `store.ts` secara
langsung**, kecuali server action yang membutuhkan pengecekan cepat. Semua
operasi data melewati fungsi repository di `lib/data/*`.

## 4. Alur ujian

1. Siswa menekan **Mulai** pada halaman paket.
2. Server action `startAttempt` memvalidasi status paket, jadwal, kelas, dan
   batas percobaan, lalu membuat snapshot setiap soal (termasuk kunci jawaban).
3. Server mengembalikan `attemptId`; siswa diarahkan ke `/ujian/[attemptId]`.
4. `ExamRunner` menampilkan soal dari payload publik **tanpa kunci jawaban**.
5. Setiap perubahan jawaban dikirim ke `PATCH /api/attempts/[id]/answers`
   (autosave). Flag ragu disimpan pada endpoint yang sama.
6. Klien menampilkan hitung mundur, tetapi sumber kebenaran waktu ada di
   `expiresAt` server. `closeExpiredAttempts()` mengubah attempt lewat waktu
   menjadi `expired` dan menilainya otomatis.
7. `POST /api/attempts/[id]/submit` menilai attempt dari snapshot, menyimpan
   skor dan statistik, lalu siswa diarahkan ke `/hasil/[attemptId]`.
8. Review memakai snapshot yang sama sehingga perubahan bank soal tidak
   mengubah hasil lama.

Timer, autosave, dan submit divalidasi di server; endpoint API memakai sesi
cookie dan memeriksa kepemilikan attempt.

## 5. Penilaian

`lib/scoring.ts` adalah fungsi murni tanpa akses database:

- `single_choice`: benar jika pilihan sama dengan kunci.
- `multiple_choice`: mode `all_or_nothing` membutuhkan kecocokan persis; mode
  `partial` memberi proporsi benar dengan penalti pilihan salah.
- `true_false_grid`: mode penuh membutuhkan semua pernyataan benar dan lengkap;
  mode parsial memakai proporsi pernyataan benar.
- `short_answer` (isian singkat/esai): jawaban siswa dibersihkan lebih dulu
  (maksimal 15 kata, simbol `! @ # $ % ^ & * ( )` dibuang), lalu dibandingkan
  dengan semua variasi jawaban benar setelah dinormalisasi (huruf kecil, spasi
  dirapikan, tanda baca umum diabaikan). Benar/salah bersifat biner.
- Skor akhir = `round(earnedPoints / totalPoints * 100)`.
- Analisis topik dan level kognitif dihitung dari snapshot attempt.

Aturan esai dipusatkan di `lib/essay.ts` agar klien, server, dan penilaian
memakai batas kata serta filter simbol yang sama. Variasi jawaban benar disimpan
sebagai `question_options` dengan `is_correct = true`, dan opsi tersebut tidak
pernah dikirim ke browser selama ujian berlangsung.

Unit test berada di `tests/scoring.test.ts` dan `tests/attempt-flow.test.ts`.

## 6. Autentikasi & otorisasi

Dua mode, dipilih otomatis dari env:

**Produksi (Supabase terkonfigurasi)**

- Login memakai username/NIS + password. Server mencari profil, lalu memanggil
  `supabase.auth.signInWithPassword` dengan email profil. NIS siswa dipetakan ke
  email internal `<nis>@<SUPABASE_AUTH_EMAIL_DOMAIN>`.
- Sesi disimpan sebagai cookie Supabase (`sb-*`) yang di-refresh middleware.
- `getCurrentUser()` membaca `auth.getUser()` lalu profil + siswa + kelas.
- Logout memanggil `auth.signOut()` dan menghapus cookie demo lama.
- Ganti password memverifikasi password lama lewat `signInWithPassword`, lalu
  `auth.updateUser`.
- Akun siswa dibuat/dinonaktifkan/direset lewat Admin API (`lib/supabase/admin.ts`).

**Demo lokal (tanpa env Supabase)**

- Password di-hash bcrypt, sesi JWT HS256 di cookie HttpOnly `tka_session`.
- Alur guard dan halaman sama persis dengan mode produksi.

**Guard (kedua mode)**

- `middleware.ts` melindungi `/dashboard`, `/latihan`, `/tryout`, `/materi`,
  `/riwayat`, `/ujian`, `/hasil`, `/profil`, `/tutor`, dan `/admin`.
- Guard di `lib/auth/guards.ts` memeriksa peran di server:
  - `requireStudent`, `requireTutor`, `requireAdmin`
  - `getApiUser` untuk route handler
- Tutor hanya dapat membuka attempt siswa pada kelas yang diampu
  (`lib/auth/access.ts`). Admin dapat membuka semua attempt.
- Login dibatasi rate limit sederhana per proses.
- RLS Supabase menjadi lapisan pertahanan kedua; operasi tulis memakai service
  role hanya di server.

Akun demo:

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Tutor Kelas 6 | `tutor` | `tutor123` |
| Tutor (tanpa kelas) | `tutor2` | `tutor123` |
| Siswa Kelas 6 | `6001`–`6008` | `siswa123` |

## 7. Integrasi Supabase

Skema ada di `supabase/schema.sql` (tabel, enum, index, trigger, helper RLS,
dan policy). Panduan operasional ada di [`DEPLOYMENT.md`](DEPLOYMENT.md).

### Pemetaan modul → tabel

| Modul | Tabel Supabase |
| --- | --- |
| `users.ts` | `profiles` (+ Supabase Auth) |
| `students.ts` | `students`, `classes` |
| `catalog.ts` | `subjects`, `topics`, `packages`, `package_questions`, `package_classes` |
| `materials.ts` | `materials` |
| `questions.ts` | `questions`, `question_options`, `question_statements` |
| `attempts.ts` | `attempts`, `attempt_answers`, `attempt_events` |
| `stats.ts` | agregasi dari store hasil muat tabel |
| `settings.ts` | `app_settings` |

### Strategi sinkronisasi

`lib/supabase/store-sync.ts` memakai dua arah:

1. **Hydration** — `ensureStore()` memuat seluruh tabel (paralel) ke bentuk
   `StoreData` dengan TTL ±2 detik. Semua fungsi repository memanggilnya di
   awal, sehingga halaman tetap memakai API repository yang ada.
2. **Write-through** — setiap mutasi memperbarui store lalu memanggil
   `saveProfile`, `saveStudent`, `savePackage`, `saveAttempt`, dan seterusnya.
   Attempt menulis baris attempt + seluruh jawaban (snapshot ikut tersimpan).

Store in-memory adalah cache per instance serverless; database tetap sumber
kebenaran. Perubahan dari instance lain terlihat paling lambat satu TTL.

### ID dan seed

Tabel konten memakai primary key `text` agar ID seed (`sub-mat`, `q-mat-01`,
`pkg-mat-tryout-1`, `cls-6`, dst.) dipakai apa adanya. `profiles.id` tetap uuid
dan sama dengan `auth.users.id`; trigger `handle_new_user` membuat profil saat
akun Auth dibuat. `supabase/seed.ts` membuat akun Auth demo, memetakan ID user
lama ke uuid Auth, lalu meng-upsert seluruh konten.

### Hal yang harus tetap dijaga

- Jangan mengirim `is_correct`, `correctAnswer`, atau `snapshot` ke browser
  sebelum attempt selesai.
- Jangan mempercayai waktu dari klien. Hitung `expires_at` di server.
- Simpan snapshot soal per attempt agar hasil historis tidak berubah.
- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` pada kode klien atau variabel
  `NEXT_PUBLIC_*`.
- Password siswa dikelola Supabase Auth; jangan menyimpan hash di tabel aplikasi.

## 8. Batasan MVP saat ini

- Store in-memory dimuat ulang per instance dengan TTL singkat; belum memakai
  query per halaman atau realtime subscription.
- Hydration membaca seluruh tabel dengan pagination 1000 baris. Untuk data
  attempt yang sangat besar, ganti pendekatan ini dengan query per halaman.
- Belum ada unggah gambar soal; kolom `image_url` sudah disiapkan.
- Materi belajar masih berupa konten teks (mendukung tebal, miring, dan rumus
  sederhana); belum ada editor materi khusus di area tutor/admin.
- Isian singkat dinilai dengan pencocokan variasi jawaban, belum memakai
  penilaian semantik atau koreksi manual tutor.
- Belum ada notifikasi WhatsApp/email.
- Ekspor CSV memakai endpoint server dengan cakupan data sesuai peran.
- Belum ada bank soal publik di luar paket; soal dikelola admin/tutor.
- Rate limit login masih per proses server; untuk produksi multi-instance,
  pindahkan ke Upstash Redis atau tabel khusus.

## 9. Referensi produk

Kebutuhan lengkap, ruang lingkup, dan keputusan terbuka ada di
`PRD-TKA-Bimbel.md` (salinan: `docs/PRD-TKA-Bimbel.md`).

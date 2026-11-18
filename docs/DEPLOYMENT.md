# Deployment — Supabase + Vercel

Panduan ini menjelaskan cara menyiapkan database, autentikasi, dan deploy
TKA Cerdas ke Vercel.

Ada dua mode:

| Mode | Kapan dipakai | Penyimpanan |
| --- | --- | --- |
| Demo lokal | Tanpa env Supabase | In-memory, reset saat server restart |
| Produksi | Ketiga env Supabase terisi | Supabase Auth + PostgreSQL |

---

## 1. Buat project Supabase

1. Masuk ke <https://supabase.com/dashboard> lalu **New project**.
2. Pilih region terdekat (mis. `Southeast Asia (Singapore)`).
3. Simpan **database password** di tempat aman.
4. Buka **Project Settings → API**, catat:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (**rahasia, server-only**)

> Jangan pernah memakai `service_role` di komponen client atau menambahkan
> prefix `NEXT_PUBLIC_`. Key ini melewati RLS.

## 2. Jalankan skema

1. Buka **SQL Editor → New query**.
2. Salin seluruh isi [`supabase/schema.sql`](../supabase/schema.sql).
3. Klik **Run**. Skema membuat tabel, enum, trigger, helper RLS, dan policy.
4. Skema aman dijalankan ulang (trigger & policy di-drop lebih dulu), tetapi
   jangan mengubah primary key setelah data produksi ada.

### Pengaturan Auth yang disarankan

Buka **Authentication → Providers → Email**:

- Aktifkan **Email** provider.
- Nonaktifkan **Allow new users to sign up** (akun dibuat admin/seed, bukan
  pendaftaran publik).
- **Confirm email** boleh aktif; akun yang dibuat lewat Admin API sudah
  dikonfirmasi otomatis.

Tidak ada redirect URL khusus karena aplikasi tidak memakai magic link atau
OAuth.

## 3. Isi environment

Salin `.env.example` menjadi `.env.local` lalu isi:

```env
AUTH_SECRET="hasil-openssl-rand-base64-32"
APP_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Opsional, default siswa.tkaceras.id
SUPABASE_AUTH_EMAIL_DOMAIN="siswa.tkaceras.id"
```

`AUTH_SECRET` hanya dipakai mode demo (JWT) dan tetap wajib diisi di Vercel
agar build tidak memakai nilai default pengembangan.

## 4. Seed data awal

```bash
npm install
npm run db:seed
```

Script ini:

- membuat akun Supabase Auth untuk admin, tutor, dan 8 siswa demo;
- mengisi profil, kelas, siswa, mapel, topik, materi, 48 soal, paket, attempt
  contoh, dan pengaturan aplikasi;
- **idempoten**: akun yang sudah ada dipakai ulang dan konten di-upsert;
- hanya mengganti baris dengan ID seed, sehingga paket/soal buatan pengguna
  tidak terhapus.

Password akun lama tidak diubah. Untuk mengatur ulang ke password demo:

```bash
# macOS/Linux
SEED_RESET_PASSWORDS=1 npm run db:seed

# Windows PowerShell
$env:SEED_RESET_PASSWORDS="1"; npm run db:seed
```

Akun demo hasil seed:

| Peran | Login | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Tutor | `tutor` | `tutor123` |
| Tutor 2 | `tutor2` | `tutor123` |
| Siswa | `6001`–`6008` | `siswa123` |

> Segera ganti password akun demo setelah aplikasi dipakai sungguhan. Admin
> dapat mereset password siswa dari **Admin → Siswa**.

Cara kerja login siswa: NIS dipetakan ke email internal
`<nis>@siswa.tkaceras.id`. Siswa tetap mengetik NIS di form login.

## 5. Deploy ke Vercel

1. Push repository ke GitHub/GitLab.
2. Di Vercel, **Add New → Project**, impor repository.
3. Framework terdeteksi otomatis: **Next.js**.
   - Build command: `npm run build`
   - Output: default Next.js
   - Install command: `npm install`
   - Node.js: 20 LTS atau lebih baru (Next.js 15).
4. Tambahkan environment variables untuk **Production** (dan Preview bila
   perlu):

   | Name | Value |
   | --- | --- |
   | `AUTH_SECRET` | string acak ≥ 32 karakter |
   | `APP_URL` | `https://nama-app.vercel.app` |
   | `NEXT_PUBLIC_BIMBEL_NAME` | nama bimbel |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key |
   | `SUPABASE_AUTH_EMAIL_DOMAIN` | opsional |

5. Deploy.

> Variabel `NEXT_PUBLIC_*` dibaca saat build. Setelah mengubahnya di Vercel,
> lakukan **Redeploy** agar nilai baru ikut ter-inline ke bundle.

### Setelah deploy pertama

- Jalankan seed sekali dari mesin lokal yang menunjuk ke **project Supabase
  produksi** (`npm run db:seed`), atau buat akun lewat Admin API.
- Login sebagai admin, ganti password, lalu periksa **Admin → Pengaturan**.
- Coba alur siswa: login `6001`, buka Latihan, kerjakan 1 soal, submit, lihat
  hasil. Data harus tetap ada setelah halaman di-refresh.
- Di Vercel, aktifkan **Deployment Protection** bila aplikasi belum siap publik.

## 6. Cara kerja integrasi

- `lib/supabase/config.ts` mendeteksi apakah ketiga env tersedia.
- Bila tersedia:
  - login/logout/ganti password memakai **Supabase Auth**;
  - `middleware.ts` me-refresh cookie sesi;
  - repository di `lib/data/*` memuat data ke store in-memory dengan TTL
    singkat lalu menulis perubahan (write-through) ke Supabase melalui
    `lib/supabase/store-sync.ts`.
- Bila tidak tersedia, aplikasi memakai data demo in-memory seperti sebelumnya.

Store in-memory hanyalah cache per instance server. Database tetap menjadi
sumber kebenaran; perubahan dari instance lain terlihat paling lambat ~2 detik.

## 7. Troubleshooting

| Gejala | Penyebab umum |
| --- | --- |
| Login selalu "username/password salah" | Belum menjalankan seed, atau email profil tidak sama dengan email Auth. Jalankan `npm run db:seed`. |
| Halaman error "Supabase belum dikonfigurasi" | Hanya sebagian env terisi. Isi ketiganya atau kosongkan semuanya untuk mode demo. |
| Data kembali seperti awal setelah refresh | `NEXT_PUBLIC_SUPABASE_URL`/key belum terpasang di environment Vercel. |
| `new row violates row-level security policy` | Operasi server tidak memakai service role, atau policy belum dijalankan. |
| Build Vercel gagal saat prerender | Landing page sudah `force-dynamic`; pastikan env produksi terpasang, bukan nilai contoh. |
| Siswa tidak bisa login setelah NIS diubah | Email Auth ikut diperbarui otomatis oleh aplikasi; jika diubah manual di dashboard, samakan `profiles.email` dan email Auth. |

## 8. Checklist produksi

- [ ] `schema.sql` sudah dijalankan.
- [ ] `npm run db:seed` sukses.
- [ ] Tiga env Supabase terpasang di Vercel.
- [ ] `AUTH_SECRET` acak dan tidak sama dengan nilai contoh.
- [ ] Sign up publik dimatikan.
- [ ] Password akun demo sudah diganti.
- [ ] Login siswa, tutor, dan admin diuji di domain produksi.
- [ ] Ekspor CSV dan review jawaban diuji.

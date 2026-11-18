-- =============================================================================
-- TKA Cerdas — Skema PostgreSQL untuk Supabase
-- =============================================================================
-- Jalankan file ini pada SQL Editor Supabase setelah project dibuat.
-- Asumsi: Supabase Auth dipakai untuk login, sehingga tabel `profiles`
-- mereferensikan `auth.users`. Kolom password tidak disimpan di sini.
--
-- Aplikasi memakai `profiles.id` (uuid) = `auth.users.id`. Tabel konten
-- memakai primary key `text` agar ID seed aplikasi (mis. `sub-mat`,
-- `pkg-mat-tryout-1`) dapat dipakai apa adanya oleh seed dan adapter data.
--
-- Jalankan file ini satu kali pada project Supabase baru. File ini idempoten
-- untuk trigger & policy sehingga aman dijalankan ulang.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('STUDENT', 'TUTOR', 'ADMIN');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type question_type as enum ('single_choice', 'multiple_choice', 'true_false_grid', 'short_answer');
  end if;
  if not exists (select 1 from pg_type where typname = 'cognitive_level') then
    create type cognitive_level as enum ('C3', 'C4', 'C5', 'C6');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_status') then
    create type question_status as enum ('DRAFT', 'ACTIVE', 'INACTIVE');
  end if;
  if not exists (select 1 from pg_type where typname = 'package_type') then
    create type package_type as enum ('latihan', 'tryout');
  end if;
  if not exists (select 1 from pg_type where typname = 'package_status') then
    create type package_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'scoring_mode') then
    create type scoring_mode as enum ('all_or_nothing', 'partial');
  end if;
  if not exists (select 1 from pg_type where typname = 'attempt_status') then
    create type attempt_status as enum ('in_progress', 'submitted', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'subject_color') then
    create type subject_color as enum ('indigo', 'rose', 'emerald', 'amber', 'sky');
  end if;
  if not exists (select 1 from pg_type where typname = 'gender') then
    create type gender as enum ('L', 'P');
  end if;
end $$;

-- Untuk database yang sudah pernah menjalankan skema versi sebelumnya.
alter type question_type add value if not exists 'short_answer';

-- ---------------------------------------------------------------------------
-- Utility trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profil pengguna (1:1 dengan auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text unique,
  email text unique,
  role user_role not null default 'STUDENT',
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

-- Setiap user baru di Supabase Auth otomatis mendapat baris `profiles`.
-- Role awal diambil dari app_metadata (diisi seed / admin API); default STUDENT.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    case new.raw_app_meta_data ->> 'role'
      when 'ADMIN' then 'ADMIN'::user_role
      when 'TUTOR' then 'TUTOR'::user_role
      else 'STUDENT'::user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Kelas & siswa
-- ---------------------------------------------------------------------------
create table if not exists classes (
  id text primary key,
  name text not null,
  academic_year text not null,
  tutor_id uuid references profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, academic_year)
);

create table if not exists students (
  id text primary key,
  profile_id uuid not null unique references profiles (id) on delete cascade,
  nis text not null unique,
  class_id text references classes (id) on delete set null,
  school text,
  gender gender,
  parent_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists students_class_idx on students (class_id);

-- ---------------------------------------------------------------------------
-- Kurikulum
-- ---------------------------------------------------------------------------
create table if not exists subjects (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  color subject_color not null default 'indigo',
  icon text not null default 'book-open',
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists topics (
  id text primary key,
  subject_id text not null references subjects (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  unique (subject_id, slug)
);

create index if not exists topics_subject_idx on topics (subject_id);

-- ---------------------------------------------------------------------------
-- Materi belajar
-- ---------------------------------------------------------------------------
create table if not exists materials (
  id text primary key,
  subject_id text not null references subjects (id) on delete cascade,
  topic_id text references topics (id) on delete set null,
  title text not null,
  slug text not null,
  summary text not null default '',
  content text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create index if not exists materials_subject_idx on materials (subject_id);

drop trigger if exists materials_set_updated_at on materials;
create trigger materials_set_updated_at
before update on materials
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Bank soal
-- ---------------------------------------------------------------------------
create table if not exists questions (
  id text primary key,
  subject_id text not null references subjects (id) on delete restrict,
  topic_id text references topics (id) on delete set null,
  type question_type not null default 'single_choice',
  level cognitive_level not null default 'C3',
  stimulus text,
  question text not null,
  indicator text,
  explanation text not null,
  image_url text,
  status question_status not null default 'DRAFT',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_subject_idx on questions (subject_id);
create index if not exists questions_status_idx on questions (status);
create index if not exists questions_created_by_idx on questions (created_by);

drop trigger if exists questions_set_updated_at on questions;
create trigger questions_set_updated_at
before update on questions
for each row execute function set_updated_at();

-- Untuk short_answer, setiap baris question_options yang is_correct = true
-- adalah variasi jawaban yang diterima. Jawaban siswa dibandingkan setelah
-- dinormalisasi (huruf kecil, spasi dirapikan, tanda baca umum diabaikan).
create table if not exists question_options (
  id text primary key,
  question_id text not null references questions (id) on delete cascade,
  option_key text not null,
  content text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  unique (question_id, option_key)
);

create table if not exists question_statements (
  id text primary key,
  question_id text not null references questions (id) on delete cascade,
  content text not null,
  correct_answer boolean not null default false,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Paket latihan / tryout
-- ---------------------------------------------------------------------------
create table if not exists packages (
  id text primary key,
  subject_id text not null references subjects (id) on delete restrict,
  title text not null,
  slug text not null unique,
  type package_type not null default 'latihan',
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  scoring_mode scoring_mode not null default 'all_or_nothing',
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  show_explanation boolean not null default true,
  status package_status not null default 'DRAFT',
  available_from timestamptz,
  available_to timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists packages_subject_idx on packages (subject_id);
create index if not exists packages_status_idx on packages (status);

create table if not exists package_questions (
  package_id text not null references packages (id) on delete cascade,
  question_id text not null references questions (id) on delete restrict,
  sort_order integer not null default 0,
  points integer not null default 1 check (points > 0),
  primary key (package_id, question_id)
);

create table if not exists package_classes (
  package_id text not null references packages (id) on delete cascade,
  class_id text not null references classes (id) on delete cascade,
  primary key (package_id, class_id)
);

-- ---------------------------------------------------------------------------
-- Attempt ujian
-- ---------------------------------------------------------------------------
create table if not exists attempts (
  id text primary key,
  student_id text not null references students (id) on delete cascade,
  package_id text not null references packages (id) on delete restrict,
  status attempt_status not null default 'in_progress',
  scoring_mode scoring_mode not null default 'all_or_nothing',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  score integer,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  unanswered_count integer not null default 0,
  question_order text[] not null default '{}',
  option_order jsonb not null default '{}'::jsonb,
  last_question_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists attempts_student_idx on attempts (student_id);
create index if not exists attempts_package_idx on attempts (package_id);
create index if not exists attempts_status_idx on attempts (status);

-- Satu attempt berjalan per siswa per paket, mencegah duplikasi saat dua
-- permintaan "Mulai" masuk bersamaan dari instance server yang berbeda.
create unique index if not exists attempts_one_active_idx
  on attempts (student_id, package_id)
  where status = 'in_progress';

create table if not exists attempt_answers (
  attempt_id text not null references attempts (id) on delete cascade,
  question_id text not null,
  answer jsonb,
  is_correct boolean,
  points_awarded numeric,
  -- Snapshot soal + kunci saat ujian dimulai. Wajib agar hasil lama tidak berubah.
  snapshot jsonb not null,
  is_flagged boolean not null default false,
  answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

drop trigger if exists attempt_answers_set_updated_at on attempt_answers;
create trigger attempt_answers_set_updated_at
before update on attempt_answers
for each row execute function set_updated_at();

create table if not exists attempt_events (
  id text primary key,
  attempt_id text not null references attempts (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);

create index if not exists attempt_events_attempt_idx on attempt_events (attempt_id);

-- ---------------------------------------------------------------------------
-- Pengaturan aplikasi (key-value)
-- ---------------------------------------------------------------------------
create table if not exists app_settings (
  key text primary key,
  value text not null default ''
);

-- ---------------------------------------------------------------------------
-- Helper RLS
-- ---------------------------------------------------------------------------
create or replace function current_app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_app_role() = 'ADMIN', false);
$$;

create or replace function is_tutor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_app_role() = 'TUTOR', false);
$$;

create or replace function current_student_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from students where profile_id = auth.uid();
$$;

create or replace function current_student_class()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select class_id from students where profile_id = auth.uid();
$$;

create or replace function tutor_has_student(target_student text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from students s
    join classes c on c.id = s.class_id
    where s.id = target_student
      and c.tutor_id = auth.uid()
  );
$$;

create or replace function tutor_owns_class(target_class text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from classes c
    where c.id = target_class and c.tutor_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Hapus policy lama agar file aman dijalankan ulang.
do $$
declare item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'classes', 'students', 'subjects', 'topics', 'materials',
        'questions', 'question_options', 'question_statements', 'packages',
        'package_questions', 'package_classes', 'attempts', 'attempt_answers',
        'attempt_events', 'app_settings'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      item.policyname, item.schemaname, item.tablename
    );
  end loop;
end $$;

alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table subjects enable row level security;
alter table topics enable row level security;
alter table materials enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table question_statements enable row level security;
alter table packages enable row level security;
alter table package_questions enable row level security;
alter table package_classes enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;
alter table attempt_events enable row level security;
alter table app_settings enable row level security;

-- Profil: pemilik dapat membaca profilnya; admin bebas.
-- Perubahan profil (termasuk role) dilakukan lewat server/admin agar pengguna
-- tidak dapat menaikkan hak aksesnya sendiri.
create policy profiles_select_own on profiles
  for select using (id = auth.uid() or is_admin());

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- Kelas: tutor melihat kelasnya; siswa melihat kelasnya; admin bebas.
create policy classes_select on classes
  for select using (is_admin() or tutor_id = auth.uid() or id = current_student_class());

create policy classes_admin_write on classes
  for all using (is_admin()) with check (is_admin());

-- Siswa: siswa melihat dirinya; tutor melihat siswa kelasnya; admin bebas.
create policy students_select on students
  for select using (
    is_admin()
    or profile_id = auth.uid()
    or (is_tutor() and tutor_owns_class(class_id))
  );

create policy students_admin_write on students
  for all using (is_admin()) with check (is_admin());

-- Kurikulum & bank soal: dapat dibaca pengguna login; penulisan oleh admin.
-- Tutor boleh menambah soal (status DRAFT) dan mengubah soalnya sendiri.
create policy subjects_select on subjects
  for select using (auth.uid() is not null or is_active);

create policy subjects_admin_write on subjects
  for all using (is_admin()) with check (is_admin());

create policy topics_select on topics
  for select using (auth.uid() is not null);

create policy topics_admin_write on topics
  for all using (is_admin()) with check (is_admin());

-- Materi: dapat dibaca pengguna login; hanya admin yang menulis.
create policy materials_select on materials
  for select using (auth.uid() is not null);

create policy materials_admin_write on materials
  for all using (is_admin()) with check (is_admin());

create policy questions_select on questions
  for select using (is_admin() or status = 'ACTIVE' or created_by = auth.uid());

create policy questions_tutor_insert on questions
  for insert with check (is_tutor() and created_by = auth.uid() and status = 'DRAFT');

create policy questions_tutor_update on questions
  for update using (is_tutor() and created_by = auth.uid())
  with check (is_tutor() and created_by = auth.uid() and status = 'DRAFT');

create policy questions_admin_write on questions
  for all using (is_admin()) with check (is_admin());

create policy question_options_select on question_options
  for select using (
    exists (
      select 1 from questions q
      where q.id = question_options.question_id
        and (is_admin() or q.status = 'ACTIVE' or q.created_by = auth.uid())
    )
  );

create policy question_options_author_write on question_options
  for all using (
    exists (
      select 1 from questions q
      where q.id = question_options.question_id
        and (is_admin() or (is_tutor() and q.created_by = auth.uid()))
    )
  ) with check (
    exists (
      select 1 from questions q
      where q.id = question_options.question_id
        and (is_admin() or (is_tutor() and q.created_by = auth.uid()))
    )
  );

create policy question_statements_select on question_statements
  for select using (
    exists (
      select 1 from questions q
      where q.id = question_statements.question_id
        and (is_admin() or q.status = 'ACTIVE' or q.created_by = auth.uid())
    )
  );

create policy question_statements_author_write on question_statements
  for all using (
    exists (
      select 1 from questions q
      where q.id = question_statements.question_id
        and (is_admin() or (is_tutor() and q.created_by = auth.uid()))
    )
  ) with check (
    exists (
      select 1 from questions q
      where q.id = question_statements.question_id
        and (is_admin() or (is_tutor() and q.created_by = auth.uid()))
    )
  );

-- Paket: siswa hanya paket terbit sesuai kelas & jadwal; admin bebas.
create policy packages_select on packages
  for select using (
    is_admin()
    or (
      status = 'PUBLISHED'
      and (available_from is null or available_from <= now())
      and (available_to is null or available_to >= now())
      and (
        not exists (select 1 from package_classes pc where pc.package_id = packages.id)
        or exists (
          select 1 from package_classes pc
          where pc.package_id = packages.id
            and pc.class_id = current_student_class()
        )
        or exists (
          select 1 from package_classes pc
          join classes c on c.id = pc.class_id
          where pc.package_id = packages.id and c.tutor_id = auth.uid()
        )
      )
    )
  );

create policy packages_admin_write on packages
  for all using (is_admin()) with check (is_admin());

create policy package_questions_select on package_questions
  for select using (true);

create policy package_questions_admin_write on package_questions
  for all using (is_admin()) with check (is_admin());

create policy package_classes_select on package_classes
  for select using (true);

create policy package_classes_admin_write on package_classes
  for all using (is_admin()) with check (is_admin());

-- Attempt: siswa hanya dapat membaca miliknya; tutor attempt siswa kelasnya;
-- admin bebas. Semua mutasi attempt (mulai, autosave, submit) dilakukan server
-- memakai Supabase service role, sehingga timer & penilaian tidak dapat dipalsukan
-- dari browser. Service role melewati RLS.
create policy attempts_select on attempts
  for select using (
    is_admin()
    or student_id = current_student_id()
    or (is_tutor() and tutor_has_student(student_id))
  );

create policy attempts_admin_write on attempts
  for all using (is_admin()) with check (is_admin());

create policy attempt_answers_select on attempt_answers
  for select using (
    exists (
      select 1 from attempts a
      where a.id = attempt_answers.attempt_id
        and (
          is_admin()
          or a.student_id = current_student_id()
          or (is_tutor() and tutor_has_student(a.student_id))
        )
    )
  );

create policy attempt_answers_admin_write on attempt_answers
  for all using (is_admin()) with check (is_admin());

create policy attempt_events_select on attempt_events
  for select using (
    exists (
      select 1 from attempts a
      where a.id = attempt_events.attempt_id
        and (
          is_admin()
          or a.student_id = current_student_id()
          or (is_tutor() and tutor_has_student(a.student_id))
        )
    )
  );

-- Pengaturan: semua pengguna dapat membaca; hanya admin yang mengubah.
create policy app_settings_select on app_settings
  for select using (true);

create policy app_settings_admin_write on app_settings
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Catatan operasional
-- ---------------------------------------------------------------------------
-- 1. Kunci jawaban (question_options.is_correct, snapshot) TIDAK boleh dikirim ke
--    browser sebelum attempt selesai. Gunakan server action/route handler dengan
--    Supabase service role untuk membuat payload ujian tanpa kunci.
-- 2. Timer dihitung di server: expires_at = started_at + durasi paket. Klien
--    hanya menampilkan hitung mundur; submit otomatis tetap divalidasi server.
-- 3. Skema ini menyimpan snapshot soal di attempt_answers agar perubahan bank
--    soal tidak mengubah hasil attempt lama.
-- 4. Untuk pengembangan lokal tanpa Supabase Auth, jalankan aplikasi dengan
--    penyimpanan demo in-memory seperti sekarang.

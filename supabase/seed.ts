/**
 * Seed Supabase untuk TKA Cerdas.
 *
 * Jalankan setelah `supabase/schema.sql` dieksekusi pada SQL Editor:
 *
 *   npm run db:seed
 *
 * Script ini:
 * 1. membuat akun Supabase Auth untuk admin, tutor, dan siswa demo;
 * 2. mengisi profil, kelas, siswa, mapel, topik, materi, bank soal, paket,
 *    attempt contoh, dan pengaturan aplikasi.
 *
 * Aman dijalankan ulang: akun yang sudah ada dipakai kembali (password tidak
 * diubah kecuali SEED_RESET_PASSWORDS=1), dan data konten di-upsert.
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createSeedData } from "../lib/data/seed";
import type { AttemptRecord, UserRecord } from "../lib/data/types";

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  const content = readFileSync(file, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url || !serviceRoleKey) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local"
  );
}

const db: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function check(
  result: { error: { message: string } | null },
  label: string
) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
}

function passwordFor(user: UserRecord) {
  if (user.role === "ADMIN") {
    return process.env.SEED_ADMIN_PASSWORD || "admin123";
  }
  if (user.role === "TUTOR") {
    return process.env.SEED_TUTOR_PASSWORD || "tutor123";
  }
  return process.env.SEED_STUDENT_PASSWORD || "siswa123";
}

async function listAuthUsers() {
  const users: User[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Membaca auth.users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function main() {
  console.log("→ Menyiapkan data seed TKA Cerdas…");
  const data = createSeedData();
  const resetPasswords = process.env.SEED_RESET_PASSWORDS === "1";

  const existing = await listAuthUsers();
  const byEmail = new Map(
    existing
      .filter((user) => Boolean(user.email))
      .map((user) => [user.email!.toLowerCase(), user])
  );

  const userIdMap = new Map<string, string>();
  const credentials: { name: string; login: string; password: string }[] = [];

  for (const user of data.users) {
    const email = (user.email ?? `${user.username}@tkaceras.id`).toLowerCase();
    const password = passwordFor(user);
    let authUser = byEmail.get(email);

    if (!authUser) {
      const { data: created, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: user.name },
        app_metadata: { role: user.role },
      });
      if (error || !created.user) {
        throw new Error(
          `Membuat akun ${user.username}: ${error?.message ?? "unknown error"}`
        );
      }
      authUser = created.user;
      byEmail.set(email, authUser);
    } else if (resetPasswords) {
      const { error } = await db.auth.admin.updateUserById(authUser.id, {
        password,
      });
      if (error) {
        throw new Error(`Reset password ${user.username}: ${error.message}`);
      }
    }

    userIdMap.set(user.id, authUser.id);
    if (user.username) {
      credentials.push({
        name: user.name,
        login: user.username,
        password: resetPasswords || !existing.some((item) => item.id === authUser!.id)
          ? password
          : "(tidak diubah)",
      });
    }
  }

  const profiles = data.users.map((user) => ({
    id: userIdMap.get(user.id)!,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    must_change_password: user.mustChangePassword,
    last_login_at: user.lastLoginAt,
  }));
  check(await db.from("profiles").upsert(profiles, { onConflict: "id" }), "profiles");

  const classes = data.classes.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    academic_year: classroom.academicYear,
    tutor_id: classroom.tutorId ? userIdMap.get(classroom.tutorId) ?? null : null,
    is_active: classroom.isActive,
  }));
  check(await db.from("classes").upsert(classes, { onConflict: "id" }), "classes");

  const students = data.students.map((student) => ({
    id: student.id,
    profile_id: userIdMap.get(student.userId)!,
    nis: student.nis,
    class_id: student.classId,
    school: student.school,
    gender: student.gender,
    parent_phone: student.parentPhone,
    is_active: student.isActive,
  }));
  check(await db.from("students").upsert(students, { onConflict: "id" }), "students");

  check(
    await db.from("subjects").upsert(
      data.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        color: subject.color,
        icon: subject.icon,
        sort_order: subject.sortOrder,
        is_active: subject.isActive,
      })),
      { onConflict: "id" }
    ),
    "subjects"
  );

  check(
    await db.from("topics").upsert(
      data.topics.map((topic) => ({
        id: topic.id,
        subject_id: topic.subjectId,
        name: topic.name,
        slug: topic.slug,
        sort_order: topic.sortOrder,
      })),
      { onConflict: "id" }
    ),
    "topics"
  );

  check(
    await db.from("materials").upsert(
      data.materials.map((material) => ({
        id: material.id,
        subject_id: material.subjectId,
        topic_id: material.topicId,
        title: material.title,
        slug: material.slug,
        summary: material.summary,
        content: material.content,
        sort_order: material.sortOrder,
        updated_at: material.updatedAt,
      })),
      { onConflict: "id" }
    ),
    "materials"
  );

  check(
    await db.from("questions").upsert(
      data.questions.map((question) => ({
        id: question.id,
        subject_id: question.subjectId,
        topic_id: question.topicId,
        type: question.type,
        level: question.level,
        stimulus: question.stimulus,
        question: question.question,
        indicator: question.indicator,
        explanation: question.explanation,
        image_url: question.imageUrl,
        status: question.status,
        created_by: question.createdById
          ? userIdMap.get(question.createdById) ?? null
          : null,
        created_at: question.createdAt,
        updated_at: question.updatedAt,
      })),
      { onConflict: "id" }
    ),
    "questions"
  );

  const questionIds = data.questions.map((question) => question.id);
  if (questionIds.length > 0) {
    check(
      await db.from("question_options").delete().in("question_id", questionIds),
      "question_options (hapus)"
    );
    check(
      await db
        .from("question_statements")
        .delete()
        .in("question_id", questionIds),
      "question_statements (hapus)"
    );
  }

  const options = data.questions.flatMap((question) =>
    question.options.map((option) => ({
      id: option.id,
      question_id: question.id,
      option_key: option.optionKey,
      content: option.content,
      is_correct: option.isCorrect,
      sort_order: option.sortOrder,
    }))
  );
  if (options.length > 0) {
    check(await db.from("question_options").insert(options), "question_options");
  }

  const statements = data.questions.flatMap((question) =>
    question.statements.map((statement) => ({
      id: statement.id,
      question_id: question.id,
      content: statement.content,
      correct_answer: statement.correctAnswer,
      sort_order: statement.sortOrder,
    }))
  );
  if (statements.length > 0) {
    check(
      await db.from("question_statements").insert(statements),
      "question_statements"
    );
  }

  check(
    await db.from("packages").upsert(
      data.packages.map((pkg) => ({
        id: pkg.id,
        subject_id: pkg.subjectId,
        title: pkg.title,
        slug: pkg.slug,
        type: pkg.type,
        description: pkg.description,
        duration_minutes: pkg.durationMinutes,
        max_attempts: pkg.maxAttempts,
        scoring_mode: pkg.scoringMode,
        shuffle_questions: pkg.shuffleQuestions,
        shuffle_options: pkg.shuffleOptions,
        show_explanation: pkg.showExplanation,
        status: pkg.status,
        available_from: pkg.availableFrom,
        available_to: pkg.availableTo,
        created_at: pkg.createdAt,
      })),
      { onConflict: "id" }
    ),
    "packages"
  );

  const packageIds = data.packages.map((pkg) => pkg.id);
  if (packageIds.length > 0) {
    check(
      await db.from("package_questions").delete().in("package_id", packageIds),
      "package_questions (hapus)"
    );
    check(
      await db.from("package_classes").delete().in("package_id", packageIds),
      "package_classes (hapus)"
    );
  }
  const packageQuestions = data.packages.flatMap((pkg) =>
    pkg.questions.map((item) => ({
      package_id: pkg.id,
      question_id: item.questionId,
      sort_order: item.sortOrder,
      points: item.points,
    }))
  );
  if (packageQuestions.length > 0) {
    check(
      await db.from("package_questions").insert(packageQuestions),
      "package_questions"
    );
  }

  const packageClasses = data.packages.flatMap((pkg) =>
    pkg.classIds.map((classId) => ({
      package_id: pkg.id,
      class_id: classId,
    }))
  );
  if (packageClasses.length > 0) {
    check(
      await db.from("package_classes").insert(packageClasses),
      "package_classes"
    );
  }

  check(
    await db.from("attempts").upsert(
      data.attempts.map((attempt: AttemptRecord) => ({
        id: attempt.id,
        student_id: attempt.studentId,
        package_id: attempt.packageId,
        status: attempt.status,
        scoring_mode: attempt.scoringMode,
        started_at: attempt.startedAt,
        expires_at: attempt.expiresAt,
        submitted_at: attempt.submittedAt,
        score: attempt.score,
        correct_count: attempt.correctCount,
        incorrect_count: attempt.incorrectCount,
        unanswered_count: attempt.unansweredCount,
        question_order: attempt.questionOrder,
        option_order: attempt.optionOrder,
        last_question_index: attempt.lastQuestionIndex,
      })),
      { onConflict: "id" }
    ),
    "attempts"
  );

  const attemptIds = data.attempts.map((attempt) => attempt.id);
  if (attemptIds.length > 0) {
    check(
      await db.from("attempt_answers").delete().in("attempt_id", attemptIds),
      "attempt_answers (hapus)"
    );
    check(
      await db.from("attempt_events").delete().in("attempt_id", attemptIds),
      "attempt_events (hapus)"
    );
  }

  const answers = data.attempts.flatMap((attempt) =>
    Object.values(attempt.answers).map((answer) => ({
      attempt_id: attempt.id,
      question_id: answer.questionId,
      answer: answer.answer,
      is_correct: answer.isCorrect,
      points_awarded: answer.pointsAwarded,
      snapshot: answer.snapshot,
      is_flagged: answer.isFlagged,
      answered_at: answer.answeredAt,
      updated_at: answer.updatedAt,
    }))
  );
  if (answers.length > 0) {
    check(await db.from("attempt_answers").insert(answers), "attempt_answers");
  }

  const events = data.attempts.flatMap((attempt) =>
    attempt.events.map((event) => ({
      id: event.id,
      attempt_id: attempt.id,
      type: event.type,
      created_at: event.createdAt,
    }))
  );
  if (events.length > 0) {
    check(await db.from("attempt_events").insert(events), "attempt_events");
  }

  check(
    await db.from("app_settings").upsert(
      Object.entries(data.settings).map(([key, value]) => ({ key, value })),
      { onConflict: "key" }
    ),
    "app_settings"
  );

  console.log("\n✔ Seed selesai.");
  console.log(`  Profil: ${profiles.length}`);
  console.log(`  Siswa: ${students.length}`);
  console.log(`  Soal: ${data.questions.length}`);
  console.log(`  Paket: ${data.packages.length}`);
  console.log(`  Attempt: ${data.attempts.length}`);
  if (credentials.length > 0) {
    console.log("\nAkun demo:");
    for (const item of credentials) {
      console.log(`  ${item.login.padEnd(8)} / ${item.password}  (${item.name})`);
    }
  }
  console.log(
    "\nCatatan: password akun lama tidak diubah. Jalankan dengan SEED_RESET_PASSWORDS=1 untuk mengatur ulang ke password demo.\n"
  );
}

main().catch((error) => {
  console.error(`\n✖ Seed gagal: ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});

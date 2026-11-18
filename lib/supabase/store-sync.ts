import type { AnswerPayload, QuestionSnapshot } from "@/lib/types";
import { getStore } from "@/lib/data/store";
import type {
  AttemptEventRecord,
  AttemptRecord,
  ClassRecord,
  MaterialRecord,
  PackageRecord,
  QuestionRecord,
  StudentRecord,
  SubjectRecord,
  TopicRecord,
  UserRecord,
} from "@/lib/data/types";
import { isSupabaseConfigured } from "./config";
import { getServiceClient } from "./server";

/**
 * Jembatan antara repository in-memory dan database Supabase.
 *
 * Strategi:
 * 1. `ensureStore()` memuat seluruh data aplikasi ke store in-memory dengan
 *    masa berlaku singkat (TTL). Semua fungsi repository melakukan ini di awal,
 *    sehingga kode halaman/komponen tidak perlu diubah menjadi async semua.
 * 2. Setiap mutasi memperbarui store lalu memanggil `save*()` untuk menulis
 *    perubahan ke Supabase (write-through).
 *
 * Mode demo (tanpa env Supabase) tidak menjalankan modul ini sama sekali.
 */

const TTL_MS = 2_000;

let loadedAt = 0;
let inflight: Promise<void> | null = null;

export function isRemoteBackend() {
  return isSupabaseConfigured();
}

export async function ensureStore(force = false): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const now = Date.now();
  if (!force && loadedAt > 0 && now - loadedAt < TTL_MS) return;
  if (inflight) return inflight;

  inflight = loadStore()
    .then(() => {
      loadedAt = Date.now();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidateStore() {
  loadedAt = 0;
}

/* ------------------------------- helpers -------------------------------- */

function assertOk(
  error: { message: string } | null,
  context: string
): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value);
  return result.length ? result : null;
}

function iso(value: unknown, fallback: string | null = null): string | null {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function requiredIso(value: unknown): string {
  return iso(value) ?? new Date(0).toISOString();
}

function bool(value: unknown): boolean {
  return value === true;
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type Row = Record<string, unknown>;

/* -------------------------------- loading -------------------------------- */

/**
 * PostgREST membatasi jumlah baris per permintaan (default 1000), jadi data
 * dimuat bertahap dengan `.range()`. Urutan kolom harus unik agar halaman tidak
 * tumpang tindih saat ada data baru di antara dua permintaan.
 */
const PAGE_SIZE = 1_000;

async function selectAll(
  db: ReturnType<typeof getServiceClient>,
  table: string,
  orderColumns: string[],
  context: string
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = db
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    for (const column of orderColumns) {
      query = query.order(column, { ascending: true });
    }
    const { data, error } = await query;
    assertOk(error, context);
    const batch = (data ?? []) as Row[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

async function loadStore(): Promise<void> {
  const db = getServiceClient();

  const [
    profiles,
    students,
    classes,
    subjects,
    topics,
    materials,
    questions,
    options,
    statements,
    packages,
    packageQuestions,
    packageClasses,
    attemptRows,
    answerRows,
    eventRows,
    settingsRows,
  ] = await Promise.all([
    selectAll(db, "profiles", ["id"], "Memuat profiles"),
    selectAll(db, "students", ["id"], "Memuat students"),
    selectAll(db, "classes", ["id"], "Memuat classes"),
    selectAll(db, "subjects", ["id"], "Memuat subjects"),
    selectAll(db, "topics", ["id"], "Memuat topics"),
    selectAll(db, "materials", ["id"], "Memuat materials"),
    selectAll(db, "questions", ["id"], "Memuat questions"),
    selectAll(db, "question_options", ["id"], "Memuat question_options"),
    selectAll(db, "question_statements", ["id"], "Memuat question_statements"),
    selectAll(db, "packages", ["id"], "Memuat packages"),
    selectAll(
      db,
      "package_questions",
      ["package_id", "question_id"],
      "Memuat package_questions"
    ),
    selectAll(
      db,
      "package_classes",
      ["package_id", "class_id"],
      "Memuat package_classes"
    ),
    selectAll(db, "attempts", ["id"], "Memuat attempts"),
    selectAll(
      db,
      "attempt_answers",
      ["attempt_id", "question_id"],
      "Memuat attempt_answers"
    ),
    selectAll(db, "attempt_events", ["id"], "Memuat attempt_events"),
    selectAll(db, "app_settings", ["key"], "Memuat app_settings"),
  ]);

  const users: UserRecord[] = profiles.map((row) => ({
    id: text(row.id),
    name: text(row.name),
    username: optionalText(row.username),
    email: optionalText(row.email),
    // Password dikelola Supabase Auth, bukan oleh aplikasi.
    passwordHash: "",
    role: text(row.role) as UserRecord["role"],
    isActive: row.is_active !== false,
    mustChangePassword: bool(row.must_change_password),
    lastLoginAt: iso(row.last_login_at),
  }));

  const studentRecords: StudentRecord[] = students.map((row) => ({
    id: text(row.id),
    userId: text(row.profile_id),
    nis: text(row.nis),
    classId: optionalText(row.class_id),
    school: optionalText(row.school),
    gender: (row.gender === "L" || row.gender === "P" ? row.gender : null) as
      | "L"
      | "P"
      | null,
    parentPhone: optionalText(row.parent_phone),
    isActive: row.is_active !== false,
  }));

  const classRecords: ClassRecord[] = classes.map((row) => ({
    id: text(row.id),
    name: text(row.name),
    academicYear: text(row.academic_year),
    tutorId: optionalText(row.tutor_id),
    isActive: row.is_active !== false,
  }));

  const subjectRecords: SubjectRecord[] = subjects
    .map((row) => ({
      id: text(row.id),
      name: text(row.name),
      slug: text(row.slug),
      description: text(row.description),
      color: text(row.color) as SubjectRecord["color"],
      icon: text(row.icon),
      sortOrder: num(row.sort_order),
      isActive: row.is_active !== false,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const topicRecords: TopicRecord[] = topics
    .map((row) => ({
      id: text(row.id),
      subjectId: text(row.subject_id),
      name: text(row.name),
      slug: text(row.slug),
      sortOrder: num(row.sort_order),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const materialRecords: MaterialRecord[] = materials
    .map((row) => ({
      id: text(row.id),
      subjectId: text(row.subject_id),
      topicId: optionalText(row.topic_id),
      title: text(row.title),
      slug: text(row.slug),
      summary: text(row.summary),
      content: text(row.content),
      sortOrder: num(row.sort_order),
      updatedAt: requiredIso(row.updated_at),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const optionsByQuestion = new Map<string, Row[]>();
  for (const row of options) {
    const key = text(row.question_id);
    const list = optionsByQuestion.get(key) ?? [];
    list.push(row);
    optionsByQuestion.set(key, list);
  }
  const statementsByQuestion = new Map<string, Row[]>();
  for (const row of statements) {
    const key = text(row.question_id);
    const list = statementsByQuestion.get(key) ?? [];
    list.push(row);
    statementsByQuestion.set(key, list);
  }

  const questionRecords: QuestionRecord[] = questions
    .map((row) => {
      const id = text(row.id);
      const questionOptions = (optionsByQuestion.get(id) ?? [])
        .slice()
        .sort((a, b) => num(a.sort_order) - num(b.sort_order))
        .map((option) => ({
          id: text(option.id),
          optionKey: text(option.option_key),
          content: text(option.content),
          isCorrect: bool(option.is_correct),
          sortOrder: num(option.sort_order),
        }));
      const questionStatements = (statementsByQuestion.get(id) ?? [])
        .slice()
        .sort((a, b) => num(a.sort_order) - num(b.sort_order))
        .map((statement) => ({
          id: text(statement.id),
          content: text(statement.content),
          correctAnswer: bool(statement.correct_answer),
          sortOrder: num(statement.sort_order),
        }));

      return {
        id,
        subjectId: text(row.subject_id),
        topicId: optionalText(row.topic_id),
        type: text(row.type) as QuestionRecord["type"],
        level: text(row.level) as QuestionRecord["level"],
        stimulus: optionalText(row.stimulus),
        question: text(row.question),
        indicator: optionalText(row.indicator),
        explanation: text(row.explanation),
        imageUrl: optionalText(row.image_url),
        status: text(row.status) as QuestionRecord["status"],
        createdById: optionalText(row.created_by),
        createdAt: requiredIso(row.created_at),
        updatedAt: requiredIso(row.updated_at),
        options: questionOptions,
        statements: questionStatements,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const packageQuestionsByPackage = new Map<string, Row[]>();
  for (const row of packageQuestions) {
    const key = text(row.package_id);
    const list = packageQuestionsByPackage.get(key) ?? [];
    list.push(row);
    packageQuestionsByPackage.set(key, list);
  }
  const packageClassesByPackage = new Map<string, Row[]>();
  for (const row of packageClasses) {
    const key = text(row.package_id);
    const list = packageClassesByPackage.get(key) ?? [];
    list.push(row);
    packageClassesByPackage.set(key, list);
  }

  const packageRecords: PackageRecord[] = packages.map((row) => {
    const id = text(row.id);
    return {
      id,
      subjectId: text(row.subject_id),
      title: text(row.title),
      slug: text(row.slug),
      type: text(row.type) as PackageRecord["type"],
      description: text(row.description),
      durationMinutes: num(row.duration_minutes),
      maxAttempts: optionalNum(row.max_attempts),
      scoringMode: text(row.scoring_mode) as PackageRecord["scoringMode"],
      shuffleQuestions: row.shuffle_questions !== false,
      shuffleOptions: row.shuffle_options !== false,
      showExplanation: row.show_explanation !== false,
      status: text(row.status) as PackageRecord["status"],
      availableFrom: iso(row.available_from),
      availableTo: iso(row.available_to),
      questions: (packageQuestionsByPackage.get(id) ?? [])
        .slice()
        .sort((a, b) => num(a.sort_order) - num(b.sort_order))
        .map((item) => ({
          questionId: text(item.question_id),
          sortOrder: num(item.sort_order),
          points: num(item.points, 1),
        })),
      classIds: (packageClassesByPackage.get(id) ?? []).map((item) =>
        text(item.class_id)
      ),
      createdAt: requiredIso(row.created_at),
    };
  });

  const answersByAttempt = new Map<string, Row[]>();
  for (const row of answerRows) {
    const key = text(row.attempt_id);
    const list = answersByAttempt.get(key) ?? [];
    list.push(row);
    answersByAttempt.set(key, list);
  }
  const eventsByAttempt = new Map<string, AttemptEventRecord[]>();
  for (const row of eventRows) {
    const key = text(row.attempt_id);
    const list = eventsByAttempt.get(key) ?? [];
    list.push({
      id: text(row.id),
      type: text(row.type),
      createdAt: requiredIso(row.created_at),
    });
    eventsByAttempt.set(key, list);
  }

  const attemptRecords: AttemptRecord[] = attemptRows
    .map((row) => {
      const id = text(row.id);
      const answers: AttemptRecord["answers"] = {};
      for (const answer of answersByAttempt.get(id) ?? []) {
        const questionId = text(answer.question_id);
        answers[questionId] = {
          questionId,
          answer: (answer.answer ?? null) as AnswerPayload | null,
          isCorrect:
            answer.is_correct === null || answer.is_correct === undefined
              ? null
              : bool(answer.is_correct),
          pointsAwarded: optionalNum(answer.points_awarded),
          snapshot: answer.snapshot as QuestionSnapshot,
          isFlagged: bool(answer.is_flagged),
          answeredAt: iso(answer.answered_at),
          updatedAt: requiredIso(answer.updated_at),
        };
      }
      return {
        id,
        studentId: text(row.student_id),
        packageId: text(row.package_id),
        status: text(row.status) as AttemptRecord["status"],
        scoringMode: text(row.scoring_mode) as AttemptRecord["scoringMode"],
        startedAt: requiredIso(row.started_at),
        expiresAt: requiredIso(row.expires_at),
        submittedAt: iso(row.submitted_at),
        score: optionalNum(row.score),
        correctCount: num(row.correct_count),
        incorrectCount: num(row.incorrect_count),
        unansweredCount: num(row.unanswered_count),
        questionOrder: Array.isArray(row.question_order)
          ? (row.question_order as unknown[]).map(text)
          : [],
        optionOrder: (row.option_order ?? {}) as Record<string, string[]>,
        lastQuestionIndex: num(row.last_question_index),
        answers,
        events: (eventsByAttempt.get(id) ?? [])
          .slice()
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[text(row.key)] = text(row.value);
  }

  Object.assign(getStore(), {
    users,
    students: studentRecords,
    classes: classRecords,
    subjects: subjectRecords,
    topics: topicRecords,
    materials: materialRecords,
    questions: questionRecords,
    packages: packageRecords,
    attempts: attemptRecords,
    settings,
  } satisfies Partial<ReturnType<typeof getStore>>);
}

/* ------------------------------- persistence ----------------------------- */

export async function saveProfile(user: UserRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient()
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        must_change_password: user.mustChangePassword,
        last_login_at: user.lastLoginAt,
      },
      { onConflict: "id" }
    );
  assertOk(error, "Menyimpan profil");
}

export async function saveStudent(student: StudentRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("students").upsert(
    {
      id: student.id,
      profile_id: student.userId,
      nis: student.nis,
      class_id: student.classId,
      school: student.school,
      gender: student.gender,
      parent_phone: student.parentPhone,
      is_active: student.isActive,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan siswa");
}

export async function saveClass(classroom: ClassRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("classes").upsert(
    {
      id: classroom.id,
      name: classroom.name,
      academic_year: classroom.academicYear,
      tutor_id: classroom.tutorId,
      is_active: classroom.isActive,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan kelas");
}

export async function saveSubject(subject: SubjectRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("subjects").upsert(
    {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      description: subject.description,
      color: subject.color,
      icon: subject.icon,
      sort_order: subject.sortOrder,
      is_active: subject.isActive,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan mata pelajaran");
}

export async function saveTopic(topic: TopicRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("topics").upsert(
    {
      id: topic.id,
      subject_id: topic.subjectId,
      name: topic.name,
      slug: topic.slug,
      sort_order: topic.sortOrder,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan topik");
}

export async function saveMaterial(material: MaterialRecord) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("materials").upsert(
    {
      id: material.id,
      subject_id: material.subjectId,
      topic_id: material.topicId,
      title: material.title,
      slug: material.slug,
      summary: material.summary,
      content: material.content,
      sort_order: material.sortOrder,
      updated_at: material.updatedAt,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan materi");
}

export async function saveQuestion(question: QuestionRecord) {
  if (!isSupabaseConfigured()) return;
  const db = getServiceClient();

  const { error } = await db.from("questions").upsert(
    {
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
      created_by: question.createdById,
      created_at: question.createdAt,
      updated_at: question.updatedAt,
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan soal");

  const { error: optionDeleteError } = await db
    .from("question_options")
    .delete()
    .eq("question_id", question.id);
  assertOk(optionDeleteError, "Menyegarkan opsi soal");
  if (question.options.length > 0) {
    const { error: optionError } = await db.from("question_options").insert(
      question.options.map((option) => ({
        id: option.id,
        question_id: question.id,
        option_key: option.optionKey,
        content: option.content,
        is_correct: option.isCorrect,
        sort_order: option.sortOrder,
      }))
    );
    assertOk(optionError, "Menyimpan opsi soal");
  }

  const { error: statementDeleteError } = await db
    .from("question_statements")
    .delete()
    .eq("question_id", question.id);
  assertOk(statementDeleteError, "Menyegarkan pernyataan soal");
  if (question.statements.length > 0) {
    const { error: statementError } = await db.from("question_statements").insert(
      question.statements.map((statement) => ({
        id: statement.id,
        question_id: question.id,
        content: statement.content,
        correct_answer: statement.correctAnswer,
        sort_order: statement.sortOrder,
      }))
    );
    assertOk(statementError, "Menyimpan pernyataan soal");
  }
}

export async function savePackage(pkg: PackageRecord) {
  if (!isSupabaseConfigured()) return;
  const db = getServiceClient();

  const { error } = await db.from("packages").upsert(
    {
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
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan paket");

  const { error: questionDeleteError } = await db
    .from("package_questions")
    .delete()
    .eq("package_id", pkg.id);
  assertOk(questionDeleteError, "Menyegarkan soal paket");
  if (pkg.questions.length > 0) {
    const { error: questionError } = await db.from("package_questions").insert(
      pkg.questions.map((item) => ({
        package_id: pkg.id,
        question_id: item.questionId,
        sort_order: item.sortOrder,
        points: item.points,
      }))
    );
    assertOk(questionError, "Menyimpan soal paket");
  }

  const { error: classDeleteError } = await db
    .from("package_classes")
    .delete()
    .eq("package_id", pkg.id);
  assertOk(classDeleteError, "Menyegarkan kelas paket");
  if (pkg.classIds.length > 0) {
    const { error: classError } = await db.from("package_classes").insert(
      pkg.classIds.map((classId) => ({
        package_id: pkg.id,
        class_id: classId,
      }))
    );
    assertOk(classError, "Menyimpan kelas paket");
  }
}

export async function saveSettings(settings: Record<string, string>) {
  if (!isSupabaseConfigured()) return;
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return;
  const { error } = await getServiceClient()
    .from("app_settings")
    .upsert(rows, { onConflict: "key" });
  assertOk(error, "Menyimpan pengaturan");
}

export async function saveAttempt(attempt: AttemptRecord) {
  if (!isSupabaseConfigured()) return;
  await saveAttemptRow(attempt);

  const answers = Object.values(attempt.answers);
  if (answers.length === 0) return;
  await saveAnswerRows(attempt.id, answers);
}

/** Menyimpan satu jawaban saat autosave tanpa menimpa jawaban soal lain. */
export async function saveAttemptProgress(
  attempt: AttemptRecord,
  questionId: string
) {
  if (!isSupabaseConfigured()) return;
  const db = getServiceClient();
  const answer = attempt.answers[questionId];

  const { error } = await db
    .from("attempts")
    .update({ last_question_index: attempt.lastQuestionIndex })
    .eq("id", attempt.id);
  assertOk(error, "Menyimpan posisi soal");

  if (!answer) return;

  // Hanya kolom jawaban yang diperbarui. Kolom penilaian (is_correct,
  // points_awarded) dan snapshot tidak disentuh agar autosave yang terlambat
  // tidak menghapus hasil penilaian saat submit.
  const { error: answerError } = await db
    .from("attempt_answers")
    .update({
      answer: answer.answer,
      is_flagged: answer.isFlagged,
      answered_at: answer.answeredAt,
      updated_at: answer.updatedAt,
    })
    .eq("attempt_id", attempt.id)
    .eq("question_id", answer.questionId);
  assertOk(answerError, "Menyimpan jawaban ujian");
}

async function saveAttemptRow(attempt: AttemptRecord) {
  const { error } = await getServiceClient().from("attempts").upsert(
    {
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
    },
    { onConflict: "id" }
  );
  assertOk(error, "Menyimpan ujian");
}

async function saveAnswerRows(
  attemptId: string,
  answers: AttemptRecord["answers"][string][]
) {
  const { error } = await getServiceClient().from("attempt_answers").upsert(
    answers.map((answer) => ({
      attempt_id: attemptId,
      question_id: answer.questionId,
      answer: answer.answer,
      is_correct: answer.isCorrect,
      points_awarded: answer.pointsAwarded,
      snapshot: answer.snapshot,
      is_flagged: answer.isFlagged,
      answered_at: answer.answeredAt,
      updated_at: answer.updatedAt,
    })),
    { onConflict: "attempt_id,question_id" }
  );
  assertOk(error, "Menyimpan jawaban ujian");
}

export async function appendAttemptEvent(
  attemptId: string,
  event: AttemptEventRecord
) {
  if (!isSupabaseConfigured()) return;
  const { error } = await getServiceClient().from("attempt_events").insert({
    id: event.id,
    attempt_id: attemptId,
    type: event.type,
    created_at: event.createdAt,
  });
  assertOk(error, "Menyimpan aktivitas ujian");
}

import { randomUUID } from "node:crypto";
import type {
  AnswerPayload,
  AttemptResult,
  PublicAttemptPayload,
  QuestionSnapshot,
} from "@/lib/types";
import { gradeAttempt } from "@/lib/scoring";
import { sanitizeEssayText } from "@/lib/essay";
import { shuffle } from "@/lib/utils";
import { packageAvailability } from "./catalog";
import { createSnapshot, toPublicQuestion } from "./snapshots";
import { getStore } from "./store";
import {
  appendAttemptEvent,
  ensureStore,
  saveAttempt,
  saveAttemptProgress,
} from "@/lib/supabase/store-sync";
import type {
  AttemptRecord,
  AttemptWithContext,
  PackageRecord,
  QuestionRecord,
  SubjectRecord,
} from "./types";

export interface AttemptSummary {
  attempt: AttemptRecord;
  package: PackageRecord;
  subject: SubjectRecord;
  studentName: string;
  studentNis: string;
  className: string | null;
}

export interface ReviewItem {
  index: number;
  snapshot: QuestionSnapshot;
  answer: AnswerPayload | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  isFlagged: boolean;
}

const GRACE_MS = 30_000;

export function getAttemptRaw(id: string) {
  return getStore().attempts.find((attempt) => attempt.id === id);
}

function packagePoints(pkg: PackageRecord, questionId: string) {
  return pkg.questions.find((item) => item.questionId === questionId)?.points ?? 1;
}

function finalizeAttempt(attempt: AttemptRecord, auto: boolean) {
  const store = getStore();
  const pkg = store.packages.find((item) => item.id === attempt.packageId);
  if (!pkg) throw new Error("Paket ujian tidak ditemukan.");

  const questions = attempt.questionOrder.map((questionId) => {
    const answer = attempt.answers[questionId];
    return {
      question: answer.snapshot,
      points: packagePoints(pkg, questionId),
    };
  });

  const answers = Object.fromEntries(
    attempt.questionOrder.map((questionId) => [
      questionId,
      attempt.answers[questionId]?.answer ?? null,
    ])
  );

  const ledger = gradeAttempt(questions, answers, attempt.scoringMode);

  attempt.status = auto ? "expired" : "submitted";
  attempt.submittedAt = new Date().toISOString();
  attempt.score = ledger.score;
  attempt.correctCount = ledger.correctCount;
  attempt.incorrectCount = ledger.incorrectCount;
  attempt.unansweredCount = ledger.unansweredCount;

  for (const item of ledger.items) {
    const record = attempt.answers[item.questionId];
    if (!record) continue;
    record.isCorrect = item.isCorrect;
    record.pointsAwarded = item.pointsAwarded;
  }

  return attempt;
}

/** Tutup attempt yang sudah melewati batas waktu (pengganti cron di mode demo). */
export async function closeExpiredAttempts() {
  await ensureStore();
  const now = Date.now();
  let count = 0;
  for (const attempt of getStore().attempts) {
    if (
      attempt.status === "in_progress" &&
      new Date(attempt.expiresAt).getTime() < now
    ) {
      finalizeAttempt(attempt, true);
      await saveAttempt(attempt);
      count += 1;
    }
  }
  return count;
}

export async function submitAttempt(attemptId: string, studentId: string) {
  await ensureStore();
  await closeExpiredAttempts();
  const attempt = getAttemptRaw(attemptId);
  if (!attempt) throw new Error("Ujian tidak ditemukan.");
  if (attempt.studentId !== studentId)
    throw new Error("Kamu tidak berhak mengakses ujian ini.");
  if (attempt.status !== "in_progress") return attempt;
  finalizeAttempt(attempt, false);
  await saveAttempt(attempt);
  return attempt;
}

export async function startAttempt(
  studentId: string,
  packageId: string
): Promise<AttemptRecord> {
  await ensureStore();
  await closeExpiredAttempts();
  const store = getStore();
  const student = store.students.find((item) => item.id === studentId);
  if (!student) throw new Error("Data siswa tidak ditemukan.");
  const pkg = store.packages.find((item) => item.id === packageId);
  if (!pkg) throw new Error("Paket tidak ditemukan.");

  const existing = store.attempts.find(
    (attempt) =>
      attempt.studentId === studentId &&
      attempt.packageId === packageId &&
      attempt.status === "in_progress"
  );
  if (existing) return existing;

  const availability = packageAvailability(pkg);
  if (!availability.open) throw new Error(availability.reason ?? "Paket tidak tersedia.");
  if (pkg.classIds.length > 0 && (!student.classId || !pkg.classIds.includes(student.classId)))
    throw new Error("Paket ini tidak ditugaskan untuk kelasmu.");

  const usedAttempts = store.attempts.filter(
    (attempt) =>
      attempt.studentId === studentId &&
      attempt.packageId === packageId &&
      attempt.status !== "in_progress"
  ).length;
  if (pkg.maxAttempts !== null && usedAttempts >= pkg.maxAttempts)
    throw new Error(
      `Batas percobaan untuk paket ini sudah tercapai (${pkg.maxAttempts} kali).`
    );

  const selected: { question: QuestionRecord; points: number }[] = [];
  for (const item of pkg.questions
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)) {
    const question = store.questions.find((q) => q.id === item.questionId);
    if (question && question.status === "ACTIVE") {
      selected.push({ question, points: item.points });
    }
  }

  if (selected.length === 0)
    throw new Error("Paket ini belum memiliki soal aktif.");

  const ordered = pkg.shuffleQuestions ? shuffle(selected) : selected;
  const now = new Date();
  const attemptId = `at-${randomUUID()}`;
  const answers: AttemptRecord["answers"] = {};
  const optionOrder: Record<string, string[]> = {};

  for (const item of ordered) {
    const topic = store.topics.find((t) => t.id === item.question.topicId);
    const snapshot = createSnapshot(item.question, topic?.name ?? null);
    const optionIds = item.question.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) => option.id);
    optionOrder[item.question.id] = pkg.shuffleOptions
      ? shuffle(optionIds)
      : optionIds;
    answers[item.question.id] = {
      questionId: item.question.id,
      answer: null,
      isCorrect: null,
      pointsAwarded: null,
      snapshot,
      isFlagged: false,
      answeredAt: null,
      updatedAt: now.toISOString(),
    };
  }

  const attempt: AttemptRecord = {
    id: attemptId,
    studentId,
    packageId,
    status: "in_progress",
    scoringMode: pkg.scoringMode,
    startedAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + pkg.durationMinutes * 60_000
    ).toISOString(),
    submittedAt: null,
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    questionOrder: ordered.map((item) => item.question.id),
    optionOrder,
    lastQuestionIndex: 0,
    answers,
    events: [],
  };

  store.attempts.push(attempt);
  try {
    await saveAttempt(attempt);
  } catch (error) {
    // Dua permintaan "Mulai" bisa berjalan di instance berbeda. Unique index
    // `attempts_one_active_idx` menolak yang kalah; pakai attempt yang menang.
    const message = error instanceof Error ? error.message : "";
    if (/duplicate key|unique constraint|attempts_one_active_idx/i.test(message)) {
      store.attempts = store.attempts.filter((item) => item.id !== attempt.id);
      await ensureStore(true);
      const active = getStore().attempts.find(
        (item) =>
          item.studentId === studentId &&
          item.packageId === packageId &&
          item.status === "in_progress"
      );
      if (active) return active;
    }
    throw error;
  }
  return attempt;
}

function sanitizeAnswer(
  snapshot: QuestionSnapshot,
  answer: AnswerPayload | null | undefined
): AnswerPayload | null {
  if (!answer) return null;

  if (snapshot.type === "single_choice") {
    const selected =
      typeof answer.selected === "string" ? answer.selected : null;
    return selected && snapshot.options.some((option) => option.id === selected)
      ? { selected }
      : null;
  }

  if (snapshot.type === "multiple_choice") {
    const selected = Array.isArray(answer.selected) ? answer.selected : [];
    const valid = new Set(snapshot.options.map((option) => option.id));
    const clean = [...new Set(selected.filter((id) => valid.has(id)))];
    return clean.length ? { selected: clean } : null;
  }

  if (snapshot.type === "short_answer") {
    const text =
      typeof answer.text === "string" ? sanitizeEssayText(answer.text) : "";
    return text ? { text } : null;
  }

  const statements = answer.statements ?? {};
  const validStatements = new Set(
    snapshot.statements.map((statement) => statement.id)
  );
  const clean = Object.fromEntries(
    Object.entries(statements).filter(
      ([id, value]) => validStatements.has(id) && typeof value === "boolean"
    )
  ) as Record<string, boolean>;
  return Object.keys(clean).length ? { statements: clean } : null;
}

export async function saveAttemptAnswer(input: {
  attemptId: string;
  studentId: string;
  questionId: string;
  answer?: AnswerPayload | null;
  isFlagged?: boolean;
  lastQuestionIndex?: number;
}) {
  await ensureStore();
  const attempt = getAttemptRaw(input.attemptId);
  if (!attempt) throw new Error("Ujian tidak ditemukan.");
  if (attempt.studentId !== input.studentId)
    throw new Error("Kamu tidak berhak mengakses ujian ini.");
  if (attempt.status !== "in_progress")
    throw new Error("Ujian sudah dikumpulkan.");

  if (new Date(attempt.expiresAt).getTime() + GRACE_MS < Date.now()) {
    finalizeAttempt(attempt, true);
    await saveAttempt(attempt);
    return { saved: false as const, expired: true as const, serverTime: new Date().toISOString() };
  }

  const record = attempt.answers[input.questionId];
  if (!record) throw new Error("Soal tidak ditemukan pada attempt ini.");

  if (input.answer !== undefined) {
    const clean = sanitizeAnswer(record.snapshot, input.answer);
    record.answer = clean;
    record.answeredAt = clean ? new Date().toISOString() : null;
  }
  if (input.isFlagged !== undefined) record.isFlagged = Boolean(input.isFlagged);
  record.updatedAt = new Date().toISOString();

  if (input.lastQuestionIndex !== undefined) {
    attempt.lastQuestionIndex = Math.max(0, input.lastQuestionIndex);
  }

  await saveAttemptProgress(attempt, input.questionId);
  return {
    saved: true as const,
    expired: false as const,
    serverTime: new Date().toISOString(),
  };
}

export async function logAttemptEvent(
  attemptId: string,
  studentId: string,
  type: string
) {
  await ensureStore();
  const attempt = getAttemptRaw(attemptId);
  if (!attempt || attempt.studentId !== studentId) return false;
  if (attempt.status !== "in_progress") return false;
  const event = {
    id: `ev-${randomUUID()}`,
    type,
    createdAt: new Date().toISOString(),
  };
  attempt.events.push(event);
  await appendAttemptEvent(attemptId, event);
  return true;
}

export async function getAttemptContext(
  attemptId: string
): Promise<AttemptWithContext | null> {
  await ensureStore();
  await closeExpiredAttempts();
  const store = getStore();
  const attempt = getAttemptRaw(attemptId);
  if (!attempt) return null;
  const student = store.students.find((item) => item.id === attempt.studentId);
  if (!student) return null;
  const studentUser = store.users.find((item) => item.id === student.userId);
  const pkg = store.packages.find((item) => item.id === attempt.packageId);
  if (!studentUser || !pkg) return null;
  const subject = store.subjects.find((item) => item.id === pkg.subjectId);
  if (!subject) return null;
  const classroom = store.classes.find((item) => item.id === student.classId);

  return {
    attempt,
    student,
    studentUser,
    package: pkg,
    subject,
    className: classroom?.name ?? null,
  };
}

export function summarise(attempt: AttemptRecord): AttemptSummary | null {
  const store = getStore();
  const pkg = store.packages.find((item) => item.id === attempt.packageId);
  const student = store.students.find((item) => item.id === attempt.studentId);
  const user = student
    ? store.users.find((item) => item.id === student.userId)
    : null;
  const subject = pkg
    ? store.subjects.find((item) => item.id === pkg.subjectId)
    : null;
  const classroom = student
    ? store.classes.find((item) => item.id === student.classId)
    : null;
  if (!pkg || !student || !user || !subject) return null;

  return {
    attempt,
    package: pkg,
    subject,
    studentName: user.name,
    studentNis: student.nis,
    className: classroom?.name ?? null,
  };
}

export async function listAttemptsForStudent(studentId: string) {
  await ensureStore();
  await closeExpiredAttempts();
  return getStore()
    .attempts.filter((attempt) => attempt.studentId === studentId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map(summarise)
    .filter((item): item is AttemptSummary => Boolean(item));
}

export async function listAttempts(filter?: {
  studentId?: string;
  classId?: string;
  packageId?: string;
  subjectId?: string;
  status?: AttemptRecord["status"] | "ALL";
  search?: string;
  limit?: number;
}): Promise<AttemptSummary[]> {
  await ensureStore();
  await closeExpiredAttempts();
  const store = getStore();
  const search = filter?.search?.trim().toLowerCase();
  const classStudentIds = filter?.classId
    ? new Set(
        store.students
          .filter((student) => student.classId === filter.classId)
          .map((student) => student.id)
      )
    : null;

  return store.attempts
    .filter((attempt) => {
      if (filter?.studentId && attempt.studentId !== filter.studentId)
        return false;
      if (classStudentIds && !classStudentIds.has(attempt.studentId)) return false;
      if (filter?.packageId && attempt.packageId !== filter.packageId) return false;
      if (filter?.status && filter.status !== "ALL" && attempt.status !== filter.status)
        return false;
      const pkg = store.packages.find((item) => item.id === attempt.packageId);
      if (filter?.subjectId && pkg?.subjectId !== filter.subjectId) return false;
      if (search) {
        const student = store.students.find((item) => item.id === attempt.studentId);
        const user = student
          ? store.users.find((item) => item.id === student.userId)
          : null;
        const haystack = `${user?.name ?? ""} ${student?.nis ?? ""} ${
          pkg?.title ?? ""
        }`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, filter?.limit ?? 500)
    .map(summarise)
    .filter((item): item is AttemptSummary => Boolean(item));
}

export async function getAttemptCount(studentId: string, packageId: string) {
  await ensureStore();
  return getStore().attempts.filter(
    (attempt) =>
      attempt.studentId === studentId && attempt.packageId === packageId
  ).length;
}

export async function getActiveAttempt(studentId: string, packageId: string) {
  await ensureStore();
  await closeExpiredAttempts();
  return getStore().attempts.find(
    (attempt) =>
      attempt.studentId === studentId &&
      attempt.packageId === packageId &&
      attempt.status === "in_progress"
  );
}

export function getAttemptLedger(attempt: AttemptRecord) {
  const store = getStore();
  const pkg = store.packages.find((item) => item.id === attempt.packageId);
  if (!pkg) return null;
  const questions = attempt.questionOrder.map((questionId) => ({
    question: attempt.answers[questionId].snapshot,
    points: packagePoints(pkg, questionId),
  }));
  const answers = Object.fromEntries(
    attempt.questionOrder.map((questionId) => [
      questionId,
      attempt.answers[questionId]?.answer ?? null,
    ])
  );
  return gradeAttempt(questions, answers, attempt.scoringMode);
}

export function getAttemptResult(attempt: AttemptRecord): AttemptResult | null {
  const ledger = getAttemptLedger(attempt);
  if (!ledger) return null;
  return {
    score: attempt.score ?? ledger.score,
    correctCount: attempt.correctCount,
    incorrectCount: attempt.incorrectCount,
    unansweredCount: attempt.unansweredCount,
    totalQuestions: ledger.totalQuestions,
    topics: ledger.topics,
    levels: ledger.levels,
  };
}

export function getAttemptReview(attempt: AttemptRecord): ReviewItem[] {
  return attempt.questionOrder.map((questionId, index) => {
    const answer = attempt.answers[questionId];
    return {
      index: index + 1,
      snapshot: answer.snapshot,
      answer: answer.answer,
      isCorrect: answer.isCorrect,
      pointsAwarded: answer.pointsAwarded,
      isFlagged: answer.isFlagged,
    };
  });
}

/** Payload attempt untuk browser: tanpa kunci jawaban & pembahasan. */
export function toPublicAttemptPayload(
  context: AttemptWithContext
): PublicAttemptPayload {
  const { attempt, package: pkg, subject } = context;

  const questions = attempt.questionOrder.map((questionId) => {
    const snapshot = attempt.answers[questionId].snapshot;
    const base = toPublicQuestion(snapshot);
    const order = attempt.optionOrder[questionId] ?? [];
    const orderedOptions = order
      .map((id) => base.options.find((option) => option.id === id))
      .filter((option): option is (typeof base.options)[number] => Boolean(option));
    return {
      ...base,
      options:
        orderedOptions.length === base.options.length
          ? orderedOptions
          : base.options,
    };
  });

  const answers = Object.fromEntries(
    attempt.questionOrder.map((questionId) => [
      questionId,
      {
        answer: attempt.answers[questionId]?.answer ?? null,
        isFlagged: Boolean(attempt.answers[questionId]?.isFlagged),
      },
    ])
  );

  return {
    id: attempt.id,
    status: attempt.status,
    packageTitle: pkg.title,
    packageType: pkg.type,
    subjectName: subject.name,
    durationMinutes: pkg.durationMinutes,
    showExplanation: pkg.showExplanation,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    serverTime: new Date().toISOString(),
    lastQuestionIndex: attempt.lastQuestionIndex,
    questions,
    answers,
  };
}

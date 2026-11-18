import { randomUUID } from "node:crypto";
import type {
  CognitiveLevel,
  QuestionStatus,
  QuestionType,
} from "@/lib/types";
import { countWords, ESSAY_MAX_WORDS, hasForbiddenEssaySymbols } from "@/lib/essay";
import { getStore } from "./store";
import { ensureStore, saveQuestion } from "@/lib/supabase/store-sync";
import type {
  QuestionRecord,
  SubjectRecord,
  TopicRecord,
  UserRecord,
} from "./types";

export interface QuestionView extends QuestionRecord {
  subject: SubjectRecord;
  topic: TopicRecord | null;
  author: UserRecord | null;
}

export interface QuestionInput {
  subjectId: string;
  topicId: string | null;
  type: QuestionType;
  level: CognitiveLevel;
  stimulus: string | null;
  question: string;
  indicator: string | null;
  explanation: string;
  status: QuestionStatus;
  options: { content: string; isCorrect: boolean }[];
  statements: { content: string; correctAnswer: boolean }[];
}

export function validateQuestionInput(input: QuestionInput) {
  if (!input.question.trim()) return "Pertanyaan wajib diisi.";
  if (!input.explanation.trim()) return "Pembahasan wajib diisi.";
  if (!input.subjectId) return "Mata pelajaran wajib dipilih.";

  if (input.type === "single_choice" || input.type === "multiple_choice") {
    const filled = input.options.filter((option) => option.content.trim());
    if (filled.length < 2) return "Minimal 2 opsi jawaban harus diisi.";
    const correctCount = filled.filter((option) => option.isCorrect).length;
    if (input.type === "single_choice" && correctCount !== 1)
      return "Pilihan ganda harus memiliki tepat 1 kunci jawaban.";
    if (input.type === "multiple_choice" && correctCount < 2)
      return "Pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban.";
  }

  if (input.type === "true_false_grid") {
    const filled = input.statements.filter((item) => item.content.trim());
    if (filled.length === 0) return "Minimal 1 pernyataan harus diisi.";
  }

  if (input.type === "short_answer") {
    const filled = input.options.filter((option) => option.content.trim());
    if (filled.length === 0)
      return "Minimal satu jawaban yang diterima harus diisi.";
    if (filled.some((option) => countWords(option.content) > ESSAY_MAX_WORDS))
      return `Setiap jawaban yang diterima maksimal ${ESSAY_MAX_WORDS} kata.`;
    if (filled.some((option) => hasForbiddenEssaySymbols(option.content)))
      return "Jawaban yang diterima hanya boleh berisi huruf, angka, spasi, titik, koma, apostrof, dan tanda hubung.";
  }

  return null;
}

function attachMeta(record: QuestionRecord): QuestionView {
  const store = getStore();
  return {
    ...record,
    subject: store.subjects.find((item) => item.id === record.subjectId)!,
    topic: store.topics.find((item) => item.id === record.topicId) ?? null,
    author: store.users.find((item) => item.id === record.createdById) ?? null,
  };
}

export async function listQuestions(filter?: {
  subjectId?: string;
  topicId?: string;
  status?: QuestionStatus | "ALL";
  type?: QuestionType;
  search?: string;
  createdById?: string;
}): Promise<QuestionView[]> {
  await ensureStore();
  const search = filter?.search?.trim().toLowerCase();
  return getStore()
    .questions.filter((question) => {
      if (filter?.subjectId && question.subjectId !== filter.subjectId)
        return false;
      if (filter?.topicId && question.topicId !== filter.topicId) return false;
      if (filter?.status && filter.status !== "ALL" && question.status !== filter.status)
        return false;
      if (filter?.type && question.type !== filter.type) return false;
      if (filter?.createdById && question.createdById !== filter.createdById)
        return false;
      if (search) {
        const haystack = `${question.question} ${question.stimulus ?? ""} ${
          question.indicator ?? ""
        }`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(attachMeta);
}

export async function getQuestionById(id: string) {
  await ensureStore();
  const record = getStore().questions.find((item) => item.id === id);
  return record ? attachMeta(record) : null;
}

export async function createQuestion(input: QuestionInput, authorId: string) {
  await ensureStore();
  const error = validateQuestionInput(input);
  if (error) throw new Error(error);

  const id = `q-${randomUUID()}`;
  const now = new Date().toISOString();
  const record: QuestionRecord = {
    id,
    subjectId: input.subjectId,
    topicId: input.topicId,
    type: input.type,
    level: input.level,
    stimulus: input.stimulus?.trim() || null,
    question: input.question.trim(),
    indicator: input.indicator?.trim() || null,
    explanation: input.explanation.trim(),
    imageUrl: null,
    status: input.status,
    createdById: authorId,
    createdAt: now,
    updatedAt: now,
    options:
      input.type === "true_false_grid"
        ? []
        : input.options
            .filter((option) => option.content.trim())
            .map((option, index) => ({
              id: `${id}-${String.fromCharCode(97 + index)}`,
              optionKey: String.fromCharCode(65 + index),
              content: option.content.trim(),
              isCorrect: option.isCorrect,
              sortOrder: index,
            })),
    statements:
      input.type === "true_false_grid"
        ? input.statements
            .filter((statement) => statement.content.trim())
            .map((statement, index) => ({
              id: `${id}-s${index + 1}`,
              content: statement.content.trim(),
              correctAnswer: statement.correctAnswer,
              sortOrder: index,
            }))
        : [],
  };

  getStore().questions.push(record);
  await saveQuestion(record);
  return record;
}

export async function updateQuestion(id: string, input: QuestionInput) {
  await ensureStore();
  const store = getStore();
  const record = store.questions.find((item) => item.id === id);
  if (!record) throw new Error("Soal tidak ditemukan.");
  const error = validateQuestionInput(input);
  if (error) throw new Error(error);

  record.subjectId = input.subjectId;
  record.topicId = input.topicId;
  record.type = input.type;
  record.level = input.level;
  record.stimulus = input.stimulus?.trim() || null;
  record.question = input.question.trim();
  record.indicator = input.indicator?.trim() || null;
  record.explanation = input.explanation.trim();
  record.status = input.status;
  record.updatedAt = new Date().toISOString();
  record.options =
    input.type === "true_false_grid"
      ? []
      : input.options
          .filter((option) => option.content.trim())
          .map((option, index) => ({
            id: record.options[index]?.id ?? `${id}-${String.fromCharCode(97 + index)}`,
            optionKey: String.fromCharCode(65 + index),
            content: option.content.trim(),
            isCorrect: option.isCorrect,
            sortOrder: index,
          }));
  record.statements =
    input.type === "true_false_grid"
      ? input.statements
          .filter((statement) => statement.content.trim())
          .map((statement, index) => ({
            id: record.statements[index]?.id ?? `${id}-s${index + 1}`,
            content: statement.content.trim(),
            correctAnswer: statement.correctAnswer,
            sortOrder: index,
          }))
      : [];

  await saveQuestion(record);
  return record;
}

export async function setQuestionStatus(id: string, status: QuestionStatus) {
  await ensureStore();
  const record = getStore().questions.find((item) => item.id === id);
  if (!record) throw new Error("Soal tidak ditemukan.");
  record.status = status;
  record.updatedAt = new Date().toISOString();
  await saveQuestion(record);
  return record;
}

export async function duplicateQuestion(id: string, authorId: string) {
  await ensureStore();
  const source = getStore().questions.find((item) => item.id === id);
  if (!source) throw new Error("Soal tidak ditemukan.");
  return createQuestion(
    {
      subjectId: source.subjectId,
      topicId: source.topicId,
      type: source.type,
      level: source.level,
      stimulus: source.stimulus,
      question: source.question,
      indicator: source.indicator,
      explanation: source.explanation,
      status: "DRAFT",
      options: source.options.map((option) => ({
        content: option.content,
        isCorrect: option.isCorrect,
      })),
      statements: source.statements.map((statement) => ({
        content: statement.content,
        correctAnswer: statement.correctAnswer,
      })),
    },
    authorId
  );
}

export async function countQuestions(filter?: {
  subjectId?: string;
  status?: QuestionStatus;
}) {
  await ensureStore();
  return getStore().questions.filter(
    (question) =>
      (!filter?.subjectId || question.subjectId === filter.subjectId) &&
      (!filter?.status || question.status === filter.status)
  ).length;
}

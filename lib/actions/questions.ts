"use server";

import { redirect } from "next/navigation";
import type { CognitiveLevel, QuestionStatus, QuestionType } from "@/lib/types";
import {
  COGNITIVE_LEVELS,
  QUESTION_STATUSES,
  QUESTION_TYPES,
} from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createQuestion,
  updateQuestion,
  type QuestionInput,
} from "@/lib/data/questions";
import { getStore } from "@/lib/data/store";

export interface QuestionActionState {
  error?: string;
}

const OPTION_KEYS = ["a", "b", "c", "d", "e"] as const;

function parseQuestionForm(formData: FormData): QuestionInput {
  const type = String(formData.get("type") ?? "single_choice") as QuestionType;
  const level = String(formData.get("level") ?? "C3") as CognitiveLevel;
  const status = String(formData.get("status") ?? "DRAFT") as QuestionStatus;

  const options = OPTION_KEYS.map((key) => ({
    content: String(formData.get(`option-${key}`) ?? "").trim(),
    isCorrect:
      type === "short_answer"
        ? true
        : type === "multiple_choice"
          ? formData.getAll("correct").map(String).includes(key)
          : String(formData.get("correct") ?? "") === key,
  })).filter((option) => option.content);

  const statements = [0, 1, 2, 3, 4]
    .map((index) => ({
      content: String(formData.get(`statement-${index}`) ?? "").trim(),
      correctAnswer: String(formData.get(`statement-correct-${index}`) ?? "true") === "true",
    }))
    .filter((statement) => statement.content);

  return {
    subjectId: String(formData.get("subjectId") ?? ""),
    topicId: String(formData.get("topicId") ?? "") || null,
    type: QUESTION_TYPES.includes(type) ? type : "single_choice",
    level: COGNITIVE_LEVELS.includes(level) ? level : "C3",
    stimulus: String(formData.get("stimulus") ?? "").trim() || null,
    question: String(formData.get("question") ?? ""),
    indicator: String(formData.get("indicator") ?? "").trim() || null,
    explanation: String(formData.get("explanation") ?? ""),
    status: QUESTION_STATUSES.includes(status) ? status : "DRAFT",
    options: type === "true_false_grid" ? [] : options,
    statements: type === "true_false_grid" ? statements : [],
  };
}

async function requireAuthor() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "TUTOR" && user.role !== "ADMIN")) return null;
  return user;
}

export async function createQuestionAction(
  _prevState: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const user = await requireAuthor();
  if (!user) return { error: "Kamu tidak berhak menambah soal." };

  const input = parseQuestionForm(formData);
  if (user.role === "TUTOR") input.status = "DRAFT";

  try {
    await createQuestion(input, user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Soal gagal disimpan.",
    };
  }

  redirect(user.role === "ADMIN" ? "/admin/soal" : "/tutor/soal");
}

export async function updateQuestionAction(
  _prevState: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const user = await requireAuthor();
  if (!user) return { error: "Kamu tidak berhak mengubah soal." };

  const questionId = String(formData.get("questionId") ?? "");
  const record = getStore().questions.find((item) => item.id === questionId);
  if (!record) return { error: "Soal tidak ditemukan." };
  if (user.role === "TUTOR" && record.createdById !== user.id) {
    return { error: "Kamu hanya dapat mengubah soal yang kamu buat." };
  }

  const input = parseQuestionForm(formData);
  if (user.role === "TUTOR") input.status = record.status;

  try {
    await updateQuestion(questionId, input);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Perubahan gagal disimpan.",
    };
  }

  redirect(user.role === "ADMIN" ? "/admin/soal" : "/tutor/soal");
}

export async function setQuestionStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Tidak diizinkan.");
  const id = String(formData.get("questionId") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as QuestionStatus;
  if (!QUESTION_STATUSES.includes(status)) throw new Error("Status tidak valid.");
  const { setQuestionStatus } = await import("@/lib/data/questions");
  await setQuestionStatus(id, status);
  redirect("/admin/soal");
}

export async function duplicateQuestionAction(formData: FormData) {
  const user = await requireAuthor();
  if (!user) throw new Error("Tidak diizinkan.");
  const id = String(formData.get("questionId") ?? "");
  const { duplicateQuestion } = await import("@/lib/data/questions");
  await duplicateQuestion(id, user.id);
  redirect(user.role === "ADMIN" ? "/admin/soal" : "/tutor/soal");
}

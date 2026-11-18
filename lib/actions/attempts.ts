"use server";

import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/guards";
import { startAttempt } from "@/lib/data/attempts";

export interface StartExamState {
  error?: string;
}

export async function startExamAction(
  _prevState: StartExamState,
  formData: FormData
): Promise<StartExamState> {
  const user = await requireStudent();
  const packageId = String(formData.get("packageId") ?? "");
  if (!packageId) return { error: "Paket tidak dikenali." };

  let attemptId = "";
  try {
    const attempt = await startAttempt(user.studentId!, packageId);
    attemptId = attempt.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Ujian tidak dapat dimulai saat ini.",
    };
  }
  redirect(`/ujian/${attemptId}`);
}

import { beforeEach, describe, expect, it } from "vitest";
import type { AnswerPayload } from "@/lib/types";
import {
  getAttemptResult,
  getAttemptReview,
  saveAttemptAnswer,
  startAttempt,
  submitAttempt,
  toPublicAttemptPayload,
} from "@/lib/data/attempts";
import { getStore, resetStore } from "@/lib/data/store";

function correctAnswerFor(attemptId: string, questionId: string): AnswerPayload {
  const snapshot = getStore().attempts.find((item) => item.id === attemptId)!
    .answers[questionId].snapshot;

  if (snapshot.type === "single_choice") {
    return {
      selected: snapshot.options.find((option) => option.isCorrect)!.id,
    };
  }
  if (snapshot.type === "multiple_choice") {
    return {
      selected: snapshot.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id),
    };
  }
  if (snapshot.type === "short_answer") {
    return {
      text: snapshot.options.find((option) => option.isCorrect)!.text,
    };
  }
  return {
    statements: Object.fromEntries(
      snapshot.statements.map((statement) => [statement.id, statement.correctAnswer])
    ),
  };
}

describe("alur attempt", () => {
  beforeEach(() => {
    resetStore();
  });

  it("memulai, menyimpan jawaban, dan menilai attempt dengan benar", async () => {
    const attempt = await startAttempt("st-8", "pkg-mat-latihan-1");

    expect(attempt.status).toBe("in_progress");
    expect(attempt.questionOrder).toHaveLength(8);
    expect(new Date(attempt.expiresAt).getTime()).toBeGreaterThan(
      new Date(attempt.startedAt).getTime()
    );

    const payload = toPublicAttemptPayload({
      attempt,
      student: getStore().students.find((item) => item.id === attempt.studentId)!,
      studentUser: getStore().users.find((item) => item.id === "u-s8")!,
      package: getStore().packages.find((item) => item.id === attempt.packageId)!,
      subject: getStore().subjects.find((item) => item.id === "sub-mat")!,
      className: "Kelas 6",
    });

    // Payload untuk browser tidak boleh memuat kunci jawaban.
    expect(JSON.stringify(payload)).not.toContain("isCorrect");
    expect(JSON.stringify(payload)).not.toContain("correctAnswer");

    const shortAnswer = payload.questions.find(
      (question) => question.type === "short_answer"
    );
    expect(shortAnswer?.options).toEqual([]);

    for (const questionId of attempt.questionOrder) {
      const result = await saveAttemptAnswer({
        attemptId: attempt.id,
        studentId: "st-8",
        questionId,
        answer: correctAnswerFor(attempt.id, questionId),
      });
      expect(result.saved).toBe(true);
    }

    const submitted = await submitAttempt(attempt.id, "st-8");
    expect(submitted.status).toBe("submitted");
    expect(submitted.score).toBe(100);
    expect(submitted.correctCount).toBe(8);
    expect(submitted.incorrectCount).toBe(0);
    expect(submitted.unansweredCount).toBe(0);
    expect(submitted.submittedAt).not.toBeNull();

    const result = getAttemptResult(submitted);
    expect(result?.score).toBe(100);
    expect(result?.topics.length).toBeGreaterThan(0);

    const review = getAttemptReview(submitted);
    expect(review).toHaveLength(8);
    expect(review.every((item) => item.isCorrect === true)).toBe(true);
  });

  it("menilai isian singkat setelah simbol dibersihkan dan huruf dinormalisasi", async () => {
    const attempt = await startAttempt("st-8", "pkg-mat-latihan-1");
    const essayId = attempt.questionOrder.find(
      (questionId) =>
        getStore().attempts.find((item) => item.id === attempt.id)!.answers[
          questionId
        ].snapshot.type === "short_answer"
    )!;

    const saved = await saveAttemptAnswer({
      attemptId: attempt.id,
      studentId: "st-8",
      questionId: essayId,
      answer: { text: "  NOL, koma tujuh lima!!  " },
    });

    expect(saved.saved).toBe(true);
    const stored = getStore().attempts.find((item) => item.id === attempt.id)!
      .answers[essayId].answer;
    expect(stored).toEqual({ text: "NOL, koma tujuh lima" });

    const review = getAttemptReview(
      await submitAttempt(attempt.id, "st-8")
    );
    expect(review.find((item) => item.snapshot.id === essayId)?.isCorrect).toBe(
      true
    );
  });

  it("menolak menyimpan jawaban milik siswa lain", async () => {
    const attempt = await startAttempt("st-8", "pkg-mat-latihan-1");
    await expect(
      saveAttemptAnswer({
        attemptId: attempt.id,
        studentId: "st-7",
        questionId: attempt.questionOrder[0],
        answer: { selected: "x" },
      })
    ).rejects.toThrow("tidak berhak");
  });

  it("mengumpulkan otomatis attempt yang sudah melewati batas waktu", async () => {
    const attempt = await startAttempt("st-7", "pkg-indo-latihan-1");
    attempt.expiresAt = new Date(Date.now() - 60_000).toISOString();

    const submitted = await submitAttempt(attempt.id, "st-7");
    expect(submitted.status).toBe("expired");
    expect(submitted.submittedAt).not.toBeNull();
    expect(submitted.score).toBe(0);
    expect(submitted.unansweredCount).toBe(submitted.questionOrder.length);
  });
});

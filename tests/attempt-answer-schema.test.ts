import { describe, expect, it } from "vitest";
import { attemptAnswerSchema } from "@/lib/validation/attempt-answer";

describe("attemptAnswerSchema", () => {
  it("mempertahankan jawaban isian singkat ({ text })", () => {
    const parsed = attemptAnswerSchema.parse({
      questionId: "q-indo-01",
      answer: { text: "Pantun memiliki sampiran dan isi." },
      isFlagged: false,
    });
    expect(parsed.answer).toEqual({ text: "Pantun memiliki sampiran dan isi." });
  });

  it("menerima pilihan ganda dan PG kompleks", () => {
    expect(
      attemptAnswerSchema.parse({ questionId: "q1", answer: { selected: "opt-1" } })
        .answer
    ).toEqual({ selected: "opt-1" });
    expect(
      attemptAnswerSchema.parse({
        questionId: "q2",
        answer: { selected: ["opt-1", "opt-3"] },
      }).answer
    ).toEqual({ selected: ["opt-1", "opt-3"] });
  });

  it("menerima benar/salah dan jawaban kosong", () => {
    expect(
      attemptAnswerSchema.parse({
        questionId: "q3",
        answer: { statements: { "st-1": true, "st-2": false } },
      }).answer
    ).toEqual({ statements: { "st-1": true, "st-2": false } });
    expect(
      attemptAnswerSchema.parse({ questionId: "q4", answer: null }).answer
    ).toBeNull();
  });

  it("menolak questionId kosong dan posisi soal negatif", () => {
    expect(
      attemptAnswerSchema.safeParse({ questionId: "", answer: null }).success
    ).toBe(false);
    expect(
      attemptAnswerSchema.safeParse({
        questionId: "q5",
        lastQuestionIndex: -1,
      }).success
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { gradeAttempt, gradeQuestion, isEmptyAnswer, toAttemptResult } from "@/lib/scoring";
import {
  countWords,
  essayMatches,
  hasForbiddenEssaySymbols,
  normalizeEssayForComparison,
  sanitizeEssayText,
  stripEssaySymbols,
  validateEssayText,
} from "@/lib/essay";
import type { QuestionSnapshot } from "@/lib/types";

function snapshot(overrides: Partial<QuestionSnapshot>): QuestionSnapshot {
  return {
    id: "q-1",
    subjectId: "sub-1",
    topicId: "top-1",
    topicName: "Pecahan",
    type: "single_choice",
    level: "C3",
    stimulus: null,
    question: "Contoh soal",
    indicator: null,
    explanation: "Pembahasan",
    imageUrl: null,
    options: [
      { id: "q-1-a", key: "A", text: "Pilihan A", isCorrect: false },
      { id: "q-1-b", key: "B", text: "Pilihan B", isCorrect: true },
      { id: "q-1-c", key: "C", text: "Pilihan C", isCorrect: false },
    ],
    statements: [],
    ...overrides,
  };
}

const single = snapshot({});

const multiple = snapshot({
  id: "q-2",
  type: "multiple_choice",
  options: [
    { id: "q-2-a", key: "A", text: "A", isCorrect: true },
    { id: "q-2-b", key: "B", text: "B", isCorrect: true },
    { id: "q-2-c", key: "C", text: "C", isCorrect: false },
    { id: "q-2-d", key: "D", text: "D", isCorrect: false },
  ],
});

const grid = snapshot({
  id: "q-3",
  type: "true_false_grid",
  options: [],
  statements: [
    { id: "q-3-s1", text: "Pernyataan 1", correctAnswer: true },
    { id: "q-3-s2", text: "Pernyataan 2", correctAnswer: false },
    { id: "q-3-s3", text: "Pernyataan 3", correctAnswer: true },
  ],
});

const essay = snapshot({
  id: "q-4",
  type: "short_answer",
  options: [
    { id: "q-4-a", key: "A", text: "fotosintesis", isCorrect: true },
    { id: "q-4-b", key: "B", text: "proses fotosintesis", isCorrect: true },
  ],
  statements: [],
});

describe("isEmptyAnswer", () => {
  it("menganggap jawaban kosong sebagai belum dijawab", () => {
    expect(isEmptyAnswer(null)).toBe(true);
    expect(isEmptyAnswer({})).toBe(true);
    expect(isEmptyAnswer({ selected: "" })).toBe(true);
    expect(isEmptyAnswer({ selected: [] })).toBe(true);
    expect(isEmptyAnswer({ statements: {} })).toBe(true);
  });

  it("menganggap pilihan terisi sebagai jawaban", () => {
    expect(isEmptyAnswer({ selected: "q-1-b" })).toBe(false);
    expect(isEmptyAnswer({ selected: ["q-2-a"] })).toBe(false);
    expect(isEmptyAnswer({ statements: { "q-3-s1": true } })).toBe(false);
  });

  it("menganggap teks esai kosong atau hanya spasi sebagai belum dijawab", () => {
    expect(isEmptyAnswer({ text: "" })).toBe(true);
    expect(isEmptyAnswer({ text: "   " })).toBe(true);
    expect(isEmptyAnswer({ text: "fotosintesis" })).toBe(false);
  });
});

describe("gradeQuestion — pilihan ganda", () => {
  it("memberi nilai penuh untuk kunci yang benar", () => {
    const result = gradeQuestion(single, { selected: "q-1-b" });
    expect(result).toEqual({ answered: true, ratio: 1, isCorrect: true });
  });

  it("memberi nilai nol untuk pilihan salah", () => {
    const result = gradeQuestion(single, { selected: "q-1-a" });
    expect(result).toEqual({ answered: true, ratio: 0, isCorrect: false });
  });

  it("menandai soal kosong sebagai belum dijawab", () => {
    const result = gradeQuestion(single, null);
    expect(result).toEqual({ answered: false, ratio: 0, isCorrect: false });
  });
});

describe("gradeQuestion — pilihan ganda kompleks", () => {
  it("mode penuh: hanya jawaban persis yang benar", () => {
    expect(gradeQuestion(multiple, { selected: ["q-2-a", "q-2-b"] }).ratio).toBe(1);
    expect(gradeQuestion(multiple, { selected: ["q-2-a"] }).ratio).toBe(0);
    expect(gradeQuestion(multiple, { selected: ["q-2-a", "q-2-b", "q-2-c"] }).ratio).toBe(0);
  });

  it("mode parsial: menghitung proporsi benar dan penalti pilihan salah", () => {
    expect(gradeQuestion(multiple, { selected: ["q-2-a"] }, "partial").ratio).toBe(0.5);
    expect(
      gradeQuestion(multiple, { selected: ["q-2-a", "q-2-c"] }, "partial").ratio
    ).toBe(0);
    expect(
      gradeQuestion(multiple, { selected: ["q-2-a", "q-2-b"] }, "partial").isCorrect
    ).toBe(true);
  });

  it("tidak pernah menghasilkan rasio negatif", () => {
    const result = gradeQuestion(
      multiple,
      { selected: ["q-2-c", "q-2-d"] },
      "partial"
    );
    expect(result.ratio).toBe(0);
  });
});

describe("gradeQuestion — benar/salah", () => {
  it("mode penuh: semua pernyataan harus benar dan lengkap", () => {
    const allCorrect = gradeQuestion(
      grid,
      { statements: { "q-3-s1": true, "q-3-s2": false, "q-3-s3": true } },
      "all_or_nothing"
    );
    expect(allCorrect.ratio).toBe(1);
    expect(allCorrect.isCorrect).toBe(true);

    const partialAnswer = gradeQuestion(
      grid,
      { statements: { "q-3-s1": true, "q-3-s2": false } },
      "all_or_nothing"
    );
    expect(partialAnswer.ratio).toBe(0);
    expect(partialAnswer.answered).toBe(true);
  });

  it("mode parsial: proporsi pernyataan benar", () => {
    const result = gradeQuestion(
      grid,
      { statements: { "q-3-s1": true, "q-3-s2": true, "q-3-s3": true } },
      "partial"
    );
    expect(result.ratio).toBeCloseTo(2 / 3);
    expect(result.isCorrect).toBe(false);
  });

  it("mengabaikan pernyataan yang belum dijawab pada mode parsial", () => {
    const result = gradeQuestion(
      grid,
      { statements: { "q-3-s1": true } },
      "partial"
    );
    expect(result.ratio).toBeCloseTo(1 / 3);
  });
});

describe("gradeQuestion — isian singkat", () => {
  it("menerima jawaban yang sama setelah normalisasi", () => {
    const result = gradeQuestion(essay, { text: "  Fotosintesis. " });
    expect(result).toEqual({ answered: true, ratio: 1, isCorrect: true });
  });

  it("menerima salah satu variasi jawaban yang disediakan", () => {
    expect(gradeQuestion(essay, { text: "proses   fotosintesis" }).ratio).toBe(1);
  });

  it("menolak jawaban yang berbeda", () => {
    expect(gradeQuestion(essay, { text: "respirasi" })).toEqual({
      answered: true,
      ratio: 0,
      isCorrect: false,
    });
  });

  it("menandai jawaban kosong sebagai belum dijawab", () => {
    expect(gradeQuestion(essay, { text: "   " })).toEqual({
      answered: false,
      ratio: 0,
      isCorrect: false,
    });
    expect(gradeQuestion(essay, null).answered).toBe(false);
  });
});

describe("helper esai", () => {
  it("menghitung kata dan membatasi maksimal 15 kata", () => {
    expect(countWords("satu dua tiga")).toBe(3);
    const long = Array.from({ length: 20 }, (_, index) => `kata${index}`).join(" ");
    expect(countWords(sanitizeEssayText(long))).toBe(15);
  });

  it("membuang simbol terlarang tanpa menghapus huruf dan angka", () => {
    expect(stripEssaySymbols("Jawaban!@#$%^&*() 0,75")).toBe("Jawaban 0,75");
    expect(hasForbiddenEssaySymbols("a!b")).toBe(true);
    expect(hasForbiddenEssaySymbols("a/b")).toBe(true);
    expect(hasForbiddenEssaySymbols("a b.")).toBe(false);
  });

  it("merapikan spasi dan memberi pesan validasi yang sesuai", () => {
    expect(sanitizeEssayText("  nol   koma  tujuh lima  ")).toBe(
      "nol koma tujuh lima"
    );
    expect(validateEssayText("")).toBe("Jawaban wajib diisi.");
    expect(validateEssayText("a!")).toContain("Simbol");
    expect(validateEssayText(Array.from({ length: 16 }, () => "kata").join(" "))).toContain(
      "15 kata"
    );
    expect(validateEssayText("jawaban benar")).toBeNull();
  });

  it("membandingkan jawaban tanpa membedakan huruf dan tanda baca umum", () => {
    expect(normalizeEssayForComparison("  Nol, Koma-Tujuh Lima. ")).toBe(
      "nol koma tujuh lima"
    );
    expect(essayMatches("NOL KOMA TUJUH LIMA", ["0,75", "nol koma tujuh lima"])).toBe(
      true
    );
    expect(essayMatches("", ["nol"])).toBe(false);
  });
});

describe("gradeAttempt", () => {
  const questions = [
    { question: single, points: 2 },
    { question: multiple, points: 1 },
    { question: grid, points: 1 },
  ];

  it("menghitung skor berbobot dan statistik attempt", () => {
    const ledger = gradeAttempt(
      questions,
      {
        "q-1": { selected: "q-1-b" },
        "q-2": { selected: ["q-2-a", "q-2-b"] },
        // q-3 sengaja kosong
      },
      "all_or_nothing"
    );

    expect(ledger.score).toBe(75);
    expect(ledger.correctCount).toBe(2);
    expect(ledger.incorrectCount).toBe(0);
    expect(ledger.unansweredCount).toBe(1);
    expect(ledger.totalQuestions).toBe(3);
    expect(ledger.totalPoints).toBe(4);
    expect(ledger.earnedPoints).toBe(3);
    expect(ledger.items.map((item) => item.pointsAwarded)).toEqual([2, 1, 0]);
  });

  it("memakai snapshot untuk analisis topik dan level", () => {
    const ledger = gradeAttempt(questions, {
      "q-1": { selected: "q-1-b" },
      "q-2": { selected: ["q-2-a"] },
      "q-3": { statements: { "q-3-s1": true } },
    });
    const result = toAttemptResult(ledger);

    expect(result.topics).toHaveLength(1);
    expect(result.topics[0]).toMatchObject({
      name: "Pecahan",
      total: 3,
      percent: 33,
    });
    expect(result.levels).toEqual([
      { level: "C3", correct: 1, total: 3, percent: 33 },
    ]);
    expect(result.score).toBe(50);
    expect(result.incorrectCount).toBe(2);
  });

  it("mengembalikan hasil kosong untuk paket tanpa soal", () => {
    const ledger = gradeAttempt([], {});
    expect(ledger).toMatchObject({
      score: 0,
      totalQuestions: 0,
      totalPoints: 0,
      items: [],
      topics: [],
      levels: [],
    });
  });

  it("membulatkan skor ke bilangan bulat", () => {
    const ledger = gradeAttempt(
      [{ question: single, points: 1 }, { question: multiple, points: 1 }],
      { "q-1": { selected: "q-1-b" } }
    );
    expect(ledger.score).toBe(50);
  });
});

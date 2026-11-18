import type {
  AnswerPayload,
  AttemptResult,
  CognitiveLevel,
  LevelAnalysis,
  QuestionSnapshot,
  ScoringMode,
  TopicAnalysis,
} from "./types";
import { COGNITIVE_LEVELS } from "./types";
import { essayMatches } from "./essay";

export interface GradeResult {
  answered: boolean;
  /** Rasio nilai 0..1 untuk soal ini. */
  ratio: number;
  isCorrect: boolean;
}

export interface GradeItem {
  questionId: string;
  answered: boolean;
  ratio: number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface GradeAttemptResult {
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  items: GradeItem[];
  topics: TopicAnalysis[];
  levels: LevelAnalysis[];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function isEmptyAnswer(answer: AnswerPayload | null | undefined) {
  if (!answer) return true;
  if (typeof answer.text === "string") return answer.text.trim().length === 0;
  if (typeof answer.selected === "string") return answer.selected.length === 0;
  if (Array.isArray(answer.selected)) return answer.selected.length === 0;
  if (answer.statements) return Object.keys(answer.statements).length === 0;
  return true;
}

/** Nilai satu soal. `points` hanya dipakai untuk perhitungan total attempt. */
export function gradeQuestion(
  question: QuestionSnapshot,
  answer: AnswerPayload | null | undefined,
  mode: ScoringMode = "all_or_nothing"
): GradeResult {
  if (isEmptyAnswer(answer)) {
    return { answered: false, ratio: 0, isCorrect: false };
  }

  if (question.type === "single_choice") {
    const selected =
      typeof answer?.selected === "string" ? answer.selected : null;
    const correct = question.options.find((option) => option.isCorrect);
    const isCorrect = Boolean(selected && correct && selected === correct.id);
    return { answered: true, ratio: isCorrect ? 1 : 0, isCorrect };
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(answer?.selected)
      ? answer.selected
      : typeof answer?.selected === "string"
        ? [answer.selected]
        : [];
    const selectedSet = new Set(selected.filter(Boolean));
    const correctIds = new Set(
      question.options.filter((option) => option.isCorrect).map((o) => o.id)
    );
    const totalCorrect = correctIds.size;
    if (totalCorrect === 0) {
      return { answered: selectedSet.size > 0, ratio: 0, isCorrect: false };
    }

    const correctSelected = [...selectedSet].filter((id) =>
      correctIds.has(id)
    ).length;
    const wrongSelected = selectedSet.size - correctSelected;

    if (mode === "partial") {
      const ratio = clamp01((correctSelected - wrongSelected) / totalCorrect);
      return {
        answered: true,
        ratio,
        isCorrect: ratio === 1,
      };
    }

    const exactMatch =
      selectedSet.size === totalCorrect &&
      [...correctIds].every((id) => selectedSet.has(id));
    return { answered: true, ratio: exactMatch ? 1 : 0, isCorrect: exactMatch };
  }

  if (question.type === "short_answer") {
    const text = typeof answer?.text === "string" ? answer.text : "";
    const accepted = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.text);
    const isCorrect = essayMatches(text, accepted);
    return { answered: true, ratio: isCorrect ? 1 : 0, isCorrect };
  }

  // true_false_grid
  const statements = answer?.statements ?? {};
  const total = question.statements.length;
  if (total === 0) {
    return {
      answered: Object.keys(statements).length > 0,
      ratio: 0,
      isCorrect: false,
    };
  }

  let correctCount = 0;
  let answeredCount = 0;
  for (const statement of question.statements) {
    const value = statements[statement.id];
    if (typeof value === "boolean") {
      answeredCount += 1;
      if (value === statement.correctAnswer) correctCount += 1;
    }
  }

  if (answeredCount === 0) {
    return { answered: false, ratio: 0, isCorrect: false };
  }

  if (mode === "partial") {
    const ratio = clamp01(correctCount / total);
    return { answered: true, ratio, isCorrect: ratio === 1 };
  }

  const allAnswered = answeredCount === total;
  const isCorrect = allAnswered && correctCount === total;
  return { answered: true, ratio: isCorrect ? 1 : 0, isCorrect };
}

export interface AttemptQuestionInput {
  question: QuestionSnapshot;
  points?: number;
}

/**
 * Menilai seluruh attempt dari snapshot soal (bukan data bank soal terkini),
 * sehingga perubahan soal setelah attempt tidak mengubah hasil.
 */
export function gradeAttempt(
  questions: AttemptQuestionInput[],
  answers: Record<string, AnswerPayload | null | undefined>,
  mode: ScoringMode = "all_or_nothing"
): GradeAttemptResult {
  if (questions.length === 0) {
    return {
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      totalQuestions: 0,
      totalPoints: 0,
      earnedPoints: 0,
      items: [],
      topics: [],
      levels: [],
    };
  }

  const items: GradeItem[] = [];
  let earned = 0;
  let totalPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const { question, points = 1 } of questions) {
    const graded = gradeQuestion(question, answers[question.id], mode);
    const awarded = graded.ratio * points;
    earned += awarded;
    totalPoints += points;

    if (!graded.answered) unansweredCount += 1;
    else if (graded.isCorrect) correctCount += 1;
    else incorrectCount += 1;

    items.push({
      questionId: question.id,
      answered: graded.answered,
      ratio: graded.ratio,
      isCorrect: graded.isCorrect,
      pointsAwarded: awarded,
    });
  }

  const score = totalPoints
    ? Math.round((earned / totalPoints) * 100)
    : 0;

  const topicMap = new Map<string, { ratio: number; total: number }>();
  const levelMap = new Map<CognitiveLevel, { ratio: number; total: number }>();

  for (const item of items) {
    const snapshot = questions.find(
      (q) => q.question.id === item.questionId
    )!.question;
    const topicName = snapshot.topicName ?? "Tanpa topik";
    const topic = topicMap.get(topicName) ?? { ratio: 0, total: 0 };
    topic.ratio += item.ratio;
    topic.total += 1;
    topicMap.set(topicName, topic);

    const level = levelMap.get(snapshot.level) ?? { ratio: 0, total: 0 };
    level.ratio += item.ratio;
    level.total += 1;
    levelMap.set(snapshot.level, level);
  }

  const topics: TopicAnalysis[] = [...topicMap.entries()]
    .map(([name, value]) => ({
      name,
      correct: Math.round(value.ratio * 10) / 10,
      total: value.total,
      percent: Math.round((value.ratio / value.total) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  const levels: LevelAnalysis[] = COGNITIVE_LEVELS.filter((level) =>
    levelMap.has(level)
  ).map((level) => {
    const value = levelMap.get(level)!;
    return {
      level,
      correct: Math.round(value.ratio * 10) / 10,
      total: value.total,
      percent: Math.round((value.ratio / value.total) * 100),
    };
  });

  return {
    score,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions: questions.length,
    totalPoints,
    earnedPoints: earned,
    items,
    topics,
    levels,
  };
}

export function toAttemptResult(
  ledger: GradeAttemptResult
): AttemptResult {
  return {
    score: ledger.score,
    correctCount: ledger.correctCount,
    incorrectCount: ledger.incorrectCount,
    unansweredCount: ledger.unansweredCount,
    totalQuestions: ledger.totalQuestions,
    topics: ledger.topics,
    levels: ledger.levels,
  };
}

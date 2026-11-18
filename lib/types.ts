export const ROLES = ["STUDENT", "TUTOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "true_false_grid",
  "short_answer",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const COGNITIVE_LEVELS = ["C3", "C4", "C5", "C6"] as const;
export type CognitiveLevel = (typeof COGNITIVE_LEVELS)[number];

export const QUESTION_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const PACKAGE_TYPES = ["latihan", "tryout"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const PACKAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const SCORING_MODES = ["all_or_nothing", "partial"] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];

export const ATTEMPT_STATUSES = ["in_progress", "submitted", "expired"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const EVENT_TYPES = [
  "visibility_hidden",
  "window_blur",
  "fullscreen_exit",
  "copy",
  "paste",
  "contextmenu",
] as const;
export type AttemptEventType = (typeof EVENT_TYPES)[number];

export interface AnswerPayload {
  selected?: string | string[];
  statements?: Record<string, boolean>;
  /** Jawaban isian singkat/esai. Maksimal 15 kata, tanpa simbol khusus. */
  text?: string;
}

export interface SnapshotOption {
  id: string;
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface SnapshotStatement {
  id: string;
  text: string;
  correctAnswer: boolean;
}

/** Snapshot soal yang disimpan per attempt. Berisi kunci jawaban (server-only). */
export interface QuestionSnapshot {
  id: string;
  subjectId: string;
  topicId: string | null;
  topicName: string | null;
  type: QuestionType;
  level: CognitiveLevel;
  stimulus: string | null;
  question: string;
  indicator: string | null;
  explanation: string;
  imageUrl: string | null;
  options: SnapshotOption[];
  statements: SnapshotStatement[];
}

/** Bentuk soal yang aman dikirim ke browser sebelum submit (tanpa kunci). */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  level: CognitiveLevel;
  stimulus: string | null;
  question: string;
  imageUrl: string | null;
  options: { id: string; key: string; text: string }[];
  statements: { id: string; text: string }[];
}

export interface PublicAttemptPayload {
  id: string;
  status: AttemptStatus;
  packageTitle: string;
  packageType: PackageType;
  subjectName: string;
  durationMinutes: number;
  showExplanation: boolean;
  startedAt: string;
  expiresAt: string;
  serverTime: string;
  lastQuestionIndex: number;
  questions: PublicQuestion[];
  answers: Record<string, { answer: AnswerPayload | null; isFlagged: boolean }>;
}

export interface TopicAnalysis {
  name: string;
  correct: number;
  total: number;
  percent: number;
}

export interface LevelAnalysis {
  level: CognitiveLevel;
  correct: number;
  total: number;
  percent: number;
}

export interface AttemptResult {
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  topics: TopicAnalysis[];
  levels: LevelAnalysis[];
}

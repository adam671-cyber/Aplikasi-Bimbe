import type {
  AnswerPayload,
  CognitiveLevel,
  PackageStatus,
  PackageType,
  QuestionSnapshot,
  QuestionType,
  Role,
  ScoringMode,
  AttemptStatus,
} from "@/lib/types";

export interface UserRecord {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export interface StudentRecord {
  id: string;
  userId: string;
  nis: string;
  classId: string | null;
  school: string | null;
  gender: "L" | "P" | null;
  parentPhone: string | null;
  isActive: boolean;
}

export interface ClassRecord {
  id: string;
  name: string;
  academicYear: string;
  tutorId: string | null;
  isActive: boolean;
}

export interface SubjectRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: "indigo" | "rose" | "emerald" | "amber" | "sky";
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TopicRecord {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface QuestionOptionRecord {
  id: string;
  optionKey: string;
  content: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface QuestionStatementRecord {
  id: string;
  content: string;
  correctAnswer: boolean;
  sortOrder: number;
}

export interface MaterialRecord {
  id: string;
  subjectId: string;
  topicId: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  sortOrder: number;
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  subjectId: string;
  topicId: string | null;
  type: QuestionType;
  level: CognitiveLevel;
  stimulus: string | null;
  question: string;
  indicator: string | null;
  explanation: string;
  imageUrl: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  options: QuestionOptionRecord[];
  statements: QuestionStatementRecord[];
}

export interface PackageQuestionRecord {
  questionId: string;
  sortOrder: number;
  points: number;
}

export interface PackageRecord {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  type: PackageType;
  description: string;
  durationMinutes: number;
  maxAttempts: number | null;
  scoringMode: ScoringMode;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  status: PackageStatus;
  availableFrom: string | null;
  availableTo: string | null;
  questions: PackageQuestionRecord[];
  classIds: string[];
  createdAt: string;
}

export interface AttemptAnswerRecord {
  questionId: string;
  answer: AnswerPayload | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  snapshot: QuestionSnapshot;
  isFlagged: boolean;
  answeredAt: string | null;
  updatedAt: string;
}

export interface AttemptEventRecord {
  id: string;
  type: string;
  createdAt: string;
}

export interface AttemptRecord {
  id: string;
  studentId: string;
  packageId: string;
  status: AttemptStatus;
  scoringMode: ScoringMode;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  score: number | null;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
  lastQuestionIndex: number;
  answers: Record<string, AttemptAnswerRecord>;
  events: AttemptEventRecord[];
}

export interface StoreData {
  users: UserRecord[];
  students: StudentRecord[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  materials: MaterialRecord[];
  questions: QuestionRecord[];
  packages: PackageRecord[];
  attempts: AttemptRecord[];
  settings: Record<string, string>;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: Role;
  mustChangePassword: boolean;
  studentId: string | null;
  classId: string | null;
  className: string | null;
}

export interface AttemptWithContext {
  attempt: AttemptRecord;
  student: StudentRecord;
  studentUser: UserRecord;
  package: PackageRecord;
  subject: SubjectRecord;
  className: string | null;
}

import { abilityLabel } from "@/lib/utils";
import { getAttemptLedger, listAttempts, listAttemptsForStudent } from "./attempts";
import { getStore } from "./store";
import { ensureStore } from "@/lib/supabase/store-sync";
import { toStudentView, type StudentView } from "./students";
import type { AttemptRecord, SubjectRecord } from "./types";

export interface TopicScore {
  name: string;
  percent: number;
  total: number;
}

export interface StudentDashboardData {
  attempts: number;
  averageScore: number | null;
  bestScore: number | null;
  weakTopics: TopicScore[];
  recent: Awaited<ReturnType<typeof listAttemptsForStudent>>;
  active: Awaited<ReturnType<typeof listAttemptsForStudent>>;
}

function dayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export async function getStudentDashboard(
  studentId: string
): Promise<StudentDashboardData> {
  await ensureStore();
  const attempts = await listAttemptsForStudent(studentId);
  const submitted = attempts.filter(
    (item) => item.attempt.status === "submitted" && item.attempt.score !== null
  );
  const average =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((total, item) => total + (item.attempt.score ?? 0), 0) /
            submitted.length
        )
      : null;

  const topicTotals = new Map<string, { percent: number; total: number }>();
  for (const item of submitted) {
    const ledger = getAttemptLedger(item.attempt);
    if (!ledger) continue;
    for (const topic of ledger.topics) {
      const current = topicTotals.get(topic.name) ?? { percent: 0, total: 0 };
      current.percent += topic.percent * topic.total;
      current.total += topic.total;
      topicTotals.set(topic.name, current);
    }
  }

  const weakTopics: TopicScore[] = [...topicTotals.entries()]
    .map(([name, value]) => ({
      name,
      percent: Math.round(value.percent / value.total),
      total: value.total,
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 4);

  return {
    attempts: submitted.length,
    averageScore: average,
    bestScore:
      submitted.length > 0
        ? Math.max(...submitted.map((item) => item.attempt.score ?? 0))
        : null,
    weakTopics,
    recent: attempts.filter((item) => item.attempt.status !== "in_progress").slice(0, 4),
    active: attempts.filter((item) => item.attempt.status === "in_progress"),
  };
}

export interface SubjectStat {
  subject: SubjectRecord;
  attempts: number;
  average: number | null;
}

export interface AdminOverviewData {
  totals: {
    students: number;
    classes: number;
    questions: number;
    packages: number;
    attemptsToday: number;
    averageScore: number | null;
  };
  subjects: SubjectStat[];
  distribution: { label: string; count: number; tone: string }[];
  recent: Awaited<ReturnType<typeof listAttempts>>;
  hardest: { questionId: string; question: string; percent: number; total: number }[];
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  await ensureStore();
  const store = getStore();
  const attempts = await listAttempts({ status: "ALL" });
  const submitted = attempts.filter(
    (item) => item.attempt.status === "submitted" && item.attempt.score !== null
  );
  const today = dayKey(new Date());

  const average =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((total, item) => total + (item.attempt.score ?? 0), 0) /
            submitted.length
        )
      : null;

  const subjects: SubjectStat[] = store.subjects.map((subject) => {
    const relevant = submitted.filter((item) => item.subject.id === subject.id);
    return {
      subject,
      attempts: relevant.length,
      average:
        relevant.length > 0
          ? Math.round(
              relevant.reduce((total, item) => total + (item.attempt.score ?? 0), 0) /
                relevant.length
            )
          : null,
    };
  });

  const buckets = [
    { label: "80–100", min: 80, max: 100, tone: "emerald" },
    { label: "60–79", min: 60, max: 79, tone: "indigo" },
    { label: "40–59", min: 40, max: 59, tone: "amber" },
    { label: "0–39", min: 0, max: 39, tone: "rose" },
  ];

  const distribution = buckets.map((bucket) => ({
    label: bucket.label,
    tone: bucket.tone,
    count: submitted.filter((item) => {
      const score = item.attempt.score ?? 0;
      return score >= bucket.min && score <= bucket.max;
    }).length,
  }));

  const questionStats = new Map<
    string,
    { question: string; correct: number; total: number }
  >();
  for (const item of submitted) {
    for (const questionId of item.attempt.questionOrder) {
      const answer = item.attempt.answers[questionId];
      if (!answer || !answer.answer) continue;
      const current = questionStats.get(questionId) ?? {
        question: answer.snapshot.question,
        correct: 0,
        total: 0,
      };
      current.total += 1;
      if (answer.isCorrect) current.correct += 1;
      questionStats.set(questionId, current);
    }
  }

  const hardest = [...questionStats.entries()]
    .map(([questionId, value]) => ({
      questionId,
      question: value.question,
      percent: Math.round((value.correct / value.total) * 100),
      total: value.total,
    }))
    .filter((item) => item.total >= 2)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 5);

  return {
    totals: {
      students: store.students.filter((student) => student.isActive).length,
      classes: store.classes.filter((classroom) => classroom.isActive).length,
      questions: store.questions.filter((question) => question.status === "ACTIVE")
        .length,
      packages: store.packages.filter((pkg) => pkg.status === "PUBLISHED").length,
      attemptsToday: submitted.filter(
        (item) => item.attempt.submittedAt && dayKey(item.attempt.submittedAt) === today
      ).length,
      averageScore: average,
    },
    subjects,
    distribution,
    recent: submitted.slice(0, 6),
    hardest,
  };
}

export interface TutorClassSummary {
  id: string;
  name: string;
  academicYear: string;
  studentCount: number;
  submitted: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
}

export async function getTutorOverview(tutorId: string) {
  await ensureStore();
  const classes = getStore().classes.filter(
    (classroom) => classroom.tutorId === tutorId && classroom.isActive
  );
  const summaries: TutorClassSummary[] = [];
  const allAttempts: Awaited<ReturnType<typeof listAttempts>> = [];

  for (const classroom of classes) {
    const students = getStore().students.filter(
      (student) => student.classId === classroom.id && student.isActive
    );
    const attempts = await listAttempts({
      classId: classroom.id,
      status: "submitted",
    });
    const scores = attempts
      .map((item) => item.attempt.score)
      .filter((score): score is number => score !== null);
    summaries.push({
      id: classroom.id,
      name: classroom.name,
      academicYear: classroom.academicYear,
      studentCount: students.length,
      submitted: attempts.length,
      average:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
      highest: scores.length ? Math.max(...scores) : null,
      lowest: scores.length ? Math.min(...scores) : null,
    });
    allAttempts.push(...attempts);
  }

  allAttempts.sort((a, b) => b.attempt.startedAt.localeCompare(a.attempt.startedAt));
  return { classes: summaries, recent: allAttempts.slice(0, 8) };
}

export interface ClassReportRow {
  student: StudentView;
  attempts: number;
  average: number | null;
  best: number | null;
  lastSubmittedAt: string | null;
  status: string;
}

export interface ClassReportData {
  classroom: { id: string; name: string; academicYear: string };
  students: ClassReportRow[];
  totals: {
    students: number;
    submitted: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    completion: number;
  };
  hardest: { question: string; percent: number; total: number }[];
}

export async function getClassReport(classId: string): Promise<ClassReportData | null> {
  await ensureStore();
  const store = getStore();
  const classroom = store.classes.find((item) => item.id === classId);
  if (!classroom) return null;

  const students = store.students
    .filter((student) => student.classId === classId && student.isActive)
    .map(toStudentView);
  const attempts = await listAttempts({ classId, status: "submitted" });
  const scores = attempts
    .map((item) => item.attempt.score)
    .filter((score): score is number => score !== null);

  const rows: ClassReportRow[] = students.map((student) => {
    const studentAttempts = attempts.filter(
      (item) => item.attempt.studentId === student.id
    );
    const studentScores = studentAttempts
      .map((item) => item.attempt.score)
      .filter((score): score is number => score !== null);
    const last = studentAttempts
      .slice()
      .sort((a, b) =>
        (b.attempt.submittedAt ?? "").localeCompare(a.attempt.submittedAt ?? "")
      )[0];
    return {
      student,
      attempts: studentAttempts.length,
      average:
        studentScores.length > 0
          ? Math.round(
              studentScores.reduce((a, b) => a + b, 0) / studentScores.length
            )
          : null,
      best: studentScores.length ? Math.max(...studentScores) : null,
      lastSubmittedAt: last?.attempt.submittedAt ?? null,
      status:
        studentScores.length === 0
          ? "Belum ada nilai"
          : abilityLabel(
              Math.round(
                studentScores.reduce((a, b) => a + b, 0) / studentScores.length
              )
            ),
    };
  });

  const questionStats = new Map<
    string,
    { question: string; correct: number; total: number }
  >();
  for (const item of attempts) {
    for (const questionId of item.attempt.questionOrder) {
      const answer = item.attempt.answers[questionId];
      if (!answer || !answer.answer) continue;
      const current = questionStats.get(questionId) ?? {
        question: answer.snapshot.question,
        correct: 0,
        total: 0,
      };
      current.total += 1;
      if (answer.isCorrect) current.correct += 1;
      questionStats.set(questionId, current);
    }
  }

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      academicYear: classroom.academicYear,
    },
    students: rows,
    totals: {
      students: students.length,
      submitted: scores.length,
      average:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
      highest: scores.length ? Math.max(...scores) : null,
      lowest: scores.length ? Math.min(...scores) : null,
      completion:
        students.length > 0
          ? Math.round(
              (rows.filter((row) => row.attempts > 0).length / students.length) * 100
            )
          : 0,
    },
    hardest: [...questionStats.values()]
      .map((value) => ({
        question: value.question,
        percent: Math.round((value.correct / value.total) * 100),
        total: value.total,
      }))
      .filter((item) => item.total >= 2)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5),
  };
}

export function attemptScoreColor(score: number | null) {
  if (score === null) return "slate";
  if (score >= 80) return "emerald";
  if (score >= 60) return "indigo";
  if (score >= 40) return "amber";
  return "rose";
}

export function getSubjectAttemptCount(subjectId: string) {
  const store = getStore();
  const packageIds = new Set(
    store.packages
      .filter((pkg) => pkg.subjectId === subjectId)
      .map((pkg) => pkg.id)
  );
  return store.attempts.filter((attempt) => packageIds.has(attempt.packageId))
    .length;
}

export function todayAttempts(attempts: AttemptRecord[]) {
  const today = dayKey(new Date());
  return attempts.filter(
    (attempt) => attempt.submittedAt && dayKey(attempt.submittedAt) === today
  );
}

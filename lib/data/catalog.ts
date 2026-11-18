import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/utils";
import { getStore } from "./store";
import {
  ensureStore,
  savePackage,
  saveSubject,
  saveTopic,
} from "@/lib/supabase/store-sync";
import type {
  PackageRecord,
  SubjectRecord,
  TopicRecord,
} from "./types";

export interface PackageView extends PackageRecord {
  subject: SubjectRecord;
  questionCount: number;
}

export function getSubjectById(id: string): SubjectRecord | undefined {
  return getStore().subjects.find((subject) => subject.id === id);
}

export async function getSubjects(includeInactive = false) {
  await ensureStore();
  return getStore()
    .subjects.filter((subject) => includeInactive || subject.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getSubjectBySlug(slug: string) {
  await ensureStore();
  return getStore().subjects.find(
    (subject) => subject.slug === slug && subject.isActive
  );
}

export async function getTopics(subjectId?: string): Promise<TopicRecord[]> {
  await ensureStore();
  return getStore()
    .topics.filter((topic) => !subjectId || topic.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTopicById(id: string | null) {
  if (!id) return undefined;
  return getStore().topics.find((topic) => topic.id === id);
}

export async function getPackageById(id: string) {
  await ensureStore();
  return getStore().packages.find((item) => item.id === id);
}

export async function getPackageBySlug(slug: string) {
  await ensureStore();
  return getStore().packages.find((item) => item.slug === slug);
}

export function toPackageView(pkg: PackageRecord): PackageView {
  const subject = getSubjectById(pkg.subjectId)!;
  return {
    ...pkg,
    subject,
    questionCount: pkg.questions.length,
  };
}

export async function listPackageViews(filter?: {
  subjectId?: string;
  type?: PackageRecord["type"];
  status?: PackageRecord["status"];
  includeDraft?: boolean;
}): Promise<PackageView[]> {
  await ensureStore();
  return getStore()
    .packages.filter((pkg) => {
      if (filter?.subjectId && pkg.subjectId !== filter.subjectId) return false;
      if (filter?.type && pkg.type !== filter.type) return false;
      if (filter?.status && pkg.status !== filter.status) return false;
      if (!filter?.includeDraft && !filter?.status && pkg.status !== "PUBLISHED")
        return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPackageView);
}

export function packageAvailability(pkg: PackageRecord) {
  const now = Date.now();
  if (pkg.status !== "PUBLISHED") {
    return { open: false, reason: "Paket belum dipublikasikan." };
  }
  if (pkg.availableFrom && new Date(pkg.availableFrom).getTime() > now) {
    return { open: false, reason: "Paket belum dibuka sesuai jadwal." };
  }
  if (pkg.availableTo && new Date(pkg.availableTo).getTime() < now) {
    return { open: false, reason: "Masa pengerjaan paket telah berakhir." };
  }
  return { open: true, reason: null };
}

export async function getPackagesForStudent(
  studentId: string,
  type?: PackageRecord["type"]
): Promise<PackageView[]> {
  await ensureStore();
  const store = getStore();
  const student = store.students.find((item) => item.id === studentId);
  if (!student) return [];

  return store.packages
    .filter((pkg) => {
      if (pkg.status !== "PUBLISHED") return false;
      if (type && pkg.type !== type) return false;
      if (pkg.classIds.length > 0) {
        if (!student.classId || !pkg.classIds.includes(student.classId))
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      const order = { tryout: 0, latihan: 1 };
      return order[a.type] - order[b.type] || b.createdAt.localeCompare(a.createdAt);
    })
    .map(toPackageView);
}

export async function createSubject(input: {
  name: string;
  description: string;
  color: SubjectRecord["color"];
  icon: string;
}) {
  await ensureStore();
  const store = getStore();
  if (!input.name.trim()) throw new Error("Nama mata pelajaran wajib diisi.");
  const slug = slugify(input.name);
  if (store.subjects.some((subject) => subject.slug === slug))
    throw new Error("Mata pelajaran dengan nama tersebut sudah ada.");
  const record: SubjectRecord = {
    id: `sub-${randomUUID()}`,
    name: input.name.trim(),
    slug,
    description: input.description.trim(),
    color: input.color,
    icon: input.icon,
    sortOrder: store.subjects.length + 1,
    isActive: true,
  };
  store.subjects.push(record);
  await saveSubject(record);
  return record;
}

export async function updateSubject(
  id: string,
  input: Partial<{ name: string; description: string; isActive: boolean }>
) {
  await ensureStore();
  const subject = getStore().subjects.find((item) => item.id === id);
  if (!subject) throw new Error("Mata pelajaran tidak ditemukan.");
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Nama mata pelajaran wajib diisi.");
    subject.name = input.name.trim();
    subject.slug = slugify(input.name);
  }
  if (input.description !== undefined) subject.description = input.description.trim();
  if (input.isActive !== undefined) subject.isActive = input.isActive;
  await saveSubject(subject);
  return subject;
}

export async function createTopic(input: { subjectId: string; name: string }) {
  await ensureStore();
  const store = getStore();
  if (!input.name.trim()) throw new Error("Nama topik wajib diisi.");
  if (!store.subjects.some((subject) => subject.id === input.subjectId))
    throw new Error("Mata pelajaran tidak ditemukan.");
  const slug = slugify(input.name);
  if (
    store.topics.some(
      (topic) => topic.subjectId === input.subjectId && topic.slug === slug
    )
  )
    throw new Error("Topik dengan nama tersebut sudah ada pada mapel ini.");
  const record: TopicRecord = {
    id: `top-${randomUUID()}`,
    subjectId: input.subjectId,
    name: input.name.trim(),
    slug,
    sortOrder:
      store.topics.filter((topic) => topic.subjectId === input.subjectId).length + 1,
  };
  store.topics.push(record);
  await saveTopic(record);
  return record;
}

export async function updateTopic(
  id: string,
  input: Partial<{ name: string }>
) {
  await ensureStore();
  const topic = getStore().topics.find((item) => item.id === id);
  if (!topic) throw new Error("Topik tidak ditemukan.");
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Nama topik wajib diisi.");
    topic.name = input.name.trim();
    topic.slug = slugify(input.name);
  }
  await saveTopic(topic);
  return topic;
}

export interface PackageInput {
  subjectId: string;
  title: string;
  type: PackageRecord["type"];
  description: string;
  durationMinutes: number;
  maxAttempts: number | null;
  scoringMode: PackageRecord["scoringMode"];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  status: PackageRecord["status"];
  availableFrom: string | null;
  availableTo: string | null;
  classIds: string[];
  questions: { questionId: string; points: number }[];
}

function buildPackageQuestions(input: PackageInput) {
  return input.questions.map((item, index) => ({
    questionId: item.questionId,
    sortOrder: index + 1,
    points: item.points > 0 ? item.points : 1,
  }));
}

export async function createPackage(input: PackageInput) {
  await ensureStore();
  const store = getStore();
  if (!input.title.trim()) throw new Error("Judul paket wajib diisi.");
  if (!store.subjects.some((subject) => subject.id === input.subjectId))
    throw new Error("Mata pelajaran tidak ditemukan.");
  if (input.questions.length === 0)
    throw new Error("Paket harus memiliki minimal satu soal.");
  if (input.durationMinutes <= 0) throw new Error("Durasi harus lebih dari 0 menit.");

  let slug = slugify(input.title);
  if (store.packages.some((pkg) => pkg.slug === slug)) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const record: PackageRecord = {
    id: `pkg-${randomUUID()}`,
    subjectId: input.subjectId,
    title: input.title.trim(),
    slug,
    type: input.type,
    description: input.description.trim(),
    durationMinutes: input.durationMinutes,
    maxAttempts: input.maxAttempts,
    scoringMode: input.scoringMode,
    shuffleQuestions: input.shuffleQuestions,
    shuffleOptions: input.shuffleOptions,
    showExplanation: input.showExplanation,
    status: input.status,
    availableFrom: input.availableFrom,
    availableTo: input.availableTo,
    questions: buildPackageQuestions(input),
    classIds: input.classIds,
    createdAt: new Date().toISOString(),
  };
  store.packages.push(record);
  await savePackage(record);
  return record;
}

export async function updatePackage(id: string, input: PackageInput) {
  await ensureStore();
  const record = getStore().packages.find((pkg) => pkg.id === id);
  if (!record) throw new Error("Paket tidak ditemukan.");
  if (!input.title.trim()) throw new Error("Judul paket wajib diisi.");
  if (input.questions.length === 0)
    throw new Error("Paket harus memiliki minimal satu soal.");
  if (input.durationMinutes <= 0) throw new Error("Durasi harus lebih dari 0 menit.");

  record.subjectId = input.subjectId;
  record.title = input.title.trim();
  record.type = input.type;
  record.description = input.description.trim();
  record.durationMinutes = input.durationMinutes;
  record.maxAttempts = input.maxAttempts;
  record.scoringMode = input.scoringMode;
  record.shuffleQuestions = input.shuffleQuestions;
  record.shuffleOptions = input.shuffleOptions;
  record.showExplanation = input.showExplanation;
  record.status = input.status;
  record.availableFrom = input.availableFrom;
  record.availableTo = input.availableTo;
  record.questions = buildPackageQuestions(input);
  record.classIds = input.classIds;
  await savePackage(record);
  return record;
}

export async function setPackageStatus(
  id: string,
  status: PackageRecord["status"]
) {
  await ensureStore();
  const record = getStore().packages.find((pkg) => pkg.id === id);
  if (!record) throw new Error("Paket tidak ditemukan.");
  record.status = status;
  await savePackage(record);
  return record;
}

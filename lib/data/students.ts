import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getStore } from "./store";
import {
  ensureStore,
  isRemoteBackend,
  saveClass,
  saveProfile,
  saveStudent,
} from "@/lib/supabase/store-sync";
import { deleteAuthUser, provisionAuthUser, updateAuthUser } from "@/lib/supabase/admin";
import { studentAuthEmail } from "@/lib/supabase/config";
import type {
  AttemptRecord,
  ClassRecord,
  StudentRecord,
  UserRecord,
} from "./types";

export interface StudentView extends StudentRecord {
  user: UserRecord;
  classroom: ClassRecord | null;
  attemptCount: number;
  averageScore: number | null;
  lastScore: number | null;
}

export interface ClassView extends ClassRecord {
  tutor: UserRecord | null;
  studentCount: number;
  packageCount: number;
}

export interface CreateStudentInput {
  name: string;
  nis: string;
  classId: string | null;
  school?: string | null;
  gender?: "L" | "P" | null;
  parentPhone?: string | null;
  password?: string;
}

function submittedAttempts(studentId: string): AttemptRecord[] {
  return getStore().attempts.filter(
    (attempt) =>
      attempt.studentId === studentId && attempt.status === "submitted" && attempt.score !== null
  );
}

export function toStudentView(student: StudentRecord): StudentView {
  const store = getStore();
  const attempts = submittedAttempts(student.id);
  const average =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((total, attempt) => total + (attempt.score ?? 0), 0) /
            attempts.length
        )
      : null;
  const sorted = attempts
    .slice()
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return {
    ...student,
    user: store.users.find((user) => user.id === student.userId)!,
    classroom: store.classes.find((item) => item.id === student.classId) ?? null,
    attemptCount: attempts.length,
    averageScore: average,
    lastScore: sorted[0]?.score ?? null,
  };
}

export async function listStudents(filter?: {
  search?: string;
  classId?: string;
  status?: "active" | "inactive" | "all";
}): Promise<StudentView[]> {
  await ensureStore();
  const search = filter?.search?.trim().toLowerCase();
  return getStore()
    .students.filter((student) => {
      if (filter?.classId && student.classId !== filter.classId) return false;
      if (filter?.status === "active" && !student.isActive) return false;
      if (filter?.status === "inactive" && student.isActive) return false;
      if (search) {
        const user = getStore().users.find((item) => item.id === student.userId);
        const haystack = `${user?.name ?? ""} ${student.nis}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const userA = getStore().users.find((user) => user.id === a.userId)?.name ?? "";
      const userB = getStore().users.find((user) => user.id === b.userId)?.name ?? "";
      return userA.localeCompare(userB);
    })
    .map(toStudentView);
}

export async function getStudentById(id: string) {
  await ensureStore();
  const student = getStore().students.find((item) => item.id === id);
  return student ? toStudentView(student) : null;
}

export async function getStudentByUserId(userId: string) {
  await ensureStore();
  const student = getStore().students.find((item) => item.userId === userId);
  return student ? toStudentView(student) : null;
}

export async function createStudent(input: CreateStudentInput) {
  await ensureStore();
  const store = getStore();
  const nis = input.nis.trim();
  if (!input.name.trim()) throw new Error("Nama siswa wajib diisi.");
  if (!nis) throw new Error("NIS wajib diisi.");
  if (store.students.some((student) => student.nis === nis))
    throw new Error(`NIS ${nis} sudah digunakan.`);
  if (store.users.some((user) => user.username?.toLowerCase() === nis.toLowerCase()))
    throw new Error(`Username/NIS ${nis} sudah digunakan.`);

  const password = input.password?.trim() || "siswa123";
  const name = input.name.trim();
  const email = studentAuthEmail(nis);

  let userId = `u-${randomUUID()}`;
  let passwordHash = "";
  if (isRemoteBackend()) {
    const authUser = await provisionAuthUser({
      email,
      password,
      name,
      role: "STUDENT",
    });
    userId = authUser.id;
  } else {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const user: UserRecord = {
    id: userId,
    name,
    username: nis,
    email,
    passwordHash,
    role: "STUDENT",
    isActive: true,
    mustChangePassword: true,
    lastLoginAt: null,
  };

  const student: StudentRecord = {
    id: `st-${randomUUID()}`,
    userId,
    nis,
    classId: input.classId || null,
    school: input.school?.trim() || null,
    gender: input.gender ?? null,
    parentPhone: input.parentPhone?.trim() || null,
    isActive: true,
  };

  store.users.push(user);
  store.students.push(student);
  try {
    await saveProfile(user);
    await saveStudent(student);
  } catch (error) {
    // Jangan tinggalkan akun Auth tanpa baris siswa bila penyimpanan gagal.
    store.users = store.users.filter((item) => item.id !== user.id);
    store.students = store.students.filter((item) => item.id !== student.id);
    if (isRemoteBackend()) {
      await deleteAuthUser(userId).catch(() => undefined);
    }
    throw error;
  }
  return { student: toStudentView(student), temporaryPassword: password };
}

export async function updateStudent(
  id: string,
  input: Partial<CreateStudentInput>
) {
  await ensureStore();
  const store = getStore();
  const student = store.students.find((item) => item.id === id);
  if (!student) throw new Error("Siswa tidak ditemukan.");
  const user = store.users.find((item) => item.id === student.userId);
  if (!user) throw new Error("Akun siswa tidak ditemukan.");

  const previousNis = student.nis;
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Nama siswa wajib diisi.");
    user.name = input.name.trim();
  }
  if (input.nis !== undefined) {
    const nis = input.nis.trim();
    if (!nis) throw new Error("NIS wajib diisi.");
    if (
      store.students.some(
        (item) => item.id !== id && item.nis === nis
      )
    )
      throw new Error(`NIS ${nis} sudah digunakan.`);
    student.nis = nis;
    user.username = nis;
    user.email = studentAuthEmail(nis);
  }
  if (input.classId !== undefined) student.classId = input.classId || null;
  if (input.school !== undefined) student.school = input.school?.trim() || null;
  if (input.gender !== undefined) student.gender = input.gender ?? null;
  if (input.parentPhone !== undefined)
    student.parentPhone = input.parentPhone?.trim() || null;

  if (isRemoteBackend()) {
    await updateAuthUser(user.id, {
      name: user.name,
      ...(student.nis !== previousNis ? { email: studentAuthEmail(student.nis) } : {}),
    });
  }
  await saveProfile(user);
  await saveStudent(student);
  return toStudentView(student);
}

export async function setStudentActive(id: string, active: boolean) {
  await ensureStore();
  const store = getStore();
  const student = store.students.find((item) => item.id === id);
  if (!student) throw new Error("Siswa tidak ditemukan.");
  const user = store.users.find((item) => item.id === student.userId);
  student.isActive = active;
  if (user) user.isActive = active;
  if (isRemoteBackend()) {
    await updateAuthUser(student.userId, { disabled: !active });
  }
  await saveStudent(student);
  if (user) await saveProfile(user);
  return toStudentView(student);
}

export async function resetStudentPassword(id: string) {
  await ensureStore();
  const store = getStore();
  const student = store.students.find((item) => item.id === id);
  if (!student) throw new Error("Siswa tidak ditemukan.");
  const user = store.users.find((item) => item.id === student.userId);
  if (!user) throw new Error("Akun siswa tidak ditemukan.");
  const temporaryPassword = randomUUID().replace(/-/g, "").slice(0, 10);

  if (isRemoteBackend()) {
    await updateAuthUser(user.id, { password: temporaryPassword });
  } else {
    user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
  }
  user.mustChangePassword = true;
  await saveProfile(user);
  return temporaryPassword;
}

export async function listClasses(): Promise<ClassView[]> {
  await ensureStore();
  const store = getStore();
  return store.classes
    .filter((item) => item.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((classroom) => ({
      ...classroom,
      tutor: store.users.find((item) => item.id === classroom.tutorId) ?? null,
      studentCount: store.students.filter(
        (student) => student.classId === classroom.id && student.isActive
      ).length,
      packageCount: store.packages.filter(
        (pkg) => pkg.status === "PUBLISHED" && pkg.classIds.includes(classroom.id)
      ).length,
    }));
}

export async function getClassById(id: string) {
  await ensureStore();
  const classroom = getStore().classes.find((item) => item.id === id);
  if (!classroom) return null;
  return (await listClasses()).find((item) => item.id === id) ?? null;
}

export async function getTutorClasses(tutorId: string) {
  const classes = await listClasses();
  return classes.filter((item) => item.tutorId === tutorId);
}

export async function getClassStudents(classId: string) {
  return listStudents({ classId, status: "active" });
}

export async function listTutors() {
  await ensureStore();
  return getStore().users.filter((user) => user.role === "TUTOR" && user.isActive);
}

export async function createClass(input: {
  name: string;
  academicYear: string;
  tutorId: string | null;
}) {
  await ensureStore();
  const store = getStore();
  if (!input.name.trim()) throw new Error("Nama kelas wajib diisi.");
  if (
    store.classes.some(
      (item) =>
        item.name.toLowerCase() === input.name.trim().toLowerCase() &&
        item.academicYear === input.academicYear
    )
  )
    throw new Error("Kelas dengan nama dan tahun ajaran yang sama sudah ada.");

  const classroom: ClassRecord = {
    id: `cls-${randomUUID()}`,
    name: input.name.trim(),
    academicYear: input.academicYear,
    tutorId: input.tutorId || null,
    isActive: true,
  };
  store.classes.push(classroom);
  await saveClass(classroom);
  return classroom;
}

export async function updateClass(
  id: string,
  input: { name?: string; academicYear?: string; tutorId?: string | null; isActive?: boolean }
) {
  await ensureStore();
  const classroom = getStore().classes.find((item) => item.id === id);
  if (!classroom) throw new Error("Kelas tidak ditemukan.");
  if (input.name !== undefined) classroom.name = input.name.trim();
  if (input.academicYear !== undefined)
    classroom.academicYear = input.academicYear.trim();
  if (input.tutorId !== undefined) classroom.tutorId = input.tutorId || null;
  if (input.isActive !== undefined) classroom.isActive = input.isActive;
  await saveClass(classroom);
  return classroom;
}

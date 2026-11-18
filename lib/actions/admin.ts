"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createClass,
  createStudent,
  resetStudentPassword,
  setStudentActive,
  updateClass,
  updateStudent,
} from "@/lib/data/students";
import {
  createPackage,
  createSubject,
  createTopic,
  setPackageStatus,
  updatePackage,
  updateSubject,
  type PackageInput,
} from "@/lib/data/catalog";
import { updateSettings } from "@/lib/data/settings";
import type { PackageStatus } from "@/lib/types";
import type { SubjectRecord } from "@/lib/data/types";

function back(path: string, params: Record<string, string>) {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function failure(path: string, error: unknown) {
  back(path, {
    error: error instanceof Error ? error.message : "Terjadi kesalahan.",
  });
}

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function jakartaDate(value: FormDataEntryValue | null, endOfDay = false): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const suffix = endOfDay ? "T23:59:59+07:00" : "T00:00:00+07:00";
  const date = new Date(`${text}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/* ------------------------------- Siswa -------------------------------- */

export async function createStudentAction(formData: FormData) {
  await requireAdmin();
  try {
    const result = await createStudent({
      name: String(formData.get("name") ?? ""),
      nis: String(formData.get("nis") ?? ""),
      classId: optional(formData.get("classId")),
      school: optional(formData.get("school")),
      gender: (String(formData.get("gender") ?? "") || null) as "L" | "P" | null,
      parentPhone: optional(formData.get("parentPhone")),
      password: optional(formData.get("password")) ?? undefined,
    });
    back("/admin/siswa", {
      ok: `Siswa ${result.student.user.name} dibuat. Password sementara: ${result.temporaryPassword}`,
    });
  } catch (error) {
    failure("/admin/siswa", error);
  }
}

export async function updateStudentAction(formData: FormData) {
  await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  try {
    await updateStudent(studentId, {
      name: String(formData.get("name") ?? ""),
      nis: String(formData.get("nis") ?? ""),
      classId: optional(formData.get("classId")),
      school: optional(formData.get("school")),
      gender: (String(formData.get("gender") ?? "") || null) as "L" | "P" | null,
      parentPhone: optional(formData.get("parentPhone")),
    });
    back("/admin/siswa", { ok: "Data siswa diperbarui." });
  } catch (error) {
    failure(`/admin/siswa/${studentId}`, error);
  }
}

export async function toggleStudentActiveAction(formData: FormData) {
  await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  try {
    await setStudentActive(studentId, active);
    back("/admin/siswa", {
      ok: active ? "Akun siswa diaktifkan." : "Akun siswa dinonaktifkan.",
    });
  } catch (error) {
    failure("/admin/siswa", error);
  }
}

export async function resetStudentPasswordAction(formData: FormData) {
  await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  try {
    const temporaryPassword = await resetStudentPassword(studentId);
    back("/admin/siswa", {
      ok: `Password sementara baru: ${temporaryPassword}`,
    });
  } catch (error) {
    failure("/admin/siswa", error);
  }
}

/* ------------------------------- Kelas -------------------------------- */

export async function createClassAction(formData: FormData) {
  await requireAdmin();
  try {
    await createClass({
      name: String(formData.get("name") ?? ""),
      academicYear: String(formData.get("academicYear") ?? "2026/2027"),
      tutorId: optional(formData.get("tutorId")),
    });
    back("/admin/kelas", { ok: "Kelas baru dibuat." });
  } catch (error) {
    failure("/admin/kelas", error);
  }
}

export async function updateClassAction(formData: FormData) {
  await requireAdmin();
  const classId = String(formData.get("classId") ?? "");
  try {
    await updateClass(classId, {
      name: String(formData.get("name") ?? ""),
      academicYear: String(formData.get("academicYear") ?? "2026/2027"),
      tutorId: optional(formData.get("tutorId")),
    });
    back("/admin/kelas", { ok: "Kelas diperbarui." });
  } catch (error) {
    failure(`/admin/kelas/${classId}`, error);
  }
}

/* ---------------------------- Mapel & topik --------------------------- */

export async function createSubjectAction(formData: FormData) {
  await requireAdmin();
  try {
    await createSubject({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: String(formData.get("color") ?? "indigo") as SubjectRecord["color"],
      icon: String(formData.get("icon") ?? "book-open"),
    });
    back("/admin/mapel", { ok: "Mata pelajaran ditambahkan." });
  } catch (error) {
    failure("/admin/mapel", error);
  }
}

export async function toggleSubjectActiveAction(formData: FormData) {
  await requireAdmin();
  const subjectId = String(formData.get("subjectId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  try {
    await updateSubject(subjectId, { isActive: active });
    back("/admin/mapel", {
      ok: active ? "Mata pelajaran diaktifkan." : "Mata pelajaran dinonaktifkan.",
    });
  } catch (error) {
    failure("/admin/mapel", error);
  }
}

export async function createTopicAction(formData: FormData) {
  await requireAdmin();
  try {
    await createTopic({
      subjectId: String(formData.get("subjectId") ?? ""),
      name: String(formData.get("name") ?? ""),
    });
    back("/admin/mapel", { ok: "Topik ditambahkan." });
  } catch (error) {
    failure("/admin/mapel", error);
  }
}

/* ------------------------------- Paket -------------------------------- */

function parsePackageForm(formData: FormData): PackageInput {
  const questionIds = formData.getAll("questionIds").map(String);
  return {
    subjectId: String(formData.get("subjectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "latihan") as PackageInput["type"],
    description: String(formData.get("description") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes") ?? 0),
    maxAttempts: optional(formData.get("maxAttempts"))
      ? Number(formData.get("maxAttempts"))
      : null,
    scoringMode: String(formData.get("scoringMode") ?? "all_or_nothing") as PackageInput["scoringMode"],
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    showExplanation: formData.get("showExplanation") === "on",
    status: String(formData.get("status") ?? "DRAFT") as PackageStatus,
    availableFrom: jakartaDate(formData.get("availableFrom")),
    availableTo: jakartaDate(formData.get("availableTo"), true),
    classIds: formData.getAll("classIds").map(String).filter(Boolean),
    questions: questionIds.map((questionId) => ({
      questionId,
      points: Number(formData.get(`points-${questionId}`) ?? 1) || 1,
    })),
  };
}

export async function createPackageAction(formData: FormData) {
  await requireAdmin();
  try {
    await createPackage(parsePackageForm(formData));
    back("/admin/paket", { ok: "Paket dibuat." });
  } catch (error) {
    failure("/admin/paket/baru", error);
  }
}

export async function updatePackageAction(formData: FormData) {
  await requireAdmin();
  const packageId = String(formData.get("packageId") ?? "");
  try {
    await updatePackage(packageId, parsePackageForm(formData));
    back("/admin/paket", { ok: "Paket diperbarui." });
  } catch (error) {
    failure(`/admin/paket/${packageId}`, error);
  }
}

export async function setPackageStatusAction(formData: FormData) {
  await requireAdmin();
  const packageId = String(formData.get("packageId") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as PackageStatus;
  try {
    await setPackageStatus(packageId, status);
    back("/admin/paket", { ok: "Status paket diperbarui." });
  } catch (error) {
    failure("/admin/paket", error);
  }
}

/* ----------------------------- Pengaturan ----------------------------- */

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  try {
    await updateSettings({
      appName: String(formData.get("appName") ?? ""),
      bimbelName: String(formData.get("bimbelName") ?? ""),
      academicYear: String(formData.get("academicYear") ?? ""),
      contactWhatsapp: String(formData.get("contactWhatsapp") ?? ""),
      heroTitle: String(formData.get("heroTitle") ?? ""),
      heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
      defaultInstructions: String(formData.get("defaultInstructions") ?? ""),
    });
    back("/admin/pengaturan", { ok: "Pengaturan disimpan." });
  } catch (error) {
    failure("/admin/pengaturan", error);
  }
}

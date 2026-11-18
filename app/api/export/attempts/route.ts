import { NextResponse } from "next/server";
import type { AttemptStatus } from "@/lib/types";
import { getApiUser } from "@/lib/auth/guards";
import { listAttempts, type AttemptSummary } from "@/lib/data/attempts";
import { getClassStudents, getTutorClasses } from "@/lib/data/students";

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: AttemptSummary[]) {
  const header = [
    "Nama",
    "NIS",
    "Kelas",
    "Mata Pelajaran",
    "Paket",
    "Jenis",
    "Status",
    "Mulai",
    "Dikumpulkan",
    "Skor",
    "Benar",
    "Salah",
    "Kosong",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const item of rows) {
    lines.push(
      [
        item.studentName,
        item.studentNis,
        item.className ?? "",
        item.subject.name,
        item.package.title,
        item.package.type === "tryout" ? "Tryout" : "Latihan",
        item.attempt.status === "submitted"
          ? "Selesai"
          : item.attempt.status === "expired"
            ? "Waktu habis"
            : "Berjalan",
        item.attempt.startedAt,
        item.attempt.submittedAt ?? "",
        item.attempt.score ?? "",
        item.attempt.correctCount,
        item.attempt.incorrectCount,
        item.attempt.unansweredCount,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

export async function GET(request: Request) {
  const user = await getApiUser(["TUTOR", "ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const url = new URL(request.url);
  const classId = url.searchParams.get("classId") ?? undefined;
  const subjectId = url.searchParams.get("subjectId") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;
  const status: AttemptStatus | "ALL" =
    statusParam && ["submitted", "in_progress", "expired"].includes(statusParam)
      ? (statusParam as AttemptStatus)
      : "ALL";

  let allowedStudentIds: Set<string> | null = null;
  if (user.role === "TUTOR") {
    allowedStudentIds = new Set<string>();
    const classes = await getTutorClasses(user.id);
    for (const classroom of classes) {
      if (classId && classroom.id !== classId) continue;
      const students = await getClassStudents(classroom.id);
      for (const student of students) allowedStudentIds.add(student.id);
    }
  }

  const attempts = await listAttempts({
    classId: user.role === "ADMIN" ? classId : undefined,
    subjectId: subjectId && subjectId !== "all" ? subjectId : undefined,
    status,
  });

  const filtered = allowedStudentIds
    ? attempts.filter((item) => allowedStudentIds!.has(item.attempt.studentId))
    : attempts;

  const csv = toCsv(filtered);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hasil-tka-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

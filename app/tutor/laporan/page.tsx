import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Download,
  Filter,
  RotateCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireTutor } from "@/lib/auth/guards";
import { listAttempts } from "@/lib/data/attempts";
import { getSubjects } from "@/lib/data/catalog";
import { getClassStudents, getTutorClasses } from "@/lib/data/students";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan" };

export default async function TutorReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string;
    subjectId?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const user = await requireTutor();
  const params = await searchParams;
  const [classes, subjects] = await Promise.all([
    getTutorClasses(user.id),
    getSubjects(),
  ]);

  const allowedStudents = new Set<string>();
  const selectedClassStudentIds = new Set<string>();
  const selectedClassExists = classes.some(
    (classroom) => classroom.id === params.classId
  );

  for (const classroom of classes) {
    const students = await getClassStudents(classroom.id);
    for (const student of students) {
      allowedStudents.add(student.id);
      if (selectedClassExists && classroom.id === params.classId) {
        selectedClassStudentIds.add(student.id);
      }
    }
  }

  const all = (await listAttempts({ status: "ALL" })).filter((item) =>
    allowedStudents.has(item.attempt.studentId)
  );

  const attempts = all.filter((item) => {
    if (selectedClassExists && !selectedClassStudentIds.has(item.attempt.studentId)) {
      return false;
    }
    if (
      params.subjectId &&
      params.subjectId !== "all" &&
      item.subject.id !== params.subjectId
    )
      return false;
    if (params.status && params.status !== "all" && item.attempt.status !== params.status)
      return false;
    if (params.search) {
      const needle = params.search.toLowerCase();
      const haystack = `${item.studentName} ${item.studentNis} ${item.package.title}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const submitted = all.filter(
    (item) => item.attempt.status === "submitted" && item.attempt.score !== null
  );
  const average =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((total, item) => total + (item.attempt.score ?? 0), 0) /
            submitted.length
        )
      : null;
  const best =
    submitted.length > 0
      ? Math.max(...submitted.map((item) => item.attempt.score ?? 0))
      : null;

  const exportParams = new URLSearchParams();
  if (params.classId) exportParams.set("classId", params.classId);
  if (params.subjectId) exportParams.set("subjectId", params.subjectId);
  if (params.status) exportParams.set("status", params.status);
  const exportHref = `/api/export/attempts?${exportParams.toString()}`;

  return (
    <div>
      <PageHeader
        eyebrow="Laporan"
        title="Rekap hasil siswa"
        description="Filter hasil berdasarkan kelas, mata pelajaran, dan status pengerjaan."
        actions={
          <ButtonLink href={exportHref} variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total attempt"
          value={all.length}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Selesai dinilai"
          value={submitted.length}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Rata-rata"
          value={average ?? "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Skor tertinggi"
          value={best ?? "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <Card className="mt-5">
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label htmlFor="classId" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Kelas
              </label>
              <Select
                id="classId"
                name="classId"
                defaultValue={params.classId ?? ""}
                className="h-10 text-[13px]"
              >
                <option value="">Semua kelas</option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[150px] flex-1">
              <label htmlFor="subjectId" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Mata pelajaran
              </label>
              <Select
                id="subjectId"
                name="subjectId"
                defaultValue={params.subjectId ?? "all"}
                className="h-10 text-[13px]"
              >
                <option value="all">Semua mapel</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label htmlFor="status" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Status
              </label>
              <Select
                id="status"
                name="status"
                defaultValue={params.status ?? "all"}
                className="h-10 text-[13px]"
              >
                <option value="all">Semua status</option>
                <option value="submitted">Selesai</option>
                <option value="in_progress">Sedang dikerjakan</option>
                <option value="expired">Waktu habis</option>
              </Select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label htmlFor="search" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Cari siswa / paket
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Nama, NIS, atau paket"
                className="h-10 text-[13px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            <Link
              href="/tutor/laporan"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Link>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5">
        {attempts.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Siswa</Th>
                <Th>Kelas</Th>
                <Th>Paket</Th>
                <Th>Mapel</Th>
                <Th>Tanggal</Th>
                <Th className="text-center">Skor</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {attempts.map((item) => (
                <Tr key={item.attempt.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{item.studentName}</p>
                    <p className="text-[11px] text-slate-400">{item.studentNis}</p>
                  </Td>
                  <Td className="text-slate-600">{item.className ?? "—"}</Td>
                  <Td>
                    <p className="max-w-[220px] truncate text-slate-700">
                      {item.package.title}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone="slate">{item.subject.name}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[11px] text-slate-400">
                    {formatDateTime(item.attempt.submittedAt ?? item.attempt.startedAt)}
                  </Td>
                  <Td className="text-center">
                    <ScoreBadge score={item.attempt.score} />
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        item.attempt.status === "submitted"
                          ? "sky"
                          : item.attempt.status === "expired"
                            ? "amber"
                            : "brand"
                      }
                    >
                      {item.attempt.status === "submitted"
                        ? "Selesai"
                        : item.attempt.status === "expired"
                          ? "Waktu habis"
                          : "Berjalan"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={
                        item.attempt.status === "in_progress"
                          ? `/tutor/kelas/${classes.find((c) => c.name === item.className)?.id ?? ""}`
                          : `/tutor/hasil/${item.attempt.id}`
                      }
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Lihat
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="Tidak ada hasil yang cocok"
              description="Coba ubah filter atau reset untuk melihat semua attempt."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

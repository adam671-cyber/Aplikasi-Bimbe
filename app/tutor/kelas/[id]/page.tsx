import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Download,
  School,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireTutor } from "@/lib/auth/guards";
import { listAttempts } from "@/lib/data/attempts";
import { getTutorClasses } from "@/lib/data/students";
import { getClassReport } from "@/lib/data/stats";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Kelas" };

export default async function TutorClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireTutor();
  const { id } = await params;

  const classes = await getTutorClasses(user.id);
  const classroom = classes.find((item) => item.id === id);
  if (!classroom) notFound();

  const [report, attempts] = await Promise.all([
    getClassReport(id),
    listAttempts({ classId: id, status: "ALL" }),
  ]);
  if (!report) notFound();

  const latestByStudent = new Map<string, string>();
  for (const item of attempts) {
    if (!latestByStudent.has(item.attempt.studentId)) {
      latestByStudent.set(item.attempt.studentId, item.attempt.id);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Detail kelas"
        title={report.classroom.name}
        description={`Tahun ajaran ${report.classroom.academicYear} · ${report.totals.students} siswa aktif`}
        backHref="/tutor/kelas"
        backLabel="Kembali ke kelas"
        actions={
          <>
            <ButtonLink
              href={`/api/export/attempts?classId=${id}`}
              variant="secondary"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </ButtonLink>
            <ButtonLink href={`/tutor/laporan?classId=${id}`} size="sm">
              <BarChart3 className="h-4 w-4" />
              Laporan lengkap
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Siswa aktif"
          value={report.totals.students}
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Attempt selesai"
          value={report.totals.submitted}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Rata-rata skor"
          value={report.totals.average ?? "—"}
          hint={
            report.totals.highest !== null
              ? `Tertinggi ${report.totals.highest} · terendah ${report.totals.lowest}`
              : "Belum ada nilai"
          }
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Partisipasi"
          value={`${report.totals.completion}%`}
          hint="Siswa dengan minimal 1 attempt"
          icon={<Target className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {report.totals.completion < 100 ? (
        <Alert variant="info" className="mt-4">
          {report.totals.students - report.students.filter((row) => row.attempts > 0).length}{" "}
          siswa belum mengerjakan paket apa pun. Ingatkan lewat grup kelas.
        </Alert>
      ) : null}

      <Card className="mt-5">
        <CardHeader
          title="Rekap nilai siswa"
          description="Urut nama. Klik “Lihat” untuk membuka hasil attempt terbaru."
        />
        {report.students.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama siswa</Th>
                <Th>NIS</Th>
                <Th className="text-center">Attempt</Th>
                <Th className="text-center">Rata-rata</Th>
                <Th className="text-center">Terbaik</Th>
                <Th>Predikat</Th>
                <Th>Terakhir</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {report.students.map((row) => {
                const latestId = latestByStudent.get(row.student.id);
                return (
                  <Tr key={row.student.id}>
                    <Td>
                      <span className="font-medium text-slate-800">
                        {row.student.user.name}
                      </span>
                    </Td>
                    <Td className="tabular-nums text-slate-500">{row.student.nis}</Td>
                    <Td className="text-center tabular-nums">{row.attempts}</Td>
                    <Td className="text-center">
                      <ScoreBadge score={row.average} />
                    </Td>
                    <Td className="text-center tabular-nums text-slate-600">
                      {row.best ?? "—"}
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          row.status === "Sangat baik"
                            ? "emerald"
                            : row.status === "Baik"
                              ? "brand"
                              : row.status === "Perlu latihan"
                                ? "amber"
                                : row.status === "Belum ada nilai"
                                  ? "slate"
                                  : "rose"
                        }
                      >
                        {row.status}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-[11px] text-slate-400">
                      {row.lastSubmittedAt ? formatDateTime(row.lastSubmittedAt) : "—"}
                    </Td>
                    <Td className="text-right">
                      {latestId ? (
                        <Link
                          href={`/tutor/hasil/${latestId}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Lihat
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<School className="h-5 w-5" />}
              title="Belum ada siswa"
              description="Admin bimbel belum menambahkan siswa ke kelas ini."
            />
          </div>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="Soal tersulit di kelas ini"
          description="Berdasarkan persentase jawaban benar pada attempt yang sudah dikumpulkan."
        />
        <CardContent className="space-y-3">
          {report.hardest.length ? (
            report.hardest.map((item) => (
              <div key={item.question}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-[12px] leading-5 text-slate-700">
                    {item.question}
                  </p>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                    {item.percent}%
                  </span>
                </div>
                <Progress
                  value={item.percent}
                  tone={
                    item.percent >= 70
                      ? "emerald"
                      : item.percent >= 40
                        ? "amber"
                        : "rose"
                  }
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  {item.total} jawaban dianalisis
                </p>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-slate-400">
              Belum ada cukup data untuk analisis soal.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

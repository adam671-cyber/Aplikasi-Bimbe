import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileQuestion,
  GraduationCap,
  Layers,
  Package,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminOverview } from "@/lib/data/stats";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda Admin" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const overview = await getAdminOverview();
  const maxDistribution = Math.max(
    1,
    ...overview.distribution.map((bucket) => bucket.count)
  );

  return (
    <div>
      <PageHeader
        eyebrow="Ruang admin"
        title="Operasional bimbel"
        description="Ringkasan siswa, bank soal, paket, dan hasil terbaru."
        actions={
          <>
            <ButtonLink href="/admin/soal/baru" variant="secondary" size="sm">
              <FileQuestion className="h-4 w-4" />
              Tambah soal
            </ButtonLink>
            <ButtonLink href="/admin/hasil" size="sm">
              <BarChart3 className="h-4 w-4" />
              Laporan hasil
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Siswa aktif"
          value={overview.totals.students}
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Kelas"
          value={overview.totals.classes}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Soal aktif"
          value={overview.totals.questions}
          icon={<FileQuestion className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Paket publik"
          value={overview.totals.packages}
          icon={<Package className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Attempt hari ini"
          value={overview.totals.attemptsToday}
          icon={<Layers className="h-5 w-5" />}
          tone="rose"
        />
        <StatCard
          label="Rata-rata skor"
          value={overview.totals.averageScore ?? "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="brand"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Performa per mata pelajaran"
            description="Rata-rata skor attempt yang sudah dikumpulkan."
            action={
              <ButtonLink href="/admin/mapel" variant="ghost" size="sm">
                Kelola mapel
                <ChevronRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <CardContent className="space-y-4">
            {overview.subjects.map((item) => (
              <div key={item.subject.id}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-medium text-slate-700">
                    {item.subject.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {item.attempts} attempt ·{" "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {item.average ?? "—"}
                    </span>
                  </span>
                </div>
                <Progress
                  value={item.average ?? 0}
                  tone={
                    (item.average ?? 0) >= 80
                      ? "emerald"
                      : (item.average ?? 0) >= 60
                        ? "brand"
                        : (item.average ?? 0) >= 40
                          ? "amber"
                          : "rose"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Distribusi skor"
            description="Sebaran nilai seluruh attempt yang selesai."
          />
          <CardContent className="space-y-3">
            {overview.distribution.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[11px] font-medium text-slate-500">
                  {bucket.label}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className={
                      bucket.tone === "emerald"
                        ? "h-full rounded-lg bg-emerald-500"
                        : bucket.tone === "indigo"
                          ? "h-full rounded-lg bg-brand-500"
                          : bucket.tone === "amber"
                            ? "h-full rounded-lg bg-amber-500"
                            : "h-full rounded-lg bg-rose-500"
                    }
                    style={{
                      width: `${Math.max(
                        bucket.count ? 6 : 0,
                        (bucket.count / maxDistribution) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-700">
                  {bucket.count}
                </span>
              </div>
            ))}
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                Catatan
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Skor dihitung dari snapshot soal saat ujian, sehingga perubahan
                bank soal tidak mengubah hasil lama.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <CardHeader
            title="Hasil terbaru"
            description="Attempt yang baru dikumpulkan."
            action={
              <ButtonLink href="/admin/hasil" variant="ghost" size="sm">
                Semua hasil
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <TableWrap>
            <thead>
              <tr>
                <Th>Siswa</Th>
                <Th>Paket</Th>
                <Th>Tanggal</Th>
                <Th className="text-center">Skor</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {overview.recent.map((item) => (
                <Tr key={item.attempt.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{item.studentName}</p>
                    <p className="text-[11px] text-slate-400">{item.className ?? "—"}</p>
                  </Td>
                  <Td>
                    <p className="max-w-[200px] truncate text-[12px] text-slate-700">
                      {item.package.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.subject.name}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-[11px] text-slate-400">
                    {formatDateTime(item.attempt.submittedAt)}
                  </Td>
                  <Td className="text-center">
                    <ScoreBadge score={item.attempt.score} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/hasil/${item.attempt.id}`}
                      className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Lihat
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader
            title="Soal tersulit"
            description="Persentase jawaban benar terendah."
          />
          <CardContent className="space-y-3">
            {overview.hardest.length ? (
              overview.hardest.map((item) => (
                <div key={item.questionId}>
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[11px] leading-5 text-slate-600">
                      {item.question}
                    </p>
                    <Badge
                      tone={
                        item.percent >= 70
                          ? "emerald"
                          : item.percent >= 40
                            ? "amber"
                            : "rose"
                      }
                    >
                      {item.percent}%
                    </Badge>
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
                </div>
              ))
            ) : (
              <p className="text-[12px] text-slate-400">
                Belum ada cukup data untuk analisis soal.
              </p>
            )}
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                Saran
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Periksa kembali soal dengan persentase benar rendah. Bisa jadi
                stimulus kurang jelas atau kunci jawaban keliru.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

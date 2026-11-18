import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  School,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireTutor } from "@/lib/auth/guards";
import { getTutorOverview } from "@/lib/data/stats";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda Tutor" };

export default async function TutorOverviewPage() {
  const user = await requireTutor();
  const overview = await getTutorOverview(user.id);

  const studentCount = overview.classes.reduce(
    (total, classroom) => total + classroom.studentCount,
    0
  );
  const submitted = overview.classes.reduce(
    (total, classroom) => total + classroom.submitted,
    0
  );
  const averages = overview.classes
    .map((classroom) => classroom.average)
    .filter((value): value is number => value !== null);
  const average =
    averages.length > 0
      ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length)
      : null;

  return (
    <div>
      <PageHeader
        eyebrow="Ruang tutor"
        title={`Selamat datang, ${user.name.split(" ")[0]}`}
        description="Pantau kelas, hasil terbaru, dan topik yang perlu diperkuat."
        actions={
          <ButtonLink href="/tutor/laporan" size="sm" variant="secondary">
            <BarChart3 className="h-4 w-4" />
            Laporan kelas
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Kelas diampu"
          value={overview.classes.length}
          hint="Kelas aktif"
          icon={<School className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Siswa aktif"
          value={studentCount}
          hint="Seluruh kelas"
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Attempt selesai"
          value={submitted}
          hint="Semua paket"
          icon={<BookOpen className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Rata-rata skor"
          value={average ?? "—"}
          hint="Gabungan kelas"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Kelas saya</h2>
              <p className="text-[12px] text-slate-500">
                Ringkasan performa setiap kelas.
              </p>
            </div>
            <Link
              href="/tutor/kelas"
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Semua kelas →
            </Link>
          </div>
          <div className="space-y-3">
            {overview.classes.length ? (
              overview.classes.map((classroom) => (
                <Card key={classroom.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <School className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-display text-[14px] font-bold text-slate-900">
                          {classroom.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {classroom.studentCount} siswa · TA {classroom.academicYear}
                        </p>
                      </div>
                    </div>
                    <Badge tone="slate">{classroom.submitted} attempt</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 py-2">
                      <p className="font-display text-lg font-bold tabular-nums text-slate-800">
                        {classroom.average ?? "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">Rata-rata</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 py-2">
                      <p className="font-display text-lg font-bold tabular-nums text-emerald-700">
                        {classroom.highest ?? "—"}
                      </p>
                      <p className="text-[10px] text-emerald-600">Tertinggi</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 py-2">
                      <p className="font-display text-lg font-bold tabular-nums text-amber-700">
                        {classroom.lowest ?? "—"}
                      </p>
                      <p className="text-[10px] text-amber-600">Terendah</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <ButtonLink
                      href={`/tutor/kelas/${classroom.id}`}
                      size="sm"
                      variant="secondary"
                    >
                      Buka kelas
                      <ChevronRight className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<School className="h-5 w-5" />}
                title="Belum ada kelas"
                description="Admin bimbel belum menugaskan kelas untuk akun tutor ini."
              />
            )}
          </div>
        </section>

        <Card>
          <CardHeader
            title="Hasil terbaru"
            description="Attempt terakhir dari siswa di kelasmu."
            action={
              <ButtonLink href="/tutor/laporan" variant="ghost" size="sm">
                Laporan
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <CardContent className="space-y-2">
            {overview.recent.length ? (
              overview.recent.map((item) => (
                <Link
                  key={item.attempt.id}
                  href={`/tutor/hasil/${item.attempt.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
                    {item.package.type === "tryout" ? (
                      <Timer className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-800">
                      {item.studentName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {item.package.title} · {formatDateTime(item.attempt.submittedAt)}
                    </p>
                  </div>
                  <ScoreBadge score={item.attempt.score} />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<BookOpen className="h-5 w-5" />}
                title="Belum ada hasil"
                description="Hasil siswa akan muncul setelah mereka menyelesaikan paket."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

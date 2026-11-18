import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  PlayCircle,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PackageCard } from "@/components/package-card";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { requireStudent } from "@/lib/auth/guards";
import {
  getPackagesForStudent,
  getStudentByUserId,
  getStudentDashboard,
  packageAvailability,
} from "@/lib/data";
import { formatClock, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beranda Siswa",
};

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("id-ID", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date())
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function StudentDashboardPage() {
  const user = await requireStudent();
  const [student, dashboard, packages] = await Promise.all([
    getStudentByUserId(user.id),
    getStudentDashboard(user.studentId!),
    getPackagesForStudent(user.studentId!),
  ]);

  const active = dashboard.active[0];
  const tryouts = packages.filter((pkg) => pkg.type === "tryout").slice(0, 2);
  const exercises = packages.filter((pkg) => pkg.type === "latihan").slice(0, 2);
  const remainingSeconds = active
    ? Math.max(
        0,
        Math.floor(
          (new Date(active.attempt.expiresAt).getTime() - Date.now()) / 1000
        )
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-600 via-brand-600 to-violet-600 p-5 text-white shadow-[var(--shadow-float)] sm:p-6">
        <div
          aria-hidden
          className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-14 left-1/3 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
              {greeting()} · {formatDate(new Date())}
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">
              Hai, {user.name.split(" ")[0]}! 👋
            </h1>
            <p className="mt-1.5 max-w-md text-[13px] leading-6 text-brand-100">
              {active
                ? "Ada ujian yang masih berjalan. Lanjutkan sebelum waktunya habis."
                : dashboard.attempts === 0
                  ? "Belum ada riwayat. Mulai latihan pertamamu hari ini, yuk!"
                  : `Kamu sudah menyelesaikan ${dashboard.attempts} paket. Terus tingkatkan, ya!`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {active ? (
                <ButtonLink
                  href={`/ujian/${active.attempt.id}`}
                  className="bg-white text-brand-700 hover:bg-brand-50"
                >
                  <PlayCircle className="h-4 w-4" />
                  Lanjutkan ujian
                </ButtonLink>
              ) : (
                <ButtonLink
                  href="/tryout"
                  className="bg-white text-brand-700 hover:bg-brand-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Mulai tryout
                </ButtonLink>
              )}
              <ButtonLink
                href="/materi"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <BookOpen className="h-4 w-4" />
                Materi
              </ButtonLink>
              <ButtonLink
                href="/riwayat"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                Lihat riwayat
              </ButtonLink>
            </div>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15 sm:block">
            <p className="text-[10px] uppercase tracking-widest text-brand-200">Kelas</p>
            <p className="mt-0.5 font-display text-lg font-bold">
              {student?.classroom?.name ?? "Belum ada kelas"}
            </p>
            <p className="mt-1 text-[11px] text-brand-200">
              NIS {student?.nis} · {student?.school ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Active attempt */}
      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-600 shadow-sm">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-amber-900">
                {active.package.title} — sedang dikerjakan
              </p>
              <p className="mt-0.5 text-[12px] text-amber-700">
                Sisa waktu ± {Math.ceil(remainingSeconds / 60)} menit. Jawaban
                tersimpan otomatis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="amber" className="tabular-nums">
              <Clock3 className="h-3 w-3" />
              {formatClock(remainingSeconds)}
            </Badge>
            <ButtonLink href={`/ujian/${active.attempt.id}`} size="sm">
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Paket selesai"
          value={dashboard.attempts}
          hint="Latihan + tryout"
          icon={<BookOpen className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Rata-rata skor"
          value={dashboard.averageScore ?? "—"}
          hint={dashboard.averageScore === null ? "Belum ada nilai" : "Dari semua attempt"}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Skor terbaik"
          value={dashboard.bestScore ?? "—"}
          hint="Pertahankan!"
          icon={<Award className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Paket tersedia"
          value={packages.length}
          hint="Sesuai kelasmu"
          icon={<Target className="h-5 w-5" />}
          tone="sky"
        />
      </div>

      {/* Continue learning */}
      <section>
        <SectionTitle
          title="Lanjut belajar"
          description="Paket yang tersedia untuk kelasmu."
          action={
            <Link
              href="/latihan"
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Semua latihan →
            </Link>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...tryouts, ...exercises].length ? (
            [...tryouts, ...exercises].map((pkg) => {
              const availability = packageAvailability(pkg);
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  href={`/paket/${pkg.slug}`}
                  open={availability.open}
                  reason={availability.reason}
                  tone="topic"
                />
              );
            })
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                icon={<BookOpen className="h-5 w-5" />}
                title="Belum ada paket untuk kelasmu"
                description="Hubungi tutor untuk mendapatkan akses paket latihan atau tryout."
              />
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Recent results */}
        <Card>
          <CardHeader
            title="Hasil terbaru"
            description="Skor dan status pengerjaan terakhirmu."
            action={
              <ButtonLink href="/riwayat" variant="ghost" size="sm">
                Semua riwayat
                <ChevronRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
          <CardContent className="space-y-2">
            {dashboard.recent.length ? (
              dashboard.recent.map((item) => (
                <Link
                  key={item.attempt.id}
                  href={
                    item.attempt.status === "in_progress"
                      ? `/ujian/${item.attempt.id}`
                      : `/hasil/${item.attempt.id}`
                  }
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
                      {item.package.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(item.attempt.submittedAt ?? item.attempt.startedAt)} ·{" "}
                      {item.subject.name}
                    </p>
                  </div>
                  <ScoreBadge score={item.attempt.score} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={<Award className="h-5 w-5" />}
                title="Belum ada hasil"
                description="Selesaikan satu paket latihan untuk melihat skormu di sini."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        {/* Weak topics */}
        <Card>
          <CardHeader
            title="Topik yang perlu diuat"
            description="Dihitung dari attempt yang sudah selesai."
          />
          <CardContent>
            {dashboard.weakTopics.length ? (
              <div className="space-y-4">
                {dashboard.weakTopics.map((topic, index) => {
                  const tone = topic.percent >= 80 ? "emerald" : topic.percent >= 60 ? "brand" : topic.percent >= 40 ? "amber" : "rose";
                  return (
                    <div key={topic.name}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                          {topic.percent >= 60 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {topic.name}
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                          {topic.percent}%
                        </span>
                      </div>
                      <Progress value={topic.percent} tone={tone} />
                      {index === 0 && topic.percent < 60 ? (
                        <p className="mt-1.5 text-[10px] text-amber-600">
                          Rekomendasi: ulangi latihan pada topik ini.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    Tips belajar
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Kerjakan 1 latihan pendek setiap hari. Konsistensi lebih
                    penting daripada belajar panjang sekali.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-[13px] font-semibold text-slate-700">
                  Analisis belum tersedia
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Selesaikan minimal satu paket agar kami bisa menunjukkan topik
                  yang perlu diperkuat.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

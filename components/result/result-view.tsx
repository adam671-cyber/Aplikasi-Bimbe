import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  RotateCcw,
  Target,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { AttemptResult } from "@/lib/types";
import type { AttemptWithContext } from "@/lib/data/types";
import { abilityLabel, formatDateTime, formatDuration } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DonutScore, Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";

const toneForPercent = (value: number) =>
  value >= 80
    ? "emerald"
    : value >= 60
      ? "brand"
      : value >= 40
        ? "amber"
        : "rose";

export function AttemptResultView({
  context,
  result,
  viewer,
  backHref,
  backLabel,
}: {
  context: AttemptWithContext;
  result: AttemptResult;
  viewer: "student" | "tutor" | "admin";
  backHref: string;
  backLabel: string;
}) {
  const { attempt, package: pkg, subject, studentUser, className } = context;
  const tone = toneForPercent(result.score);
  const expired = attempt.status === "expired";
  const canReview = pkg.showExplanation;

  const reviewHref =
    viewer === "student"
      ? `/ujian/${attempt.id}/review`
      : viewer === "tutor"
        ? `/tutor/hasil/${attempt.id}/review`
        : `/admin/hasil/${attempt.id}/review`;

  return (
    <div>
      <PageHeader
        eyebrow={viewer === "student" ? "Hasil ujian" : "Detail hasil siswa"}
        title={pkg.title}
        description={`${subject.name} · ${formatDateTime(
          attempt.submittedAt ?? attempt.startedAt
        )}`}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          <>
            {canReview ? (
              <ButtonLink href={reviewHref} variant="secondary" size="sm">
                <FileText className="h-4 w-4" />
                Review jawaban
              </ButtonLink>
            ) : null}
            {viewer === "student" ? (
              <ButtonLink href={`/paket/${pkg.slug}`} size="sm">
                <RotateCcw className="h-4 w-4" />
                Ulangi paket
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {expired ? (
        <Alert variant="warning" title="Waktu pengerjaan habis" className="mb-5">
          Ujian ini dikumpulkan otomatis karena waktu habis. Jawaban yang tersimpan
          tetap dinilai seperti biasa.
        </Alert>
      ) : null}

      {viewer !== "student" ? (
        <Card className="mb-5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={studentUser.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800">
                {studentUser.name}
              </p>
              <p className="text-[11px] text-slate-500">
                NIS {context.student.nis}
                {className ? ` · ${className}` : ""}
              </p>
            </div>
            <Badge tone={attempt.status === "submitted" ? "sky" : "amber"}>
              {attempt.status === "submitted" ? "Selesai" : "Waktu habis"}
            </Badge>
            <ScoreBadge score={attempt.score} />
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-600 to-violet-600 px-5 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">
              Skor akhir
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="rounded-full bg-white p-1.5">
                <DonutScore score={result.score} size={116} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold leading-tight">
                  {abilityLabel(result.score)}
                </p>
                <p className="mt-1 text-[11px] text-brand-100">
                  {result.correctCount} dari {result.totalQuestions} soal benar
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand-100">
                  <Timer className="h-3 w-3" />
                  {pkg.scoringMode === "partial"
                    ? "Penilaian parsial"
                    : "Penilaian penuh"}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Mulai</span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(attempt.startedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Dikumpulkan</span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(attempt.submittedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Durasi pengerjaan</span>
              <span className="font-semibold text-slate-800">
                {formatDuration(attempt.startedAt, attempt.submittedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Batas waktu</span>
              <span className="font-semibold text-slate-800">
                {pkg.durationMinutes} menit
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                Rekomendasi
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {result.score >= 80
                  ? "Pertahankan ritme belajar dan coba paket dengan level lebih tinggi."
                  : result.score >= 60
                    ? "Perkuat topik dengan persentase terendah di bawah, lalu ulangi latihan."
                    : "Ulangi pembahasan soal yang salah, lalu kerjakan latihan serupa."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Benar"
              value={result.correctCount}
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              label="Salah"
              value={result.incorrectCount}
              icon={<XCircle className="h-5 w-5" />}
              tone="rose"
            />
            <StatCard
              label="Kosong"
              value={result.unansweredCount}
              icon={<BookOpen className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Total soal"
              value={result.totalQuestions}
              icon={<FileText className="h-5 w-5" />}
              tone="brand"
            />
          </div>

          <Card>
            <CardHeader
              title="Analisis per topik"
              description="Persentase jawaban benar pada setiap topik yang muncul."
            />
            <CardContent className="space-y-4">
              {result.topics.length ? (
                result.topics.map((topic) => (
                  <div key={topic.name}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-slate-700">
                        {topic.name}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                        {topic.correct}/{topic.total} · {topic.percent}%
                      </span>
                    </div>
                    <Progress value={topic.percent} tone={toneForPercent(topic.percent)} />
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate-400">Belum ada data topik.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Analisis level kognitif"
              description="Level C3 sampai C5 menunjukkan kedalaman proses berpikir."
            />
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {result.levels.length ? (
                result.levels.map((level) => (
                  <div
                    key={level.level}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="brand">{level.level}</Badge>
                      <span className="text-[11px] font-semibold tabular-nums text-slate-600">
                        {level.percent}%
                      </span>
                    </div>
                    <Progress
                      value={level.percent}
                      tone={toneForPercent(level.percent)}
                      className="mt-2"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      {level.correct} dari {level.total} soal
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate-400">Belum ada data level.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Soal tercepat untuk diperbaiki
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                {result.topics.length
                  ? `Fokus pada ${result.topics[result.topics.length - 1].name} — topik dengan persentase terendah.`
                  : "Belum ada data yang bisa dianalisis."}
              </p>
              <Link
                href={reviewHref}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Lihat pembahasan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Langkah berikutnya
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                Kerjakan latihan pada topik terlemah, lalu ulangi tryout untuk
                melihat peningkatan skor.
              </p>
              {viewer === "student" ? (
                <Link
                  href="/riwayat"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  Buka riwayat
                  <History className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

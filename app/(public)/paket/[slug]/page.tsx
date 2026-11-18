import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Layers,
  ListChecks,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { StartExamForm } from "@/components/forms/start-exam-form";
import { SubjectIcon } from "@/components/subject-icon";
import { Alert } from "@/components/ui/alert";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getPackageBySlug,
  getQuestionById,
  getSubjectById,
  listAttemptsForStudent,
  packageAvailability,
  toPackageView,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  single_choice: "Pilihan ganda",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar/Salah",
  short_answer: "Isian singkat",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  return { title: pkg?.title ?? "Paket" };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPackageBySlug(slug);
  if (!record || record.status !== "PUBLISHED") notFound();

  const subject = getSubjectById(record.subjectId)!;
  const pkg = toPackageView(record);
  const user = await getCurrentUser();
  const availability = packageAvailability(record);

  const questions = await Promise.all(
    record.questions.map((item) => getQuestionById(item.questionId))
  );
  const activeQuestions = questions.filter(Boolean);
  const typeCount = activeQuestions.reduce<Record<string, number>>((acc, question) => {
    if (!question) return acc;
    acc[question.type] = (acc[question.type] ?? 0) + 1;
    return acc;
  }, {});
  const levelCount = activeQuestions.reduce<Record<string, number>>((acc, question) => {
    if (!question) return acc;
    acc[question.level] = (acc[question.level] ?? 0) + 1;
    return acc;
  }, {});

  const isStudent = user?.role === "STUDENT" && user.studentId;
  const attempts = isStudent
    ? (await listAttemptsForStudent(user.studentId!)).filter(
        (item) => item.package.id === record.id
      )
    : [];
  const activeAttempt = attempts.find((item) => item.attempt.status === "in_progress");
  const submittedCount = attempts.filter(
    (item) => item.attempt.status !== "in_progress"
  ).length;
  const remaining =
    record.maxAttempts === null ? null : Math.max(0, record.maxAttempts - submittedCount);
  const maxReached = remaining !== null && remaining <= 0 && !activeAttempt;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/mapel/${subject.slug}/${record.type}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {record.type === "tryout" ? "Tryout" : "Latihan"} {subject.name}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <SubjectIcon subject={subject} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={record.type === "tryout" ? "rose" : "emerald"}>
                  {record.type === "tryout" ? "Tryout" : "Latihan"}
                </Badge>
                <Badge tone="slate">{subject.name}</Badge>
                <Badge tone="brand">Kelas 6 SD/MI</Badge>
                {!availability.open ? (
                  <Badge tone="amber">
                    <Lock className="h-3 w-3" />
                    Belum dibuka
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {record.title}
              </h1>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
                {record.description}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Jumlah soal", value: pkg.questionCount, icon: FileText },
              { label: "Durasi", value: `${record.durationMinutes} mnt`, icon: Clock3 },
              {
                label: "Penilaian",
                value: record.scoringMode === "partial" ? "Parsial" : "Penuh",
                icon: ListChecks,
              },
              {
                label: "Batas percobaan",
                value: record.maxAttempts === null ? "Bebas" : `${record.maxAttempts}×`,
                icon: RefreshCw,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5"
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <Icon className="h-3 w-3" />
                    {stat.label}
                  </p>
                  <p className="mt-0.5 font-display text-base font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardHeader
              title="Ketentuan pengerjaan"
              description="Baca sekali, lalu mulai saat kamu benar-benar siap."
            />
            <CardContent className="space-y-4">
              <ul className="space-y-2.5">
                {[
                  "Waktu mulai berjalan setelah kamu menekan tombol mulai dan tidak bisa dijeda.",
                  "Jawaban tersimpan otomatis setiap kali kamu memilih atau mengubah jawaban.",
                  "Kamu bisa berpindah soal, menandai soal ragu, dan membuka daftar navigasi.",
                  record.showExplanation
                    ? "Setelah dikumpulkan, kunci jawaban dan pembahasan dapat dibuka kembali."
                    : "Pembahasan tidak ditampilkan pada paket ini.",
                  record.maxAttempts === null
                    ? "Kamu dapat mengulang paket ini kapan saja."
                    : `Paket ini dapat dikerjakan maksimal ${record.maxAttempts} kali.`,
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-[13px] leading-6 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {rule}
                  </li>
                ))}
              </ul>

              {!availability.open ? (
                <Alert variant="warning" title="Paket belum bisa dikerjakan">
                  {availability.reason}
                  {record.availableFrom ? (
                    <span className="mt-1 block">
                      Jadwal dibuka: {formatDateTime(record.availableFrom)}
                    </span>
                  ) : null}
                </Alert>
              ) : null}

              {maxReached ? (
                <Alert variant="warning" title="Batas percobaan tercapai">
                  Kamu sudah mengerjakan paket ini sebanyak {submittedCount} kali.
                  Hubungi tutor jika perlu tambahan percobaan.
                </Alert>
              ) : null}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Komposisi soal
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(typeCount).map(([type, count]) => (
                    <Badge key={type} tone="slate">
                      {typeLabels[type] ?? type} · {count}
                    </Badge>
                  ))}
                  {Object.entries(levelCount)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([level, count]) => (
                      <Badge key={level} tone="brand">
                        {level} · {count}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[12px] leading-5 text-sky-800">
                  Soal dikirim ke perangkatmu tanpa kunci jawaban. Kunci hanya
                  diproses di server setelah kamu mengumpulkan ujian.
                </p>
              </div>
            </CardContent>
          </Card>

          {isStudent && attempts.length ? (
            <Card className="mt-5">
              <CardHeader
                title="Riwayat paket ini"
                description={`${submittedCount} percobaan selesai`}
              />
              <CardContent className="space-y-2">
                {attempts.map((item) => (
                  <div
                    key={item.attempt.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-slate-700">
                        {item.attempt.status === "in_progress"
                          ? "Sedang dikerjakan"
                          : item.attempt.status === "expired"
                            ? "Waktu habis"
                            : "Selesai"}{" "}
                        · {formatDateTime(item.attempt.submittedAt ?? item.attempt.startedAt)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.attempt.correctCount} benar ·{" "}
                        {item.attempt.incorrectCount} salah ·{" "}
                        {item.attempt.unansweredCount} kosong
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={item.attempt.score} />
                      <ButtonLink
                        href={
                          item.attempt.status === "in_progress"
                            ? `/ujian/${item.attempt.id}`
                            : `/hasil/${item.attempt.id}`
                        }
                        size="sm"
                        variant="secondary"
                      >
                        {item.attempt.status === "in_progress" ? "Lanjutkan" : "Lihat hasil"}
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar start */}
        <div className="lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-violet-600 px-5 py-5 text-white">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                {record.type === "tryout" ? (
                  <Timer className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {record.type === "tryout" ? "Simulasi tryout" : "Latihan mandiri"}
              </div>
              <p className="mt-2 font-display text-lg font-bold">
                {isStudent
                  ? activeAttempt
                    ? "Ujianmu masih berjalan"
                    : "Siap mengerjakan?"
                  : "Masuk untuk mengerjakan"}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-brand-100">
                {isStudent
                  ? activeAttempt
                    ? "Sisa waktu tetap berjalan. Lanjutkan dari soal terakhir yang kamu buka."
                    : `${pkg.questionCount} soal · ${record.durationMinutes} menit · tanpa iklan.`
                  : "Gunakan akun siswa yang diberikan bimbel untuk memulai paket ini."}
              </p>
            </div>
            <CardContent className="space-y-4">
              {isStudent ? (
                <>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Percobaan terpakai</span>
                      <span className="font-semibold text-slate-800">
                        {submittedCount}
                        {record.maxAttempts !== null ? ` / ${record.maxAttempts}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sisa percobaan</span>
                      <span className="font-semibold text-slate-800">
                        {remaining === null ? "Tidak dibatasi" : remaining}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status</span>
                      <Badge tone={availability.open ? "emerald" : "amber"}>
                        {availability.open ? "Tersedia" : "Belum dibuka"}
                      </Badge>
                    </div>
                  </div>

                  {availability.open && !maxReached ? (
                    <StartExamForm
                      packageId={record.id}
                      activeAttemptId={activeAttempt?.attempt.id}
                      label={submittedCount > 0 ? "Ulangi paket" : "Mulai sekarang"}
                    />
                  ) : (
                    <ButtonLink
                      href="/dashboard"
                      variant="secondary"
                      className="w-full"
                    >
                      Kembali ke dashboard
                    </ButtonLink>
                  )}
                </>
              ) : user ? (
                <Alert variant="info" title="Pratinjau paket">
                  Halaman ini hanya dapat dikerjakan oleh akun siswa.
                </Alert>
              ) : (
                <ButtonLink href={`/login?next=/paket/${record.slug}`} className="w-full" size="lg">
                  Masuk untuk mulai
                </ButtonLink>
              )}

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  Tips mengerjakan
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Kerjakan soal yang mudah lebih dulu. Gunakan tombol “Tandai ragu”
                  untuk soal yang ingin kamu periksa lagi.
                </p>
              </div>
            </CardContent>
          </Card>

          {record.availableFrom || record.availableTo ? (
            <Card className="mt-3 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" />
                Jadwal
              </p>
              <p className="mt-1.5 text-[12px] text-slate-600">
                Dibuka: {record.availableFrom ? formatDateTime(record.availableFrom) : "kapan saja"}
              </p>
              <p className="text-[12px] text-slate-600">
                Ditutup: {record.availableTo ? formatDateTime(record.availableTo) : "tidak dibatasi"}
              </p>
            </Card>
          ) : null}

          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-5 text-amber-800">
              Jangan menutup tab saat ujian berlangsung. Jika tidak sengaja
              tertutup, buka kembali dashboard dan pilih “Lanjutkan ujian”.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

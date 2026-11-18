import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Cloud,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { SubjectCard } from "@/components/subject-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSubjects, listPackageViews, countQuestions } from "@/lib/data";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Simulasi TKA Kelas 6 SD/MI",
};

export default async function LandingPage() {
  const [subjects, packages, settings] = await Promise.all([
    getSubjects(),
    listPackageViews({ status: "PUBLISHED" }),
    getSettings(),
  ]);

  const subjectData = await Promise.all(
    subjects.map(async (subject) => ({
      subject,
      questionCount: await countQuestions({ subjectId: subject.id, status: "ACTIVE" }),
      packageCount: packages.filter((pkg) => pkg.subjectId === subject.id).length,
    }))
  );

  const totalQuestions = subjectData.reduce((sum, item) => sum + item.questionCount, 0);

  return (
    <div className="bg-white">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-8%] top-40 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl"
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-16">
            <div className="fade-in">
              <Badge tone="brand" className="px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Tahun ajaran {settings.academicYear}
              </Badge>
              <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[52px]">
                {settings.heroTitle.split(" ").slice(0, -2).join(" ")}{" "}
                <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
                  {settings.heroTitle.split(" ").slice(-2).join(" ")}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-base">
                {settings.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink href="/login" size="lg">
                  Mulai belajar sekarang
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="#mapel" variant="secondary" size="lg">
                  Lihat mata pelajaran
                </ButtonLink>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {subjects.length} mata pelajaran
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {totalQuestions} soal & pembahasan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Tanpa iklan
                </span>
              </div>
            </div>

            {/* Exam preview */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[28px] bg-brand-200/40 blur-xl" />
              <div className="relative rotate-[-1deg] rounded-[24px] border border-slate-200 bg-white p-4 shadow-[var(--shadow-float)] sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-800">
                        Tryout Matematika 1
                      </p>
                      <p className="text-[10px] text-slate-400">Soal 7 dari 12</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="amber">
                      <Timer className="h-3 w-3" />
                      42:15
                    </Badge>
                    <Badge tone="emerald">
                      <Cloud className="h-3 w-3" />
                      Tersimpan
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Stimulus
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-600">
                    Ibu membeli 3/4 kg gula. Sebanyak 0,5 kg digunakan untuk
                    membuat kue. Sisa gula dimasukkan ke dalam 5 stoples kecil
                    dengan isi sama banyak.
                  </p>
                </div>
                <p className="mt-3 text-[13px] font-semibold text-slate-800">
                  Berapa kg gula dalam setiap stoples kecil?
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    { key: "A", text: "0,05 kg", active: true },
                    { key: "B", text: "0,15 kg", active: false },
                    { key: "C", text: "0,25 kg", active: false },
                    { key: "D", text: "0,50 kg", active: false },
                  ].map((option) => (
                    <div
                      key={option.key}
                      className={
                        option.active
                          ? "flex items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50/70 px-3 py-2"
                          : "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                      }
                    >
                      <span
                        className={
                          option.active
                            ? "grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white"
                            : "grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500"
                        }
                      >
                        {option.key}
                      </span>
                      <span className="text-[12px] font-medium text-slate-700">
                        {option.text}
                      </span>
                      {option.active ? (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-brand-600" />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((number) => (
                    <span
                      key={number}
                      className={
                        number === 7
                          ? "grid h-6 place-items-center rounded-md bg-brand-600 text-[10px] font-bold text-white"
                          : number < 7
                            ? "grid h-6 place-items-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700"
                            : "grid h-6 place-items-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-400"
                      }
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-[var(--shadow-float)] sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] text-slate-400">Skor terakhir</p>
                  <p className="text-[13px] font-bold text-slate-800">82 · Sangat baik</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects */}
        <section id="mapel" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Mata pelajaran
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                Pilih mapel, mulai dari yang kamu mau
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-slate-500">
                Setiap mapel punya latihan bertahap dan tryout dengan durasi
                seperti ujian sesungguhnya.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Masuk untuk melihat semua paket
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjectData.map((item) => (
              <SubjectCard
                key={item.subject.id}
                subject={item.subject}
                questionCount={item.questionCount}
                packageCount={item.packageCount}
              />
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="fitur" className="border-y border-slate-100 bg-slate-50/70">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge tone="brand">Dirancang untuk tryout yang adil</Badge>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                Bukan sekadar kuis online
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-slate-500">
                Semua hal yang membuat simulasi terasa seperti ujian sebenarnya,
                tanpa membuat siswa SD panik.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Clock3,
                  title: "Timer server-side",
                  description:
                    "Sisa waktu dihitung dari server. Refresh atau tutup tab tidak mengulang waktu.",
                  tone: "bg-brand-50 text-brand-600",
                },
                {
                  icon: Cloud,
                  title: "Autosave jawaban",
                  description:
                    "Setiap jawaban tersimpan otomatis. Ada indikator jelas saat menyimpan dan berhasil.",
                  tone: "bg-emerald-50 text-emerald-600",
                },
                {
                  icon: FileText,
                  title: "Pembahasan lengkap",
                  description:
                    "Setelah submit, siswa melihat kunci, jawaban sendiri, dan pembahasan tiap soal.",
                  tone: "bg-amber-50 text-amber-600",
                },
                {
                  icon: BarChart3,
                  title: "Analisis per topik",
                  description:
                    "Tutor tahu topik dan level kognitif mana yang perlu diperkuat setiap siswa.",
                  tone: "bg-rose-50 text-rose-600",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]"
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${feature.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-[15px] font-bold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Cara kerja
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                Tiga langkah, hasil yang terukur
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-6 text-slate-500">
                Siswa fokus mengerjakan. Tutor fokus mendampingi. Admin fokus
                menyiapkan bank soal yang relevan.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  {
                    title: "Masuk dengan akun bimbel",
                    description:
                      "Tidak perlu daftar sendiri. Akun dibuatkan oleh admin atau tutor.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Kerjakan latihan atau tryout",
                    description:
                      "Jawaban tersimpan otomatis, navigasi soal jelas, dan waktu adil.",
                    icon: ClipboardCheck,
                  },
                  {
                    title: "Lihat skor dan pembahasan",
                    description:
                      "Temukan topik yang perlu diulang, lalu lanjutkan latihan berikutnya.",
                    icon: TrendingUp,
                  },
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/30 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                Ringkasan hasil
              </p>
              <div className="mt-4 flex items-end gap-4">
                <p className="font-display text-6xl font-extrabold leading-none">82</p>
                <div className="pb-1">
                  <Badge tone="emerald" className="bg-emerald-400/15 text-emerald-300 ring-emerald-400/30">
                    Sangat baik
                  </Badge>
                  <p className="mt-1 text-[11px] text-slate-400">Tryout Matematika 1</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Benar", value: "25", tone: "text-emerald-300" },
                  { label: "Salah", value: "3", tone: "text-rose-300" },
                  { label: "Kosong", value: "2", tone: "text-slate-300" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/5 px-2 py-2.5 ring-1 ring-inset ring-white/10">
                    <p className={`font-display text-lg font-bold ${item.tone}`}>{item.value}</p>
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Bilangan & Operasi", value: 90, tone: "bg-emerald-400" },
                  { label: "Geometri & Pengukuran", value: 75, tone: "bg-brand-400" },
                  { label: "Data & Peluang", value: 60, tone: "bg-amber-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-semibold text-white">{item.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${item.tone}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Rekomendasi belajar otomatis dari topik terlemah.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 rounded-3xl bg-gradient-to-br from-brand-600 to-violet-600 px-6 py-8 text-white shadow-[var(--shadow-float)] sm:flex-row sm:items-center sm:px-9">
            <div>
              <h2 className="font-display text-xl font-bold sm:text-2xl">
                Siap mencoba simulasi TKA?
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-6 text-brand-100">
                Masuk dengan akun bimbelmu. Tidak perlu instal aplikasi, cukup
                buka dari HP.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                href="/login"
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Masuk ke aplikasi
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

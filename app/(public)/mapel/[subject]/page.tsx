import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ClipboardList, Clock3, Layers, Timer } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/page-header";
import { PackageCard } from "@/components/package-card";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getSubjectBySlug,
  getTopics,
  listPackageViews,
  packageAvailability,
} from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  const record = await getSubjectBySlug(subject);
  return { title: record?.name ?? "Mata Pelajaran" };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  const [topics, packages] = await Promise.all([
    getTopics(subject.id),
    listPackageViews({ subjectId: subject.id, status: "PUBLISHED" }),
  ]);

  const tryouts = packages.filter((pkg) => pkg.type === "tryout");
  const exercises = packages.filter((pkg) => pkg.type === "latihan");
  const totalQuestions = packages.reduce((sum, pkg) => sum + pkg.questionCount, 0);

  return (
    <div>
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "Beranda", href: "/" }, { label: subject.name }]}
          />
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <SubjectIcon subject={subject} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Mata pelajaran</Badge>
                  <Badge tone="slate">Kelas 6 SD/MI</Badge>
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">
                  {subject.name}
                </h1>
                <p className="mt-1 max-w-xl text-[13px] leading-6 text-slate-500">
                  {subject.description}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink href="/login">
                Masuk untuk mulai
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Latihan", value: exercises.length, icon: BookOpen },
              { label: "Tryout", value: tryouts.length, icon: Timer },
              { label: "Soal tersedia", value: totalQuestions, icon: ClipboardList },
              { label: "Topik", value: topics.length, icon: Layers },
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
                  <p className="mt-0.5 font-display text-lg font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {topics.length ? (
          <div className="mb-9">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
              Topik yang dicakup
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic.id}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Tryout</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Simulasi dengan durasi dan penilaian seperti ujian.
              </p>
            </div>
            <Link
              href={`/mapel/${subject.slug}/tryout`}
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Lihat semua tryout →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tryouts.length ? (
              tryouts.slice(0, 3).map((pkg) => {
                const availability = packageAvailability(pkg);
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    href={`/paket/${pkg.slug}`}
                    open={availability.open}
                    reason={availability.reason}
                    tone="subject"
                  />
                );
              })
            ) : (
              <p className="text-[13px] text-slate-400">Belum ada tryout tersedia.</p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Latihan</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Paket pendek untuk menguatkan topik tertentu.
              </p>
            </div>
            <Link
              href={`/mapel/${subject.slug}/latihan`}
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Lihat semua latihan →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.length ? (
              exercises.slice(0, 3).map((pkg) => {
                const availability = packageAvailability(pkg);
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    href={`/paket/${pkg.slug}`}
                    open={availability.open}
                    reason={availability.reason}
                    tone="subject"
                  />
                );
              })
            ) : (
              <p className="text-[13px] text-slate-400">Belum ada latihan tersedia.</p>
            )}
          </div>
        </section>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-[13px] font-semibold text-brand-900">
              Belum punya akun?
            </p>
            <p className="mt-0.5 text-[12px] leading-5 text-brand-700/80">
              Akun siswa dibuat oleh admin atau tutor bimbel. Hubungi{" "}
              <span className="font-semibold">0812-3456-7890</span> untuk
              mendapatkan akses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

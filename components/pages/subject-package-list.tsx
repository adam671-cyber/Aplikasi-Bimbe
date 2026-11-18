import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Timer } from "lucide-react";
import { PackageCard } from "@/components/package-card";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getSubjectBySlug,
  listPackageViews,
  packageAvailability,
} from "@/lib/data";
import type { PackageType } from "@/lib/types";

export async function SubjectPackageList({
  slug,
  type,
}: {
  slug: string;
  type: PackageType;
}) {
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  const packages = await listPackageViews({
    subjectId: subject.id,
    type,
    status: "PUBLISHED",
  });

  const title = type === "tryout" ? "Tryout" : "Latihan";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/mapel/${subject.slug}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {subject.name}
      </Link>

      <div className="mt-4 flex items-start gap-4 rounded-[var(--radius-card)] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5">
        <SubjectIcon subject={subject} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={type === "tryout" ? "rose" : "emerald"}>{title}</Badge>
            <Badge tone="slate">{packages.length} paket</Badge>
          </div>
          <h1 className="mt-1.5 font-display text-xl font-bold text-slate-900">
            {title} {subject.name}
          </h1>
          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
            {type === "tryout"
              ? "Pilih paket tryout, baca instruksi, lalu mulai saat kamu siap."
              : "Paket latihan singkat untuk memperkuat topik tertentu."}
          </p>
        </div>
        {type === "tryout" ? (
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 sm:grid">
            <Timer className="h-5 w-5" />
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packages.length ? (
          packages.map((pkg) => {
            const availability = packageAvailability(pkg);
            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                href={`/paket/${pkg.slug}`}
                open={availability.open}
                reason={availability.reason}
              />
            );
          })
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={<Timer className="h-5 w-5" />}
              title={`Belum ada ${title.toLowerCase()} untuk ${subject.name}`}
              description="Paket baru akan muncul di sini setelah tutor atau admin mempublikasikannya."
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[12px] text-slate-400">
        Masuk dengan akun bimbelmu untuk mengerjakan paket.{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Masuk sekarang
        </Link>
      </p>
    </div>
  );
}

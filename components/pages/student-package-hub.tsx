import Link from "next/link";
import { ArrowRight, BookOpen, Timer } from "lucide-react";
import { PackageCard } from "@/components/package-card";
import { SubjectIcon } from "@/components/subject-icon";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStudent } from "@/lib/auth/guards";
import {
  getPackagesForStudent,
  getSubjects,
  packageAvailability,
} from "@/lib/data";
import type { PackageType } from "@/lib/types";

export async function StudentPackageHub({ type }: { type: PackageType }) {
  const user = await requireStudent();
  const [subjects, packages] = await Promise.all([
    getSubjects(),
    getPackagesForStudent(user.studentId!, type),
  ]);

  const isTryout = type === "tryout";
  const title = isTryout ? "Tryout" : "Latihan";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Ruang ${title.toLowerCase()}`}
        title={`${title} TKA Kelas 6`}
        description={
          isTryout
            ? "Pilih mata pelajaran, lalu langsung buka paket tryout yang tersedia untuk kelasmu."
            : "Pilih mata pelajaran untuk langsung mengerjakan latihan tanpa kembali ke beranda."
        }
        actions={
          <ButtonLink href="/materi" variant="secondary" size="sm">
            <BookOpen className="h-4 w-4" />
            Baca materi
          </ButtonLink>
        }
      />

      {subjects.map((subject) => {
        const list = packages.filter((pkg) => pkg.subjectId === subject.id);
        return (
          <section key={subject.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SubjectIcon subject={subject} size="md" />
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {subject.name}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {list.length
                      ? `${list.length} paket ${title.toLowerCase()} tersedia`
                      : `Belum ada paket ${title.toLowerCase()}`}
                  </p>
                </div>
              </div>
              <Link
                href={`/materi/${subject.slug}`}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Materi {subject.name}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {list.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((pkg) => {
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
                })}
              </div>
            ) : (
              <EmptyState
                icon={
                  isTryout ? (
                    <Timer className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )
                }
                title={`Belum ada ${title.toLowerCase()} ${subject.name}`}
                description="Paket akan muncul di sini setelah tutor atau admin mempublikasikannya untuk kelasmu."
              />
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <div>
          <p className="text-[13px] font-semibold text-brand-900">
            Ingin mengulang konsep dulu?
          </p>
          <p className="mt-0.5 text-[12px] text-brand-700/80">
            Rangkuman materi singkat tersedia untuk setiap mata pelajaran.
          </p>
        </div>
        <ButtonLink href="/materi" size="sm">
          Buka materi
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </div>
  );
}

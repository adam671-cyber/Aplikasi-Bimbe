import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Library } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStudent } from "@/lib/auth/guards";
import { getSubjects, listMaterials } from "@/lib/data";

export const metadata: Metadata = { title: "Materi" };

export default async function MaterialsPage() {
  await requireStudent();
  const [subjects, materials] = await Promise.all([
    getSubjects(),
    listMaterials(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rangkuman belajar"
        title="Materi TKA Kelas 6"
        description="Baca rangkuman singkat per topik sebelum berlatih. Materi disusun ringkas agar mudah diulang di HP."
        actions={
          <ButtonLink href="/latihan" size="sm">
            <BookOpen className="h-4 w-4" />
            Mulai latihan
          </ButtonLink>
        }
      />

      {materials.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const list = materials.filter(
              (material) => material.subjectId === subject.id
            );
            return (
              <Card key={subject.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <SubjectIcon subject={subject} size="md" />
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {subject.name}
                    </h2>
                    <Badge tone="slate" className="mt-1.5">
                      <Library className="h-3 w-3" />
                      {list.length} materi
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-slate-500">
                  {subject.description}
                </p>

                <ul className="mt-3 flex-1 space-y-1.5">
                  {list.slice(0, 3).map((material) => (
                    <li key={material.id}>
                      <Link
                        href={`/materi/${subject.slug}/${material.slug}`}
                        className="flex items-start gap-1.5 text-[12px] leading-5 text-slate-600 transition hover:text-brand-600"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-300" />
                        {material.title}
                      </Link>
                    </li>
                  ))}
                  {list.length === 0 ? (
                    <li className="text-[12px] text-slate-400">
                      Materi belum tersedia.
                    </li>
                  ) : null}
                </ul>

                <Link
                  href={`/materi/${subject.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  Lihat semua materi
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Library className="h-5 w-5" />}
          title="Belum ada materi"
          description="Materi akan muncul di sini setelah tutor atau admin menambahkannya."
        />
      )}
    </div>
  );
}

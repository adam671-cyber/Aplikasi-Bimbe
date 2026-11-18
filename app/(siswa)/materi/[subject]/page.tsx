import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, Library } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStudent } from "@/lib/auth/guards";
import { getSubjectBySlug, listMaterials } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  const record = await getSubjectBySlug(subject);
  return { title: record ? `Materi ${record.name}` : "Materi" };
}

export default async function SubjectMaterialsPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  await requireStudent();
  const { subject: slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  const materials = await listMaterials({ subjectId: subject.id });

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/materi"
        backLabel="Semua materi"
        eyebrow="Materi pelajaran"
        title={
          <span className="flex items-center gap-3">
            <SubjectIcon subject={subject} size="md" />
            {subject.name}
          </span>
        }
        description={subject.description}
        actions={
          <ButtonLink href={`/mapel/${subject.slug}/latihan`} size="sm">
            <BookOpen className="h-4 w-4" />
            Latihan {subject.name}
          </ButtonLink>
        }
      />

      {materials.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((material) => (
            <Link
              key={material.id}
              href={`/materi/${subject.slug}/${material.slug}`}
              className="group rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-float)]"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge tone="brand">
                  <Library className="h-3 w-3" />
                  Materi
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
              </div>
              <h2 className="mt-3 font-display text-[15px] font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                {material.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">
                {material.summary}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {material.topic ? (
                  <Badge tone="slate">{material.topic.name}</Badge>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Diperbarui {formatDate(material.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Library className="h-5 w-5" />}
            title="Belum ada materi"
            description={`Materi ${subject.name} akan muncul di sini setelah ditambahkan.`}
          />
        </Card>
      )}
    </div>
  );
}

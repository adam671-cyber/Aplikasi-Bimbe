import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Lightbulb } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/guards";
import { getMaterialBySlug, listMaterials } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; slug: string }>;
}): Promise<Metadata> {
  const { subject, slug } = await params;
  const material = await getMaterialBySlug(subject, slug);
  return { title: material ? material.title : "Materi" };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ subject: string; slug: string }>;
}) {
  await requireStudent();
  const { subject: subjectSlug, slug } = await params;
  const material = await getMaterialBySlug(subjectSlug, slug);
  if (!material) notFound();

  const siblings = await listMaterials({ subjectId: material.subjectId });
  const index = siblings.findIndex((item) => item.id === material.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/materi/${material.subject.slug}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Materi {material.subject.name}
        </Link>
        <Link
          href="/materi"
          className="text-[12px] text-slate-400 hover:text-brand-600"
        >
          / Semua materi
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50/80 to-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <BookOpen className="h-3 w-3" />
              Materi
            </Badge>
            <Badge tone="slate">{material.subject.name}</Badge>
            {material.topic ? (
              <Badge tone="slate">{material.topic.name}</Badge>
            ) : null}
          </div>
          <div className="mt-3 flex items-start gap-3">
            <SubjectIcon subject={material.subject} size="md" />
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {material.title}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-500">
                {material.summary}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock3 className="h-3 w-3" />
                Diperbarui {formatDate(material.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <RichText
            text={material.content}
            className="text-[14px] leading-7 text-slate-700"
          />

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="text-[12px] font-semibold text-brand-900">
                Sudah paham materinya?
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-brand-700/80">
                Uji pemahamanmu lewat latihan singkat atau tryout.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href="/latihan" size="sm">
                  Latihan
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
                <ButtonLink href="/tryout" size="sm" variant="secondary">
                  Tryout
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/materi/${material.subject.slug}/${previous.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Materi sebelumnya
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 group-hover:text-brand-700">
              <ArrowLeft className="h-3.5 w-3.5" />
              {previous.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/materi/${material.subject.slug}/${next.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-brand-200"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Materi berikutnya
            </p>
            <p className="mt-1 flex items-center justify-end gap-1.5 text-[13px] font-semibold text-slate-700 group-hover:text-brand-700">
              {next.title}
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

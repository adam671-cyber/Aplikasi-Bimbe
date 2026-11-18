import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PackageForm } from "@/components/forms/package-form";
import { updatePackageAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getPackageById,
  getSubjects,
  packageAvailability,
} from "@/lib/data/catalog";
import { listQuestions } from "@/lib/data/questions";
import { listClasses } from "@/lib/data/students";

export const metadata: Metadata = { title: "Ubah Paket" };

export default async function AdminEditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const record = await getPackageById(id);

  if (!record) notFound();

  const [subjects, classes, questions] = await Promise.all([
    getSubjects(true),
    listClasses(),
    listQuestions({ status: "ALL" }),
  ]);
  const availability = packageAvailability(record);

  return (
    <div>
      <PageHeader
        eyebrow="Paket ujian"
        title="Ubah paket"
        description={
          record.status === "PUBLISHED" && !availability.open
            ? `Paket dipublikasikan tetapi belum dapat dikerjakan: ${availability.reason}`
            : `${record.questions.length} soal · ${record.durationMinutes} menit · /${record.slug}`
        }
        backHref="/admin/paket"
        backLabel="Kembali ke daftar paket"
      />
      <PackageForm
        action={updatePackageAction}
        error={error}
        submitLabel="Simpan perubahan"
        values={{
          id: record.id,
          subjectId: record.subjectId,
          title: record.title,
          type: record.type,
          description: record.description,
          durationMinutes: record.durationMinutes,
          maxAttempts: record.maxAttempts,
          scoringMode: record.scoringMode,
          shuffleQuestions: record.shuffleQuestions,
          shuffleOptions: record.shuffleOptions,
          showExplanation: record.showExplanation,
          status: record.status,
          availableFrom: record.availableFrom,
          availableTo: record.availableTo,
          classIds: record.classIds,
          questions: record.questions.map((item) => ({
            questionId: item.questionId,
            points: item.points,
          })),
        }}
        subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
        classes={classes.map((classroom) => ({
          id: classroom.id,
          name: classroom.name,
        }))}
        questions={questions.map((question) => ({
          id: question.id,
          subjectId: question.subjectId,
          snippet: question.question,
          type: question.type,
          level: question.level,
          status: question.status,
          topicName: question.topic?.name ?? null,
        }))}
      />
    </div>
  );
}

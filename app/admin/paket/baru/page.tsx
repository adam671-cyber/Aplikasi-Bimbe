import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PackageForm } from "@/components/forms/package-form";
import { createPackageAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getSubjects } from "@/lib/data/catalog";
import { listQuestions } from "@/lib/data/questions";
import { listClasses } from "@/lib/data/students";

export const metadata: Metadata = { title: "Buat Paket" };

export default async function AdminNewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const [subjects, classes, questions] = await Promise.all([
    getSubjects(true),
    listClasses(),
    listQuestions({ status: "ALL" }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Paket ujian"
        title="Buat paket baru"
        description="Paket baru disimpan sebagai draft sampai kamu mempublikasikannya."
        backHref="/admin/paket"
        backLabel="Kembali ke daftar paket"
      />
      <PackageForm
        action={createPackageAction}
        error={error}
        values={{
          subjectId: subjects[0]?.id ?? "",
          title: "",
          type: "latihan",
          description: "",
          durationMinutes: 30,
          maxAttempts: null,
          scoringMode: "all_or_nothing",
          shuffleQuestions: true,
          shuffleOptions: true,
          showExplanation: true,
          status: "DRAFT",
          availableFrom: null,
          availableTo: null,
          classIds: [],
          questions: [],
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

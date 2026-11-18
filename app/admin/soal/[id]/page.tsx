import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionForm } from "@/components/forms/question-form";
import { Card, CardContent } from "@/components/ui/card";
import { updateQuestionAction } from "@/lib/actions/questions";
import { requireAdmin } from "@/lib/auth/guards";
import { getSubjects, getTopics } from "@/lib/data/catalog";
import { getQuestionById } from "@/lib/data/questions";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Ubah Soal" };

export default async function AdminEditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question) notFound();

  const [subjects, topics] = await Promise.all([
    getSubjects(true),
    Promise.resolve(getTopics()),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Bank soal"
        title="Ubah soal"
        description={`Dibuat ${formatDateTime(question.createdAt)} · diperbarui ${formatDateTime(
          question.updatedAt
        )}`}
        backHref="/admin/soal"
        backLabel="Kembali ke bank soal"
      />
      <Card>
        <CardContent className="p-5">
          <QuestionForm
            action={updateQuestionAction}
            allowStatus
            submitLabel="Simpan perubahan"
            question={{
              id: question.id,
              subjectId: question.subjectId,
              topicId: question.topicId,
              type: question.type,
              level: question.level,
              status: question.status,
              stimulus: question.stimulus,
              question: question.question,
              indicator: question.indicator,
              explanation: question.explanation,
              options: question.options,
              statements: question.statements,
            }}
            subjects={subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
            }))}
            topics={topics.map((topic) => ({
              id: topic.id,
              subjectId: topic.subjectId,
              name: topic.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

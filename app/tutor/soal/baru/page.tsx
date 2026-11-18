import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionForm } from "@/components/forms/question-form";
import { Card, CardContent } from "@/components/ui/card";
import { createQuestionAction } from "@/lib/actions/questions";
import { requireTutor } from "@/lib/auth/guards";
import { getSubjects, getTopics } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Tambah Soal" };

export default async function TutorNewQuestionPage() {
  await requireTutor();
  const [subjects, topics] = await Promise.all([getSubjects(), Promise.resolve(getTopics())]);

  return (
    <div>
      <PageHeader
        eyebrow="Bank soal"
        title="Tambah soal baru"
        description="Soal akan tersimpan sebagai draft dan dapat diaktifkan oleh admin."
        backHref="/tutor/soal"
        backLabel="Kembali ke bank soal"
      />
      <Card>
        <CardContent className="p-5">
          <QuestionForm
            action={createQuestionAction}
            subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
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

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReviewList } from "@/components/result/review-list";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getTutorAttemptContext } from "@/lib/auth/access";
import { requireTutor } from "@/lib/auth/guards";
import {
  getAttemptResult,
  getAttemptReview,
} from "@/lib/data/attempts";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review Jawaban Siswa",
  robots: { index: false, follow: false },
};

export default async function TutorReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireTutor();
  const { attemptId } = await params;
  const context = await getTutorAttemptContext(user.id, attemptId);

  if (!context) notFound();
  if (context.attempt.status === "in_progress") {
    redirect(`/tutor/kelas/${context.student.classId ?? ""}`);
  }

  const result = getAttemptResult(context.attempt);
  const items = getAttemptReview(context.attempt);
  if (!result) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Review jawaban"
        title={context.package.title}
        description={`${context.subject.name} · ${formatDateTime(context.attempt.submittedAt)}`}
        backHref={`/tutor/hasil/${context.attempt.id}`}
        backLabel="Kembali ke hasil"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
        <Avatar name={context.studentUser.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-800">
            {context.studentUser.name}
          </p>
          <p className="text-[11px] text-slate-500">
            NIS {context.student.nis}
            {context.className ? ` · ${context.className}` : ""}
          </p>
        </div>
        <Badge tone="emerald">{result.correctCount} benar</Badge>
        <Badge tone="rose">{result.incorrectCount} salah</Badge>
        <Badge tone="amber">{result.unansweredCount} kosong</Badge>
        <Badge tone="brand">Skor {result.score}</Badge>
      </div>

      {!context.package.showExplanation ? (
        <Alert variant="info" className="mb-4">
          Paket ini tidak menampilkan pembahasan, tetapi kunci jawaban tetap
          terlihat.
        </Alert>
      ) : null}

      <ReviewList items={items} showExplanation={context.package.showExplanation} />

      <div className="mt-5">
        <ButtonLink href={`/tutor/hasil/${context.attempt.id}`} variant="secondary">
          Kembali ke hasil
        </ButtonLink>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { ReviewList } from "@/components/result/review-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/guards";
import {
  getAttemptContext,
  getAttemptResult,
  getAttemptReview,
} from "@/lib/data/attempts";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review jawaban",
  robots: { index: false, follow: false },
};

export default async function StudentReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireStudent();
  const { attemptId } = await params;
  const context = await getAttemptContext(attemptId);

  if (!context) notFound();
  if (context.attempt.studentId !== user.studentId) notFound();
  if (context.attempt.status === "in_progress") {
    redirect(`/ujian/${context.attempt.id}`);
  }

  const result = getAttemptResult(context.attempt);
  const items = getAttemptReview(context.attempt);
  if (!result) notFound();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link
            href={`/hasil/${context.attempt.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Hasil
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[12px] font-semibold text-slate-800">
              Review · {context.package.title}
            </p>
            <p className="text-[10px] text-slate-400">
              {context.subject.name} · {formatDateTime(context.attempt.submittedAt)}
            </p>
          </div>
          <Badge tone="brand" className="shrink-0">
            Skor {result.score}
          </Badge>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="emerald">
            <CheckCircle2 className="h-3 w-3" />
            {result.correctCount} benar
          </Badge>
          <Badge tone="rose">
            <XCircle className="h-3 w-3" />
            {result.incorrectCount} salah
          </Badge>
          <Badge tone="amber">
            <Clock3 className="h-3 w-3" />
            {result.unansweredCount} kosong
          </Badge>
          <span className="ml-auto text-[11px] text-slate-400">
            {items.length} soal
          </span>
        </div>

        {!context.package.showExplanation ? (
          <Alert variant="info" title="Pembahasan tidak ditampilkan" className="mb-4">
            Paket ini tidak mengaktifkan pembahasan. Kunci jawaban masih dapat
            dilihat pada daftar soal di bawah.
          </Alert>
        ) : null}

        <ReviewList items={items} showExplanation={context.package.showExplanation} />

        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink href={`/hasil/${context.attempt.id}`} variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke hasil
          </ButtonLink>
          <ButtonLink href={`/paket/${context.package.slug}`}>
            Ulangi paket
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

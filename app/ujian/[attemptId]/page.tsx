import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamRunner } from "@/components/exam/exam-runner";
import { requireStudent } from "@/lib/auth/guards";
import { getAttemptContext, toPublicAttemptPayload } from "@/lib/data/attempts";

export const metadata: Metadata = {
  title: "Mengerjakan ujian",
  robots: { index: false, follow: false },
};

export default async function ExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireStudent();
  const { attemptId } = await params;
  const context = await getAttemptContext(attemptId);

  if (!context) notFound();
  if (context.attempt.studentId !== user.studentId) notFound();
  if (context.attempt.status !== "in_progress") {
    redirect(`/hasil/${context.attempt.id}`);
  }

  return <ExamRunner attempt={toPublicAttemptPayload(context)} />;
}

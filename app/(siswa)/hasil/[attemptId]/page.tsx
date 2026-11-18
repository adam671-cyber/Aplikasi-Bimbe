import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptResultView } from "@/components/result/result-view";
import { requireStudent } from "@/lib/auth/guards";
import { getAttemptContext, getAttemptResult } from "@/lib/data/attempts";

export const metadata: Metadata = {
  title: "Hasil ujian",
  robots: { index: false, follow: false },
};

export default async function StudentResultPage({
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
  if (!result) notFound();

  return (
    <AttemptResultView
      context={context}
      result={result}
      viewer="student"
      backHref="/riwayat"
      backLabel="Kembali ke riwayat"
    />
  );
}

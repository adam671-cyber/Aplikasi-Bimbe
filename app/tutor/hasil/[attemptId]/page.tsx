import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptResultView } from "@/components/result/result-view";
import { getTutorAttemptContext } from "@/lib/auth/access";
import { requireTutor } from "@/lib/auth/guards";
import { getAttemptResult } from "@/lib/data/attempts";

export const metadata: Metadata = {
  title: "Hasil Siswa",
  robots: { index: false, follow: false },
};

export default async function TutorResultPage({
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
  if (!result) notFound();

  return (
    <AttemptResultView
      context={context}
      result={result}
      viewer="tutor"
      backHref={
        context.student.classId ? `/tutor/kelas/${context.student.classId}` : "/tutor/kelas"
      }
      backLabel="Kembali ke kelas"
    />
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptResultView } from "@/components/result/result-view";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAttemptContext,
  getAttemptResult,
} from "@/lib/data/attempts";

export const metadata: Metadata = {
  title: "Detail Hasil Siswa",
  robots: { index: false, follow: false },
};

export default async function AdminResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  await requireAdmin();
  const { attemptId } = await params;
  const context = await getAttemptContext(attemptId);

  if (!context) notFound();
  if (context.attempt.status === "in_progress") {
    redirect("/admin/hasil");
  }

  const result = getAttemptResult(context.attempt);
  if (!result) notFound();

  return (
    <AttemptResultView
      context={context}
      result={result}
      viewer="admin"
      backHref="/admin/hasil"
      backLabel="Kembali ke laporan"
    />
  );
}

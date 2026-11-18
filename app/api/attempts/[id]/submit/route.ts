import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { submitAttempt } from "@/lib/data/attempts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(["STUDENT"]);
  if (!user?.studentId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const attempt = await submitAttempt(id, user.studentId);
    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      status: attempt.status,
      score: attempt.score,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      redirectTo: `/hasil/${attempt.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengumpulkan ujian." },
      { status: 400 }
    );
  }
}

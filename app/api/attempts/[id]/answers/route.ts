import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { saveAttemptAnswer } from "@/lib/data/attempts";
import { attemptAnswerSchema } from "@/lib/validation/attempt-answer";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(["STUDENT"]);
  if (!user?.studentId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = attemptAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data jawaban tidak valid." }, { status: 400 });
  }

  try {
    const result = await saveAttemptAnswer({
      attemptId: id,
      studentId: user.studentId,
      ...parsed.data,
    });
    return NextResponse.json(result, { status: result.expired ? 409 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan jawaban." },
      { status: 400 }
    );
  }
}

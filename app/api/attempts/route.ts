import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/guards";
import { startAttempt } from "@/lib/data/attempts";

const startSchema = z.object({
  packageId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getApiUser(["STUDENT"]);
  if (!user?.studentId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });
  }

  try {
    const attempt = await startAttempt(user.studentId, parsed.data.packageId);
    return NextResponse.json(
      { attemptId: attempt.id, expiresAt: attempt.expiresAt },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memulai ujian." },
      { status: 400 }
    );
  }
}

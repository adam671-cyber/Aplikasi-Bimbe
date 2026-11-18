import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/guards";
import { logAttemptEvent } from "@/lib/data/attempts";
import { EVENT_TYPES } from "@/lib/types";

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(["STUDENT"]);
  if (!user?.studentId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Jenis event tidak valid." }, { status: 400 });
  }

  const logged = await logAttemptEvent(id, user.studentId, parsed.data.type);
  return NextResponse.json({ logged });
}

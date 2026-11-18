import "server-only";
import { getAttemptContext } from "@/lib/data/attempts";
import { getTutorClasses } from "@/lib/data/students";
import type { AttemptWithContext } from "@/lib/data/types";

/** Tutor hanya boleh membuka attempt milik siswa di kelas yang diampu. */
export async function getTutorAttemptContext(
  tutorId: string,
  attemptId: string
): Promise<AttemptWithContext | null> {
  const context = await getAttemptContext(attemptId);
  if (!context) return null;
  const classes = await getTutorClasses(tutorId);
  const allowed = classes.some((classroom) => classroom.id === context.student.classId);
  return allowed ? context : null;
}

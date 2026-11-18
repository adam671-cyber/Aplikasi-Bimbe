import { z } from "zod";

/**
 * Skema body autosave jawaban dari exam runner.
 *
 * `text` wajib ada agar jawaban isian singkat tidak dibuang oleh zod (zod
 * menghapus key yang tidak dideklarasikan), karena payload esai berbentuk
 * `{ text: "..." }`.
 */
export const attemptAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z
    .union([
      z.object({
        selected: z.union([z.string(), z.array(z.string())]).optional(),
        statements: z.record(z.boolean()).optional(),
        text: z.string().max(2000).optional(),
      }),
      z.null(),
    ])
    .optional(),
  isFlagged: z.boolean().optional(),
  lastQuestionIndex: z.number().int().min(0).max(500).optional(),
});

export type AttemptAnswerBody = z.infer<typeof attemptAnswerSchema>;

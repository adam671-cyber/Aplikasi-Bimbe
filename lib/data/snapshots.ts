import type { PublicQuestion, QuestionSnapshot } from "@/lib/types";
import type { QuestionRecord } from "./types";

export function createSnapshot(
  question: QuestionRecord,
  topicName: string | null
): QuestionSnapshot {
  return {
    id: question.id,
    subjectId: question.subjectId,
    topicId: question.topicId,
    topicName,
    type: question.type,
    level: question.level,
    stimulus: question.stimulus,
    question: question.question,
    indicator: question.indicator,
    explanation: question.explanation,
    imageUrl: question.imageUrl,
    options: question.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) => ({
        id: option.id,
        key: option.optionKey,
        text: option.content,
        isCorrect: option.isCorrect,
      })),
    statements: question.statements
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((statement) => ({
        id: statement.id,
        text: statement.content,
        correctAnswer: statement.correctAnswer,
      })),
  };
}

/** Soal versi siswa: tanpa kunci jawaban & pembahasan. */
export function toPublicQuestion(snapshot: QuestionSnapshot): PublicQuestion {
  return {
    id: snapshot.id,
    type: snapshot.type,
    level: snapshot.level,
    stimulus: snapshot.stimulus,
    question: snapshot.question,
    imageUrl: snapshot.imageUrl,
    // Jawaban esai disimpan pada options, jadi jangan pernah dikirim ke browser.
    options:
      snapshot.type === "short_answer"
        ? []
        : snapshot.options.map((option) => ({
            id: option.id,
            key: option.key,
            text: option.text,
          })),
    statements: snapshot.statements.map((statement) => ({
      id: statement.id,
      text: statement.text,
    })),
  };
}

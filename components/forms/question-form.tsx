"use client";

import * as React from "react";
import { useActionState } from "react";
import { Save, Sparkles } from "lucide-react";
import type { CognitiveLevel, QuestionStatus, QuestionType } from "@/lib/types";
import type { QuestionActionState } from "@/lib/actions/questions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";

const OPTION_KEYS = ["a", "b", "c", "d", "e"] as const;
const LETTERS: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  e: "E",
};

const typeLabels: { value: QuestionType; label: string }[] = [
  { value: "single_choice", label: "Pilihan ganda (1 jawaban)" },
  { value: "multiple_choice", label: "Pilihan ganda kompleks (lebih dari 1)" },
  { value: "true_false_grid", label: "Benar / Salah (grid pernyataan)" },
  { value: "short_answer", label: "Isian singkat / esai (maks. 15 kata)" },
];

const levels: CognitiveLevel[] = ["C3", "C4", "C5", "C6"];
const statuses: QuestionStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];

export function QuestionForm({
  action,
  subjects,
  topics,
  question,
  allowStatus = false,
  submitLabel = "Simpan soal",
}: {
  action: (
    state: QuestionActionState,
    formData: FormData
  ) => Promise<QuestionActionState>;
  subjects: { id: string; name: string }[];
  topics: { id: string; subjectId: string; name: string }[];
  question?: {
    id: string;
    subjectId: string;
    topicId: string | null;
    type: QuestionType;
    level: CognitiveLevel;
    status: QuestionStatus;
    stimulus: string | null;
    question: string;
    indicator: string | null;
    explanation: string;
    options: { id: string; optionKey: string; content: string; isCorrect: boolean }[];
    statements: { id: string; content: string; correctAnswer: boolean }[];
  };
  allowStatus?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<QuestionActionState, FormData>(
    action,
    {}
  );

  const [subjectId, setSubjectId] = React.useState(
    question?.subjectId ?? subjects[0]?.id ?? ""
  );
  const [type, setType] = React.useState<QuestionType>(
    question?.type ?? "single_choice"
  );
  const [singleCorrect, setSingleCorrect] = React.useState(
    question?.type === "single_choice"
      ? question.options.find((option) => option.isCorrect)?.optionKey.toLowerCase() ?? ""
      : ""
  );
  const [multiCorrect, setMultiCorrect] = React.useState<string[]>(
    question?.type === "multiple_choice"
      ? question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.optionKey.toLowerCase())
      : []
  );

  const subjectTopics = topics.filter((topic) => topic.subjectId === subjectId);

  const optionValue = (key: string) =>
    question?.options.find(
      (option) => option.optionKey.toLowerCase() === key
    )?.content ?? "";

  const statementValue = (index: number) =>
    question?.statements[index]?.content ?? "";

  const statementCorrect = (index: number) =>
    question?.statements[index]?.correctAnswer ?? true;

  const toggleMulti = (key: string, checked: boolean) => {
    setMultiCorrect((current) =>
      checked ? [...new Set([...current, key])] : current.filter((item) => item !== key)
    );
  };

  return (
    <form action={formAction} className="space-y-5">
      {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
      {state.error ? (
        <Alert variant="error" title="Soal belum tersimpan">
          {state.error}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mata pelajaran" htmlFor="subjectId" required>
          <Select
            id="subjectId"
            name="subjectId"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            required
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Topik" htmlFor="topicId" hint="Opsional, membantu analisis hasil.">
          <Select id="topicId" name="topicId" defaultValue={question?.topicId ?? ""}>
            <option value="">Tanpa topik</option>
            {subjectTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Jenis soal" htmlFor="type" required>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as QuestionType)}
          >
            {typeLabels.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Level kognitif" htmlFor="level" required>
            <Select id="level" name="level" defaultValue={question?.level ?? "C3"}>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status" hint={allowStatus ? undefined : "Soal baru disimpan sebagai draft."}>
            <Select
              id="status"
              name="status"
              defaultValue={question?.status ?? "DRAFT"}
              disabled={!allowStatus}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "ACTIVE"
                    ? "Aktif"
                    : status === "INACTIVE"
                      ? "Nonaktif"
                      : "Draft"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <Field
        label="Stimulus / teks pendukung"
        htmlFor="stimulus"
        hint="Opsional. Mendukung LaTeX: $\\frac{1}{2}$ atau $$...$$."
      >
        <Textarea
          id="stimulus"
          name="stimulus"
          defaultValue={question?.stimulus ?? ""}
          placeholder="Teks bacaan, konteks, data, atau gambar yang mendukung soal."
          rows={3}
        />
      </Field>

      <Field label="Pertanyaan" htmlFor="question" required>
        <Textarea
          id="question"
          name="question"
          defaultValue={question?.question ?? ""}
          placeholder="Tulis pertanyaan secara singkat dan jelas."
          rows={3}
          required
        />
      </Field>

      <Field
        label="Indikator soal"
        htmlFor="indicator"
        hint="Opsional, dipakai untuk pemetaan kurikulum."
      >
        <Input
          id="indicator"
          name="indicator"
          defaultValue={question?.indicator ?? ""}
          placeholder="Contoh: Mengaplikasikan operasi pecahan dalam konteks nyata."
        />
      </Field>

      {type === "true_false_grid" ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Pernyataan Benar / Salah
          </p>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  name={`statement-${index}`}
                  defaultValue={statementValue(index)}
                  placeholder={`Pernyataan ${index + 1}${
                    index > 2 ? " (opsional)" : ""
                  }`}
                />
                <Select
                  name={`statement-correct-${index}`}
                  defaultValue={statementCorrect(index) ? "true" : "false"}
                  className="sm:w-32"
                  aria-label={`Kunci pernyataan ${index + 1}`}
                >
                  <option value="true">Benar</option>
                  <option value="false">Salah</option>
                </Select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              {type === "short_answer" ? "Jawaban yang diterima" : "Opsi jawaban"}
            </p>
            <span className="text-[10px] text-slate-400">
              {type === "short_answer"
                ? "Semua baris terisi dianggap benar"
                : type === "multiple_choice"
                  ? "Centang semua kunci jawaban"
                  : "Pilih satu kunci jawaban"}
            </span>
          </div>
          {type === "short_answer" ? (
            <p className="mb-2.5 rounded-lg bg-white px-2.5 py-1.5 text-[10px] leading-4 text-slate-500 ring-1 ring-slate-200">
              Tulis variasi jawaban yang dianggap benar (mis. “fotosintesis” dan
              “proses fotosintesis”). Maksimal 15 kata per jawaban; hanya huruf,
              angka, spasi, titik, koma, apostrof, dan tanda hubung.
            </p>
          ) : null}
          <div className="space-y-2.5">
            {OPTION_KEYS.map((key, index) => (
              <div key={key} className="flex items-start gap-2.5">
                <span className="mt-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                  {LETTERS[key]}
                </span>
                <Textarea
                  name={`option-${key}`}
                  defaultValue={optionValue(key)}
                  placeholder={
                    type === "short_answer"
                      ? `Jawaban benar ${index + 1}${
                          index > 2 ? " (opsional)" : ""
                        }`
                      : `Isi pilihan ${LETTERS[key]}${
                          index > 2 ? " (opsional)" : ""
                        }`
                  }
                  rows={2}
                  className="min-h-[44px]"
                />
                {type === "short_answer" ? null : (
                  <label className="mt-2 flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    {type === "multiple_choice" ? (
                      <Checkbox
                        name="correct"
                        value={key}
                        checked={multiCorrect.includes(key)}
                        onChange={(event) => toggleMulti(key, event.target.checked)}
                      />
                    ) : (
                      <input
                        type="radio"
                        name="correct"
                        value={key}
                        checked={singleCorrect === key}
                        onChange={() => setSingleCorrect(key)}
                        className="h-4 w-4 accent-brand-600"
                      />
                    )}
                    Kunci
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Field
        label="Pembahasan"
        htmlFor="explanation"
        required
        hint="Jelaskan langkah penyelesaian. Mendukung LaTeX."
      >
        <Textarea
          id="explanation"
          name="explanation"
          defaultValue={question?.explanation ?? ""}
          placeholder="Tulis pembahasan lengkap agar siswa memahami kesalahannya."
          rows={4}
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
        <p className="text-[11px] text-slate-400">
          Periksa kembali kunci jawaban sebelum menyimpan.
        </p>
      </div>
    </form>
  );
}

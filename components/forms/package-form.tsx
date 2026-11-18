"use client";

import * as React from "react";
import { CalendarDays, ListChecks, Save, Settings2, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";

export interface PackageFormQuestion {
  id: string;
  subjectId: string;
  snippet: string;
  type: string;
  level: string;
  status: string;
  topicName: string | null;
}

export interface PackageFormValues {
  id?: string;
  subjectId: string;
  title: string;
  type: "latihan" | "tryout";
  description: string;
  durationMinutes: number;
  maxAttempts: number | null;
  scoringMode: "all_or_nothing" | "partial";
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  availableFrom: string | null;
  availableTo: string | null;
  classIds: string[];
  questions: { questionId: string; points: number }[];
}

const typeLabels: Record<string, string> = {
  single_choice: "PG",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar/Salah",
  short_answer: "Isian singkat",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Dipublikasikan",
  ARCHIVED: "Diarsipkan",
};

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function PackageForm({
  action,
  values,
  subjects,
  classes,
  questions,
  error,
  submitLabel = "Simpan paket",
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: PackageFormValues;
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  questions: PackageFormQuestion[];
  error?: string;
  submitLabel?: string;
}) {
  const [subjectId, setSubjectId] = React.useState(values.subjectId);
  const [selected, setSelected] = React.useState<string[]>(
    values.questions.map((item) => item.questionId)
  );

  const pointsById = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of values.questions) map.set(item.questionId, item.points);
    return map;
  }, [values.questions]);

  const subjectQuestions = questions.filter(
    (question) => question.subjectId === subjectId
  );

  const toggleQuestion = (id: string, checked: boolean) => {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  };

  const changeSubject = (next: string) => {
    setSubjectId(next);
    // Soal dari mapel lain tidak boleh ikut tersimpan pada paket ini.
    const allowed = new Set(
      questions
        .filter((question) => question.subjectId === next)
        .map((question) => question.id)
    );
    setSelected((current) => current.filter((id) => allowed.has(id)));
  };

  return (
    <form action={action} className="space-y-5">
      {values.id ? <input type="hidden" name="packageId" value={values.id} /> : null}

      {error ? (
        <Alert variant="error" title="Paket belum tersimpan">
          {error}
        </Alert>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-4 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-slate-400">
          <Settings2 className="h-3.5 w-3.5" />
          Informasi paket
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mata pelajaran" htmlFor="subjectId" required>
            <Select
              id="subjectId"
              name="subjectId"
              value={subjectId}
              onChange={(event) => changeSubject(event.target.value)}
              required
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Jenis paket" htmlFor="type" required>
            <Select id="type" name="type" defaultValue={values.type}>
              <option value="latihan">Latihan</option>
              <option value="tryout">Tryout</option>
            </Select>
          </Field>

          <Field label="Judul paket" htmlFor="title" required className="sm:col-span-2">
            <Input
              id="title"
              name="title"
              defaultValue={values.title}
              placeholder="Contoh: Tryout Matematika Paket 1"
              required
            />
          </Field>

          <Field
            label="Deskripsi"
            htmlFor="description"
            className="sm:col-span-2"
            hint="Tampil di halaman detail paket siswa."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description}
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Durasi (menit)" htmlFor="durationMinutes" required>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={1}
                defaultValue={values.durationMinutes}
                required
              />
            </Field>
            <Field
              label="Maks. percobaan"
              htmlFor="maxAttempts"
              hint="Kosongkan = tanpa batas."
            >
              <Input
                id="maxAttempts"
                name="maxAttempts"
                type="number"
                min={1}
                defaultValue={values.maxAttempts ?? ""}
                placeholder="Tanpa batas"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Mode penilaian" htmlFor="scoringMode">
              <Select
                id="scoringMode"
                name="scoringMode"
                defaultValue={values.scoringMode}
              >
                <option value="all_or_nothing">Penuh (semua atau nol)</option>
                <option value="partial">Parsial (per pilihan)</option>
              </Select>
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={values.status}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Dipublikasikan</option>
                <option value="ARCHIVED">Diarsipkan</option>
              </Select>
            </Field>
          </div>

          <Field label="Tersedia mulai" htmlFor="availableFrom" hint="Opsional.">
            <Input
              id="availableFrom"
              name="availableFrom"
              type="date"
              defaultValue={dateValue(values.availableFrom)}
            />
          </Field>
          <Field label="Tersedia sampai" htmlFor="availableTo" hint="Opsional.">
            <Input
              id="availableTo"
              name="availableTo"
              type="date"
              defaultValue={dateValue(values.availableTo)}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-2 text-[12px] text-slate-600">
            <Checkbox
              name="shuffleQuestions"
              defaultChecked={values.shuffleQuestions}
              className="mt-0.5"
            />
            Acak urutan soal
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-[12px] text-slate-600">
            <Checkbox
              name="shuffleOptions"
              defaultChecked={values.shuffleOptions}
              className="mt-0.5"
            />
            Acak pilihan jawaban
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-[12px] text-slate-600">
            <Checkbox
              name="showExplanation"
              defaultChecked={values.showExplanation}
              className="mt-0.5"
            />
            Tampilkan pembahasan setelah selesai
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          Kelas yang mendapat akses
        </p>
        {classes.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classroom) => (
              <label
                key={classroom.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50"
              >
                <Checkbox
                  name="classIds"
                  value={classroom.id}
                  defaultChecked={values.classIds.includes(classroom.id)}
                />
                {classroom.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-slate-400">Belum ada kelas.</p>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          Jika tidak ada kelas dipilih, paket dapat diakses semua siswa.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-slate-400">
            <ListChecks className="h-3.5 w-3.5" />
            Soal dalam paket
          </p>
          <Badge tone={selected.length ? "brand" : "amber"}>
            {selected.length} soal dipilih
          </Badge>
        </div>

        {subjectQuestions.length ? (
          <div className="space-y-2">
            {subjectQuestions.map((question) => {
              const checked = selected.includes(question.id);
              return (
                <div
                  key={question.id}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <Checkbox
                    name="questionIds"
                    value={question.id}
                    checked={checked}
                    onChange={(event) => toggleQuestion(question.id, event.target.checked)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12px] leading-5 text-slate-700">
                      {question.snippet}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="slate">{typeLabels[question.type] ?? question.type}</Badge>
                      <Badge tone="brand">{question.level}</Badge>
                      {question.topicName ? (
                        <span className="text-[10px] text-slate-400">
                          {question.topicName}
                        </span>
                      ) : null}
                      {question.status !== "ACTIVE" ? (
                        <Badge tone="amber">{question.status}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-500">
                    Poin
                    <Input
                      name={`points-${question.id}`}
                      type="number"
                      min={1}
                      defaultValue={pointsById.get(question.id) ?? 1}
                      disabled={!checked}
                      className="h-8 w-16 px-2 text-[12px]"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
            Belum ada soal pada mata pelajaran ini. Tambahkan soal terlebih dahulu
            melalui menu Bank Soal.
          </p>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-slate-400">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Hanya soal berstatus aktif yang sebaiknya dipakai. Soal draft tetap bisa
          dipilih, tetapi belum tampil di portal siswa sampai paket dipublikasikan.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Button type="submit">
          <Save className="h-4 w-4" />
          {submitLabel}
        </Button>
        <p className="text-[11px] text-slate-400">
          Paket draft tidak terlihat oleh siswa.
        </p>
      </div>
    </form>
  );
}

export { statusLabels };

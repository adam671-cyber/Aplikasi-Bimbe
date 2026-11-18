"use client";

import { Check, ImageIcon, Info } from "lucide-react";
import type { AnswerPayload, PublicQuestion } from "@/lib/types";
import { countWords, ESSAY_MAX_WORDS, stripEssaySymbols } from "@/lib/essay";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/rich-text";

const typeHints: Record<PublicQuestion["type"], string> = {
  single_choice: "Pilih satu jawaban yang paling tepat.",
  multiple_choice: "Pilih semua jawaban yang benar. Bisa lebih dari satu.",
  true_false_grid: "Tentukan Benar atau Salah untuk setiap pernyataan.",
  short_answer:
    "Tulis jawaban singkat. Maksimal 15 kata dan tanpa simbol khusus.",
};

function limitEssayWords(text: string) {
  const words = stripEssaySymbols(text).split(/\s+/);
  return words.slice(0, ESSAY_MAX_WORDS).join(" ");
}

export function QuestionRenderer({
  question,
  answer,
  onChange,
}: {
  question: PublicQuestion;
  answer: AnswerPayload | null;
  onChange: (answer: AnswerPayload | null) => void;
}) {
  const selectedSingle =
    typeof answer?.selected === "string" ? answer.selected : null;
  const selectedMultiple = Array.isArray(answer?.selected)
    ? answer.selected
    : [];
  const statements = answer?.statements ?? {};
  const essayText = typeof answer?.text === "string" ? answer.text : "";
  const essayWords = countWords(essayText);

  const setSingle = (optionId: string) => {
    onChange({ selected: optionId });
  };

  const toggleMultiple = (optionId: string) => {
    const next = selectedMultiple.includes(optionId)
      ? selectedMultiple.filter((id) => id !== optionId)
      : [...selectedMultiple, optionId];
    onChange(next.length ? { selected: next } : null);
  };

  const setStatement = (statementId: string, value: boolean) => {
    onChange({ statements: { ...statements, [statementId]: value } });
  };

  return (
    <div>
      {question.stimulus ? (
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            <Info className="h-3 w-3" />
            Stimulus
          </p>
          <RichText text={question.stimulus} className="!text-[13px] !leading-6" />
        </div>
      ) : null}

      {question.imageUrl ? (
        <figure className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt={`Ilustrasi soal: ${question.question.slice(0, 80)}`}
            className="max-h-72 w-full object-contain"
            loading="lazy"
          />
          <figcaption className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
            <ImageIcon className="h-3 w-3" />
            Gambar pendukung soal
          </figcaption>
        </figure>
      ) : null}

      <RichText
        text={question.question}
        className="text-[15px] font-medium !leading-7 text-slate-900 sm:text-base"
      />

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {typeHints[question.type]}
      </p>

      {question.type === "single_choice" ? (
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Pilihan jawaban">
          {question.options.map((option) => {
            const selected = selectedSingle === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSingle(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition",
                  selected
                    ? "border-brand-500 bg-brand-50/70 shadow-sm"
                    : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    selected
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : option.key}
                </span>
                <RichText
                  inline
                  text={option.text}
                  className={cn(
                    "pt-0.5 text-[13px] leading-6",
                    selected ? "font-medium text-brand-900" : "text-slate-700"
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === "multiple_choice" ? (
        <div className="mt-4 space-y-2" role="group" aria-label="Pilihan jawaban ganda">
          {question.options.map((option) => {
            const selected = selectedMultiple.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleMultiple(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition",
                  selected
                    ? "border-brand-500 bg-brand-50/70 shadow-sm"
                    : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-[11px] font-bold",
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : option.key}
                </span>
                <RichText
                  inline
                  text={option.text}
                  className={cn(
                    "pt-0.5 text-[13px] leading-6",
                    selected ? "font-medium text-brand-900" : "text-slate-700"
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === "short_answer" ? (
        <div className="mt-4">
          <label htmlFor={`essay-${question.id}`} className="sr-only">
            Jawaban singkat
          </label>
          <textarea
            id={`essay-${question.id}`}
            value={essayText}
            onChange={(event) => {
              const next = limitEssayWords(event.target.value);
              onChange(next.trim() ? { text: next } : null);
            }}
            rows={4}
            placeholder="Tulis jawabanmu di sini…"
            className="w-full resize-y rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-3 text-[13px] leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400">
              Simbol khusus (! @ # $ % ^ &amp; * ( ) dll.) otomatis dihapus.
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold tabular-nums",
                essayWords >= ESSAY_MAX_WORDS
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {essayWords}/{ESSAY_MAX_WORDS} kata
            </span>
          </div>
        </div>
      ) : null}

      {question.type === "true_false_grid" ? (
        <div className="mt-4 space-y-2.5">
          {question.statements.map((statement, index) => {
            const value = statements[statement.id];
            return (
              <div
                key={statement.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <RichText
                    inline
                    text={statement.text}
                    className="flex-1 pt-0.5 text-[13px] leading-6 text-slate-700"
                  />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 pl-9">
                  {[
                    { label: "Benar", value: true },
                    { label: "Salah", value: false },
                  ].map((choice) => {
                    const active = value === choice.value;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStatement(statement.id, choice.value)}
                        className={cn(
                          "flex h-9 items-center justify-center gap-1.5 rounded-xl border text-[12px] font-semibold transition",
                          active
                            ? choice.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-rose-400 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {active ? <Check className="h-3.5 w-3.5" /> : null}
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

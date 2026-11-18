import { CheckCircle2, Flag, Lightbulb, XCircle } from "lucide-react";
import type { ReviewItem } from "@/lib/data/attempts";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const typeLabels: Record<string, string> = {
  single_choice: "Pilihan ganda",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar / Salah",
  short_answer: "Isian singkat",
};

function answerSummary(item: ReviewItem) {
  const { snapshot, answer } = item;
  if (!answer) return null;

  if (snapshot.type === "single_choice") {
    const selected =
      typeof answer.selected === "string"
        ? snapshot.options.find((option) => option.id === answer.selected)
        : null;
    return selected ? selected.key : null;
  }

  if (snapshot.type === "multiple_choice") {
    const ids = Array.isArray(answer.selected) ? answer.selected : [];
    return ids
      .map((id) => snapshot.options.find((option) => option.id === id)?.key)
      .filter(Boolean)
      .join(", ");
  }

  return null;
}

export function ReviewList({
  items,
  showExplanation,
}: {
  items: ReviewItem[];
  showExplanation: boolean;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const { snapshot, answer, isCorrect } = item;
        const selectedIds = new Set(
          snapshot.type === "multiple_choice"
            ? Array.isArray(answer?.selected)
              ? answer.selected
              : []
            : snapshot.type === "single_choice" && typeof answer?.selected === "string"
              ? [answer.selected]
              : []
        );
        const summary = answerSummary(item);
        const statusLabel =
          item.isCorrect === null
            ? "Belum dinilai"
            : item.isCorrect
              ? "Benar"
              : answer
                ? "Salah"
                : "Kosong";

        return (
          <Card key={snapshot.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white">
                  Soal {item.index}
                </span>
                <Badge tone="slate">{typeLabels[snapshot.type] ?? snapshot.type}</Badge>
                <Badge tone="brand">{snapshot.level}</Badge>
                {snapshot.topicName ? (
                  <span className="text-[11px] text-slate-400">{snapshot.topicName}</span>
                ) : null}
                {item.isFlagged ? (
                  <Badge tone="amber">
                    <Flag className="h-3 w-3" />
                    Ragu
                  </Badge>
                ) : null}
              </div>
              <Badge
                tone={
                  item.isCorrect === null ? "slate" : item.isCorrect ? "emerald" : answer ? "rose" : "amber"
                }
              >
                {item.isCorrect ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {statusLabel}
              </Badge>
            </div>

            <div className="p-4 sm:p-5">
              {snapshot.stimulus ? (
                <div className="mb-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <RichText text={snapshot.stimulus} className="!text-[12px] !leading-6" />
                </div>
              ) : null}

              <RichText
                text={snapshot.question}
                className="text-[14px] font-medium !leading-7 text-slate-900"
              />

              {snapshot.type === "single_choice" ||
              snapshot.type === "multiple_choice" ? (
                <div className="mt-3 space-y-1.5">
                  {snapshot.options.map((option) => {
                    const selected = selectedIds.has(option.id);
                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border px-3 py-2 text-[12px] leading-5",
                          option.isCorrect
                            ? "border-emerald-200 bg-emerald-50/70"
                            : selected
                              ? "border-rose-200 bg-rose-50/70"
                              : "border-slate-100 bg-white"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                            option.isCorrect
                              ? "bg-emerald-600 text-white"
                              : selected
                                ? "bg-rose-500 text-white"
                                : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {option.key}
                        </span>
                        <RichText
                          inline
                          text={option.text}
                          className={cn(
                            "pt-0.5",
                            option.isCorrect
                              ? "text-emerald-900"
                              : selected
                                ? "text-rose-900"
                                : "text-slate-600"
                          )}
                        />
                        <span className="ml-auto flex shrink-0 gap-1 pl-2">
                          {selected ? (
                            <Badge tone={option.isCorrect ? "emerald" : "rose"}>
                              Jawabanmu
                            </Badge>
                          ) : null}
                          {option.isCorrect ? <Badge tone="emerald">Kunci</Badge> : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {snapshot.type === "true_false_grid" ? (
                <div className="mt-3 space-y-1.5">
                  {snapshot.statements.map((statement, index) => {
                    const value = answer?.statements?.[statement.id];
                    return (
                      <div
                        key={statement.id}
                        className="rounded-xl border border-slate-100 bg-white px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {index + 1}
                          </span>
                          <RichText
                            inline
                            text={statement.text}
                            className="flex-1 text-[12px] leading-5 text-slate-600"
                          />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-7">
                          <Badge tone="emerald">
                            Kunci: {statement.correctAnswer ? "Benar" : "Salah"}
                          </Badge>
                          <Badge
                            tone={
                              value === undefined
                                ? "slate"
                                : value === statement.correctAnswer
                                  ? "emerald"
                                  : "rose"
                            }
                          >
                            Jawabanmu:{" "}
                            {value === undefined ? "kosong" : value ? "Benar" : "Salah"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {snapshot.type === "short_answer" ? (
                <div className="mt-3 space-y-2">
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2",
                      item.isCorrect
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-rose-200 bg-rose-50/60"
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Jawabanmu
                    </p>
                    <RichText
                      inline
                      text={
                        typeof answer?.text === "string" && answer.text
                          ? answer.text
                          : "(kosong)"
                      }
                      className={cn(
                        "mt-0.5 text-[12px] leading-5",
                        item.isCorrect ? "text-emerald-900" : "text-rose-900"
                      )}
                    />
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                      Jawaban diterima
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {snapshot.options
                        .filter((option) => option.isCorrect)
                        .map((option) => (
                          <Badge key={option.id} tone="emerald">
                            {option.text}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {snapshot.type === "single_choice" && summary ? (
                <p className="mt-2 text-[11px] text-slate-400">
                  Jawabanmu: pilihan {summary}
                </p>
              ) : null}

              {showExplanation ? (
                <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-800">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Pembahasan
                  </p>
                  <RichText
                    text={snapshot.explanation}
                    className="mt-1 !text-[12px] !leading-6 text-brand-900/90"
                  />
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

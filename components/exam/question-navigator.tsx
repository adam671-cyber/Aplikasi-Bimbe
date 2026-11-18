"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionNavigator({
  total,
  currentIndex,
  isAnswered,
  isFlagged,
  onSelect,
  columns = 5,
}: {
  total: number;
  currentIndex: number;
  isAnswered: (index: number) => boolean;
  isFlagged: (index: number) => boolean;
  onSelect: (index: number) => void;
  columns?: 5 | 6;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 5 ? "grid-cols-5" : "grid-cols-6"
      )}
    >
      {Array.from({ length: total }, (_, index) => {
        const active = index === currentIndex;
        const answered = isAnswered(index);
        const flagged = isFlagged(index);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Soal ${index + 1}${
              answered ? ", sudah dijawab" : ", belum dijawab"
            }${flagged ? ", ditandai ragu" : ""}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "relative grid h-9 w-full place-items-center rounded-lg border text-[11px] font-bold transition",
              active
                ? "border-brand-600 bg-white text-brand-700 ring-2 ring-brand-500 ring-offset-1"
                : answered
                  ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
            )}
          >
            {index + 1}
            {flagged ? (
              <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-amber-400 text-white ring-2 ring-white">
                <Flag className="h-2 w-2" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function NavigatorLegend({
  answered,
  flagged,
  empty,
}: {
  answered: number;
  flagged: number;
  empty: number;
}) {
  const rows = [
    { label: "Dijawab", value: answered, className: "bg-brand-600" },
    { label: "Ragu", value: flagged, className: "bg-amber-400" },
    { label: "Kosong", value: empty, className: "bg-slate-200" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
          <span className={cn("mx-auto block h-1.5 w-6 rounded-full", row.className)} />
          <p className="mt-1 text-[10px] text-slate-500">{row.label}</p>
          <p className="text-[11px] font-bold tabular-nums text-slate-700">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

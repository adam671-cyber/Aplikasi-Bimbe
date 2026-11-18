import * as React from "react";
import { cn } from "@/lib/utils";

export type Tone =
  | "slate"
  | "brand"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null)
    return (
      <Badge tone="slate" className={className}>
        Belum ada nilai
      </Badge>
    );
  const tone: Tone = score >= 80 ? "emerald" : score >= 60 ? "brand" : score >= 40 ? "amber" : "rose";
  return (
    <Badge tone={tone} className={cn("text-xs", className)}>
      {score}
    </Badge>
  );
}

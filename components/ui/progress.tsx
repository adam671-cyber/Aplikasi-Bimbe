import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand-600",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  slate: "bg-slate-400",
};

export function Progress({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: keyof typeof tones;
  className?: string;
  label?: string;
}) {
  const safe = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span>{label}</span>
          <span className="tabular-nums text-slate-700">{safe}%</span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        aria-label={label ?? "Progres"}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", tones[tone])}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function DonutScore({
  score,
  size = 148,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const safe = Math.min(100, Math.max(0, Math.round(score)));
  const color =
    safe >= 80 ? "#10b981" : safe >= 60 ? "#4f46e5" : safe >= 40 ? "#f59e0b" : "#f43f5e";
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${safe * 3.6}deg, #eef2f7 0deg)`,
      }}
      aria-label={label ?? `Skor ${safe} dari 100`}
      role="img"
    >
      <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-white shadow-inner">
        <div className="text-center">
          <div className="font-display text-4xl font-bold tabular-nums text-slate-900">
            {safe}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            dari 100
          </div>
        </div>
      </div>
    </div>
  );
}

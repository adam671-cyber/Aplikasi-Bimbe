import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

const tones = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 truncate text-[11px] text-slate-400">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              tones[tone]
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

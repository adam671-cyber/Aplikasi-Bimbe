"use client";

import { Check, CloudOff, Loader2, RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

export function SaveIndicator({
  state,
  onRetry,
  className,
}: {
  state: SaveState;
  onRetry?: () => void;
  className?: string;
}) {
  if (state === "saving") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500",
          className
        )}
        aria-live="polite"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Menyimpan…
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-200",
          className
        )}
        title="Klik untuk mencoba lagi"
      >
        <RefreshCw className="h-3 w-3" />
        Gagal menyimpan
      </button>
    );
  }

  if (state === "offline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200",
          className
        )}
        aria-live="polite"
      >
        <CloudOff className="h-3 w-3" />
        Offline
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200",
          className
        )}
        aria-live="polite"
      >
        <Check className="h-3 w-3" />
        Tersimpan
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500",
        className
      )}
    >
      <Save className="h-3 w-3" />
      Siap
    </span>
  );
}

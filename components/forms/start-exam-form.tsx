"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight, Play } from "lucide-react";
import { startExamAction, type StartExamState } from "@/lib/actions/attempts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function StartExamForm({
  packageId,
  activeAttemptId,
  label = "Mulai sekarang",
}: {
  packageId: string;
  activeAttemptId?: string | null;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState<StartExamState, FormData>(
    startExamAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="packageId" value={packageId} />
      {state.error ? (
        <Alert variant="error" title="Tidak bisa memulai">
          {state.error}
        </Alert>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Menyiapkan soal…
          </span>
        ) : activeAttemptId ? (
          <>
            <Play className="h-4 w-4" />
            Lanjutkan ujian
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            {label}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      {!activeAttemptId ? (
        <p className="flex items-start gap-1.5 text-[11px] leading-4 text-slate-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Waktu mulai berjalan setelah kamu menekan tombol ini.
        </p>
      ) : null}
    </form>
  );
}

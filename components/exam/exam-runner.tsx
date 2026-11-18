"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  ListChecks,
  Send,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import type { AnswerPayload, PublicAttemptPayload } from "@/lib/types";
import { isEmptyAnswer } from "@/lib/scoring";
import { cn, formatClock } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "./question-renderer";
import { NavigatorLegend, QuestionNavigator } from "./question-navigator";
import { SaveIndicator, type SaveState } from "./save-indicator";

type AnswerMap = Record<string, AnswerPayload | null>;
type FlagMap = Record<string, boolean>;

const typeLabels: Record<string, string> = {
  single_choice: "Pilihan ganda",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar / Salah",
  short_answer: "Isian singkat",
};

export function ExamRunner({ attempt }: { attempt: PublicAttemptPayload }) {
  const router = useRouter();
  const questions = attempt.questions;
  const total = questions.length;

  const initialAnswers = React.useMemo<AnswerMap>(() => {
    const map: AnswerMap = {};
    for (const question of questions) {
      map[question.id] = attempt.answers[question.id]?.answer ?? null;
    }
    return map;
  }, [attempt.answers, questions]);

  const initialFlags = React.useMemo<FlagMap>(() => {
    const map: FlagMap = {};
    for (const question of questions) {
      map[question.id] = Boolean(attempt.answers[question.id]?.isFlagged);
    }
    return map;
  }, [attempt.answers, questions]);

  const [index, setIndex] = React.useState(() =>
    Math.min(Math.max(0, attempt.lastQuestionIndex), Math.max(0, total - 1))
  );
  const [answers, setAnswers] = React.useState<AnswerMap>(initialAnswers);
  const [flags, setFlags] = React.useState<FlagMap>(initialFlags);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [online, setOnline] = React.useState(true);
  const [remaining, setRemaining] = React.useState(() =>
    Math.max(
      0,
      Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
    )
  );
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [exitOpen, setExitOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [autoSubmitting, setAutoSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [violations, setViolations] = React.useState(0);
  const [warningDismissed, setWarningDismissed] = React.useState(false);

  const answersRef = React.useRef(answers);
  const flagsRef = React.useRef(flags);
  const timersRef = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingRef = React.useRef(new Set<string>());
  const submittingRef = React.useRef(false);
  const submittedRef = React.useRef(false);
  const autoRef = React.useRef(false);
  const offsetRef = React.useRef(0);
  const lastBlurRef = React.useRef(0);

  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  React.useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  const answeredCount = questions.filter(
    (question) => !isEmptyAnswer(answers[question.id])
  ).length;
  const flaggedCount = questions.filter((question) => flags[question.id]).length;
  const emptyCount = total - answeredCount;
  const current = questions[index];
  const answeredPercent = total ? (answeredCount / total) * 100 : 0;

  const flush = React.useCallback(
    async (questionId: string) => {
      const timer = timersRef.current.get(questionId);
      if (timer) clearTimeout(timer);
      timersRef.current.delete(questionId);
      pendingRef.current.delete(questionId);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        pendingRef.current.add(questionId);
        setSaveState("offline");
        return;
      }

      setSaveState("saving");
      const payload = {
        questionId,
        answer: answersRef.current[questionId] ?? null,
        isFlagged: Boolean(flagsRef.current[questionId]),
      };

      for (let attemptNo = 0; attemptNo < 3; attemptNo += 1) {
        try {
          const response = await fetch(`/api/attempts/${attempt.id}/answers`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.status === 409) {
            setRemaining(0);
            return;
          }
          if (!response.ok) throw new Error("Gagal menyimpan");
          const data = (await response.json()) as { serverTime?: string };
          if (data.serverTime) {
            offsetRef.current =
              new Date(data.serverTime).getTime() - Date.now();
          }
          setSaveState("saved");
          return;
        } catch {
          if (attemptNo < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 400 * (attemptNo + 1))
            );
          }
        }
      }

      pendingRef.current.add(questionId);
      setSaveState(
        typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error"
      );
    },
    [attempt.id]
  );

  const scheduleSave = React.useCallback(
    (questionId: string) => {
      pendingRef.current.add(questionId);
      setSaveState(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : "saving"
      );
      const existing = timersRef.current.get(questionId);
      if (existing) clearTimeout(existing);
      timersRef.current.set(
        questionId,
        setTimeout(() => {
          void flush(questionId);
        }, 800)
      );
    },
    [flush]
  );

  const flushAll = React.useCallback(async () => {
    const ids = new Set<string>(pendingRef.current);
    for (const id of timersRef.current.keys()) ids.add(id);
    await Promise.all([...ids].map((id) => flush(id)));
  }, [flush]);

  const doSubmit = React.useCallback(
    async (auto = false) => {
      if (submittingRef.current || submittedRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setAutoSubmitting(auto);
      setError(null);
      try {
        await flushAll();
        const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
          method: "POST",
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          redirectTo?: string;
        };
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Gagal mengumpulkan ujian.");
        }
        submittedRef.current = true;
        router.replace(data.redirectTo ?? `/hasil/${attempt.id}`);
        router.refresh();
      } catch (submitError) {
        submittingRef.current = false;
        setSubmitting(false);
        setAutoSubmitting(false);
        autoRef.current = false;
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Terjadi kesalahan saat mengumpulkan ujian."
        );
      }
    },
    [attempt.id, flushAll, router]
  );

  // Timer berbasis expires_at + offset jam server.
  React.useEffect(() => {
    offsetRef.current =
      new Date(attempt.serverTime).getTime() - Date.now();
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor(
          (new Date(attempt.expiresAt).getTime() -
            (Date.now() + offsetRef.current)) /
            1000
        )
      );
      setRemaining(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt.expiresAt, attempt.serverTime]);

  // Auto-submit saat waktu habis.
  React.useEffect(() => {
    if (
      remaining <= 0 &&
      !submittedRef.current &&
      !autoRef.current &&
      !submittingRef.current
    ) {
      autoRef.current = true;
      void doSubmit(true);
    }
  }, [remaining, doSubmit]);

  // Status koneksi + retry otomatis.
  React.useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => {
      setOnline(true);
      setSaveState("saving");
      for (const questionId of pendingRef.current) {
        void flush(questionId);
      }
    };
    const handleOffline = () => {
      setOnline(false);
      setSaveState("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  // Peringatan sebelum meninggalkan halaman.
  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Log aktivitas ujian (tanpa memblokir aksesibilitas).
  const logEvent = React.useCallback(
    (type: string) => {
      if (submittedRef.current) return;
      void fetch(`/api/attempts/${attempt.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [attempt.id]
  );

  React.useEffect(() => {
    const bump = () => setViolations((value) => value + 1);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        logEvent("visibility_hidden");
        bump();
      }
    };
    const onBlur = () => {
      if (Date.now() - lastBlurRef.current < 8000) return;
      lastBlurRef.current = Date.now();
      logEvent("window_blur");
      bump();
    };
    const onCopy = () => logEvent("copy");
    const onPaste = () => logEvent("paste");
    const onContext = () => logEvent("contextmenu");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
    };
  }, [logEvent]);

  // Simpan posisi soal terakhir.
  React.useEffect(() => {
    if (submittedRef.current) return;
    const timeout = setTimeout(() => {
      if (!current) return;
      void fetch(`/api/attempts/${attempt.id}/answers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          lastQuestionIndex: index,
        }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [attempt.id, current, index]);

  const goTo = React.useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(Math.max(0, nextIndex), total - 1);
      setIndex(clamped);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [total]
  );

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  const changeAnswer = (answer: AnswerPayload | null) => {
    if (!current) return;
    answersRef.current = { ...answersRef.current, [current.id]: answer };
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
    scheduleSave(current.id);
  };

  const toggleFlag = () => {
    if (!current) return;
    const next = !flagsRef.current[current.id];
    flagsRef.current = { ...flagsRef.current, [current.id]: next };
    setFlags((prev) => ({ ...prev, [current.id]: next }));
    scheduleSave(current.id);
  };

  const isAnswered = (questionIndex: number) =>
    !isEmptyAnswer(answers[questions[questionIndex]?.id ?? ""]);
  const isFlagged = (questionIndex: number) =>
    Boolean(flags[questions[questionIndex]?.id ?? ""]);

  const timerTone =
    remaining <= 300
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : remaining <= 600
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  const navigatorPanel = (
    <>
      <QuestionNavigator
        total={total}
        currentIndex={index}
        isAnswered={isAnswered}
        isFlagged={isFlagged}
        onSelect={(questionIndex) => {
          goTo(questionIndex);
          setReviewOpen(false);
        }}
        columns={5}
      />
      <div className="mt-3">
        <NavigatorLegend
          answered={answeredCount}
          flagged={flaggedCount}
          empty={emptyCount}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-6">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-[12px] font-semibold text-slate-800">
              {attempt.packageTitle}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {attempt.subjectName} · Soal {index + 1} dari {total}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-bold tabular-nums ring-1 ring-inset",
              timerTone
            )}
            aria-live="polite"
            aria-label={`Sisa waktu ${formatClock(remaining)}`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            {formatClock(remaining)}
          </span>

          <SaveIndicator
            state={saveState}
            onRetry={() => {
              for (const questionId of pendingRef.current) {
                void flush(questionId);
              }
            }}
            className="hidden sm:inline-flex"
          />
        </div>
      </header>

      {!online ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-medium text-amber-800">
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="h-3.5 w-3.5" />
            Koneksi terputus — jawaban akan disimpan saat online kembali.
          </span>
        </div>
      ) : null}

      {violations >= 2 && !warningDismissed ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
          <div className="mx-auto flex max-w-6xl items-center gap-2 text-[11px] font-medium text-amber-800">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">
              Kami mendeteksi kamu berpindah dari halaman ujian. Tetap fokus ya.
            </span>
            <button
              type="button"
              onClick={() => setWarningDismissed(true)}
              className="font-semibold underline-offset-2 hover:underline"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-3 py-4 pb-28 sm:px-6 lg:py-6 lg:pb-8">
        {error ? (
          <Alert variant="error" title="Ujian belum terkirim" className="mb-4">
            {error}
            <button
              type="button"
              onClick={() => void doSubmit(false)}
              className="ml-2 font-semibold underline-offset-2 hover:underline"
            >
              Coba lagi
            </button>
          </Alert>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_290px] lg:items-start">
          <main>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-lg bg-brand-600 px-2.5 text-[11px] font-bold text-white">
                    Soal {index + 1}
                  </span>
                  <Badge tone="slate">{current?.level}</Badge>
                  <span className="text-[11px] text-slate-400">
                    {current ? typeLabels[current.type] : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleFlag}
                  aria-pressed={Boolean(current && flags[current.id])}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition",
                    current && flags[current.id]
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {current && flags[current.id] ? "Ditandai ragu" : "Tandai ragu"}
                </button>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                  <span>{answeredCount} dari {total} soal dijawab</span>
                  <span>{Math.round(answeredPercent)}%</span>
                </div>
                <Progress value={answeredPercent} tone={answeredPercent === 100 ? "emerald" : "brand"} />
              </div>

              <div className="mt-5">
                {current ? (
                  <QuestionRenderer
                    question={current}
                    answer={answers[current.id] ?? null}
                    onChange={changeAnswer}
                  />
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>

                {index === total - 1 ? (
                  <Button
                    onClick={() => setReviewOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <ListChecks className="h-4 w-4" />
                    Review & kirim
                  </Button>
                ) : (
                  <Button onClick={() => goTo(index + 1)}>
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-[10px] text-slate-400 ring-1 ring-slate-200">
              <span>Jawaban tersimpan otomatis.</span>
              <span className="sm:hidden">
                <SaveIndicator
                  state={saveState}
                  onRetry={() => {
                    for (const questionId of pendingRef.current) {
                      void flush(questionId);
                    }
                  }}
                />
              </span>
              <span className="hidden sm:inline">
                Gunakan tombol ← → untuk berpindah soal.
              </span>
            </div>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-3">
              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-slate-800">Navigasi soal</p>
                  <Badge tone={emptyCount === 0 ? "emerald" : "slate"}>
                    {answeredCount}/{total}
                  </Badge>
                </div>
                {navigatorPanel}
                <Button
                  onClick={() => setReviewOpen(true)}
                  className="mt-4 w-full"
                  variant={emptyCount === 0 ? "success" : "primary"}
                >
                  <Send className="h-4 w-4" />
                  Review & kirim
                </Button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Sisa {emptyCount} soal belum dijawab
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Waktu terus berjalan
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Jangan menutup tab. Jika koneksi terputus, jawaban yang sudah
                  tersimpan tetap aman.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Soal sebelumnya"
            className="w-11 px-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => setReviewOpen(true)}
            className="flex-1"
          >
            <ListChecks className="h-4 w-4" />
            Navigasi
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
              {answeredCount}/{total}
            </span>
          </Button>
          {index === total - 1 ? (
            <Button
              onClick={() => setReviewOpen(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Kirim
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => goTo(index + 1)} className="flex-1">
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Review sebelum mengumpulkan"
        description={`${answeredCount} dijawab · ${emptyCount} kosong · ${flaggedCount} ditandai ragu`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Periksa lagi
            </Button>
            <Button
              variant={emptyCount > 0 ? "warning" : "success"}
              onClick={() => {
                setReviewOpen(false);
                setSubmitOpen(true);
              }}
            >
              <Send className="h-4 w-4" />
              Kumpulkan ujian
            </Button>
          </>
        }
      >
        {emptyCount > 0 ? (
          <Alert variant="warning" className="mb-4">
            Masih ada {emptyCount} soal yang belum dijawab. Soal kosong akan
            dinilai 0.
          </Alert>
        ) : (
          <Alert variant="success" className="mb-4">
            Semua soal sudah dijawab. Periksa sekali lagi sebelum mengumpulkan.
          </Alert>
        )}
        {navigatorPanel}
        <p className="mt-4 text-[11px] leading-5 text-slate-400">
          Klik nomor soal untuk kembali memeriksa. Setelah dikumpulkan, jawaban
          tidak dapat diubah lagi.
        </p>
      </Modal>

      {/* Submit modal */}
      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Kumpulkan ujian sekarang?"
        description="Pastikan kamu sudah memeriksa semua jawaban."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant="success"
              onClick={() => void doSubmit(false)}
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Mengumpulkan…
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ya, kumpulkan
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="font-display text-xl font-bold text-emerald-700">{answeredCount}</p>
            <p className="text-[10px] text-emerald-600">Dijawab</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-display text-xl font-bold text-slate-700">{emptyCount}</p>
            <p className="text-[10px] text-slate-500">Kosong</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="font-display text-xl font-bold text-amber-700">{flaggedCount}</p>
            <p className="text-[10px] text-amber-600">Ragu</p>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-6 text-slate-500">
          Waktu tersisa {formatClock(remaining)}. Setelah dikumpulkan, skor dan
          pembahasan akan langsung dihitung.
        </p>
        {error ? <Alert variant="error" className="mt-3">{error}</Alert> : null}
      </Modal>

      {/* Exit modal */}
      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Keluar dari ujian?"
        description="Waktu tetap berjalan meskipun kamu keluar."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExitOpen(false)}>
              Tetap di ujian
            </Button>
            <ButtonLink href="/dashboard" variant="danger">
              Keluar
            </ButtonLink>
          </>
        }
      >
        <p className="text-[12px] leading-6 text-slate-500">
          Jawaban yang sudah tersimpan tidak akan hilang. Kamu bisa melanjutkan
          dari dashboard selama waktu belum habis.
        </p>
        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
          Sisa waktu saat ini: {formatClock(remaining)}
        </div>
      </Modal>

      {/* Auto submit overlay */}
      {autoSubmitting ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/55 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-[var(--shadow-float)]">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-display text-lg font-bold text-slate-900">
              Waktu habis
            </h2>
            <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
              Jawaban yang sudah tersimpan sedang dikumpulkan. Mohon tunggu…
            </p>
            <div className="mx-auto mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
            </div>
            {error ? (
              <button
                type="button"
                onClick={() => void doSubmit(true)}
                className="mt-4 text-[12px] font-semibold text-rose-600 underline-offset-2 hover:underline"
              >
                Gagal mengirim — coba lagi
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

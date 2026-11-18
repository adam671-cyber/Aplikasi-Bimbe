import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Filter,
  History,
  RotateCcw,
  Timer,
} from "lucide-react";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireStudent } from "@/lib/auth/guards";
import { getSubjects, listAttemptsForStudent } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Riwayat",
};

const statusLabel: Record<string, string> = {
  in_progress: "Sedang dikerjakan",
  submitted: "Selesai",
  expired: "Waktu habis",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; subject?: string; status?: string }>;
}) {
  const user = await requireStudent();
  const params = await searchParams;
  const [subjects, all] = await Promise.all([
    getSubjects(),
    listAttemptsForStudent(user.studentId!),
  ]);

  const attempts = all.filter((item) => {
    if (params.type && params.type !== "all" && item.package.type !== params.type)
      return false;
    if (
      params.subject &&
      params.subject !== "all" &&
      item.subject.id !== params.subject
    )
      return false;
    if (
      params.status &&
      params.status !== "all" &&
      item.attempt.status !== params.status
    )
      return false;
    return true;
  });

  const submitted = all.filter(
    (item) => item.attempt.status === "submitted" && item.attempt.score !== null
  );
  const average =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((sum, item) => sum + (item.attempt.score ?? 0), 0) /
            submitted.length
        )
      : null;
  const best =
    submitted.length > 0
      ? Math.max(...submitted.map((item) => item.attempt.score ?? 0))
      : null;

  const hasFilter = Boolean(
    (params.type && params.type !== "all") ||
      (params.subject && params.subject !== "all") ||
      (params.status && params.status !== "all")
  );

  return (
    <div>
      <PageHeader
        eyebrow="Hasil belajar"
        title="Riwayat & hasil"
        description="Semua latihan dan tryout yang pernah kamu kerjakan, lengkap dengan skor dan statusnya."
        actions={
          <ButtonLink href="/mapel/matematika/tryout" size="sm">
            Mulai paket baru
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard
          label="Total attempt"
          value={all.length}
          icon={<History className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Rata-rata"
          value={average ?? "—"}
          icon={<BookOpen className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Terbaik"
          value={best ?? "—"}
          icon={<Timer className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <Card className="mb-5">
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="min-w-[140px] flex-1">
              <label htmlFor="type" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Jenis paket
              </label>
              <Select id="type" name="type" defaultValue={params.type ?? "all"} className="h-10 text-[13px]">
                <option value="all">Semua jenis</option>
                <option value="latihan">Latihan</option>
                <option value="tryout">Tryout</option>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1">
              <label htmlFor="subject" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Mata pelajaran
              </label>
              <Select id="subject" name="subject" defaultValue={params.subject ?? "all"} className="h-10 text-[13px]">
                <option value="all">Semua mapel</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[150px] flex-1">
              <label htmlFor="status" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Status
              </label>
              <Select id="status" name="status" defaultValue={params.status ?? "all"} className="h-10 text-[13px]">
                <option value="all">Semua status</option>
                <option value="submitted">Selesai</option>
                <option value="in_progress">Sedang dikerjakan</option>
                <option value="expired">Waktu habis</option>
              </Select>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            {hasFilter ? (
              <Link
                href="/riwayat"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Link>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {attempts.length ? (
        <div className="space-y-2.5">
          {attempts.map((item) => (
            <Card key={item.attempt.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                  {item.package.type === "tryout" ? (
                    <Timer className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.package.type === "tryout" ? "rose" : "emerald"}>
                      {item.package.type === "tryout" ? "Tryout" : "Latihan"}
                    </Badge>
                    <Badge tone="slate">{item.subject.name}</Badge>
                    <Badge
                      tone={
                        item.attempt.status === "submitted"
                          ? "sky"
                          : item.attempt.status === "expired"
                            ? "amber"
                            : "brand"
                      }
                    >
                      {statusLabel[item.attempt.status]}
                    </Badge>
                  </div>
                  <h3 className="mt-1.5 truncate font-display text-[14px] font-bold text-slate-900">
                    {item.package.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>
                      {formatDateTime(item.attempt.submittedAt ?? item.attempt.startedAt)}
                    </span>
                    {item.attempt.status !== "in_progress" ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>
                          {item.attempt.correctCount} benar · {item.attempt.incorrectCount} salah ·{" "}
                          {item.attempt.unansweredCount} kosong
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          Lanjutkan sebelum waktu habis
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBadge score={item.attempt.score} />
                  <ButtonLink
                    href={
                      item.attempt.status === "in_progress"
                        ? `/ujian/${item.attempt.id}`
                        : `/hasil/${item.attempt.id}`
                    }
                    size="sm"
                    variant="secondary"
                  >
                    {item.attempt.status === "in_progress" ? "Lanjutkan" : "Lihat hasil"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title={hasFilter ? "Tidak ada hasil yang cocok" : "Belum ada riwayat"}
          description={
            hasFilter
              ? "Coba ubah filter atau reset untuk melihat semua hasil."
              : "Selesaikan satu latihan atau tryout, lalu hasilnya akan muncul di sini."
          }
          action={
            hasFilter ? (
              <ButtonLink href="/riwayat" variant="secondary" size="sm">
                Reset filter
              </ButtonLink>
            ) : (
              <ButtonLink href="/mapel/matematika/latihan" size="sm">
                Mulai latihan
              </ButtonLink>
            )
          }
        />
      )}
    </div>
  );
}

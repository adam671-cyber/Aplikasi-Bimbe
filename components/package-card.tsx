import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, FileText, Lock } from "lucide-react";
import type { PackageView } from "@/lib/data/catalog";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PackageCard({
  pkg,
  href,
  open = true,
  reason,
  tone = "topic",
}: {
  pkg: PackageView;
  href: string;
  open?: boolean;
  reason?: string | null;
  tone?: "subject" | "topic";
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={pkg.type === "tryout" ? "rose" : "emerald"}>
            {pkg.type === "tryout" ? "Tryout" : "Latihan"}
          </Badge>
          {tone === "topic" ? (
            <Badge tone="slate">{pkg.subject.name}</Badge>
          ) : null}
          {!open ? (
            <Badge tone="amber">
              <Lock className="h-3 w-3" />
              Belum dibuka
            </Badge>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
      </div>
      <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-slate-900 group-hover:text-brand-700">
        {pkg.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">
        {pkg.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-400">
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {pkg.questionCount} soal
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {pkg.durationMinutes} menit
        </span>
        {pkg.availableFrom && !open ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(pkg.availableFrom)}
          </span>
        ) : null}
      </div>
      {!open && reason ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-4 text-amber-700">
          {reason}
        </p>
      ) : null}
    </>
  );

  if (!open) {
    return (
      <div className="cursor-not-allowed rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 opacity-80 shadow-[var(--shadow-card)]">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-float)]"
      )}
    >
      {content}
    </Link>
  );
}

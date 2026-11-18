import Link from "next/link";
import { ArrowUpRight, BookOpen, Calculator, FlaskConical } from "lucide-react";
import type { SubjectRecord } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const icons = {
  calculator: Calculator,
  "book-open": BookOpen,
  "flask-conical": FlaskConical,
} as const;

const palettes = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    accent: "from-indigo-500 to-violet-500",
    text: "text-indigo-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    accent: "from-rose-500 to-pink-500",
    text: "text-rose-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    accent: "from-emerald-500 to-teal-500",
    text: "text-emerald-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    accent: "from-amber-500 to-orange-500",
    text: "text-amber-600",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    accent: "from-sky-500 to-blue-500",
    text: "text-sky-600",
  },
};

export function SubjectCard({
  subject,
  questionCount,
  packageCount,
}: {
  subject: SubjectRecord;
  questionCount: number;
  packageCount: number;
}) {
  const Icon = icons[subject.icon as keyof typeof icons] ?? BookOpen;
  const palette = palettes[subject.color] ?? palettes.indigo;

  return (
    <Link
      href={`/mapel/${subject.slug}`}
      className="group relative overflow-hidden rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-float)]"
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80",
          palette.accent
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset",
            palette.icon
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
        {subject.name}
      </h3>
      <p className="mt-1 line-clamp-3 text-[13px] leading-6 text-slate-500">
        {subject.description}
      </p>
      <div className="mt-4 flex items-center gap-3 text-[11px] font-medium text-slate-400">
        <span>{questionCount} soal</span>
        <span className="h-1 w-1 rounded-full bg-slate-200" />
        <span>{packageCount} paket</span>
        <span className={cn("ml-auto inline-flex items-center gap-1 font-semibold", palette.text)}>
          Masuk
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

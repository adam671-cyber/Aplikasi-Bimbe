import { BookOpen, Calculator, FlaskConical } from "lucide-react";
import type { SubjectRecord } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const icons = {
  calculator: Calculator,
  "book-open": BookOpen,
  "flask-conical": FlaskConical,
} as const;

const palettes = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
};

const sizes = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-16 w-16 rounded-2xl",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function SubjectIcon({
  subject,
  size = "md",
  className,
}: {
  subject: Pick<SubjectRecord, "icon" | "color">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const Icon = icons[subject.icon as keyof typeof icons] ?? BookOpen;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center ring-1 ring-inset",
        palettes[subject.color] ?? palettes.indigo,
        sizes[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </span>
  );
}

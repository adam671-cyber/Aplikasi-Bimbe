import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-bold text-slate-900">
            TKA Cerdas
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">
            Bimbel Cerdas Nusantara
          </span>
        </span>
      ) : null}
    </Link>
  );
}

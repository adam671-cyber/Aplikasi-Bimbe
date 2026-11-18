import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
  variant = "light",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-bimbel-star-kids.png"
        alt="BIMBEL STAR KIDS"
        width={40}
        height={40}
        priority
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
      {!compact ? (
        <span className="hidden leading-tight min-[380px]:block">
          <span
            className={cn(
              "block font-display text-[12px] font-extrabold uppercase tracking-tight sm:text-[13px]",
              variant === "dark" ? "text-white" : "text-slate-900"
            )}
          >
            Bimbel Star Kids
          </span>
          <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Bimbingan Belajar
          </span>
        </span>
      ) : null}
    </Link>
  );
}

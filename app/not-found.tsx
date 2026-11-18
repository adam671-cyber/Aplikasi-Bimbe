import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-slate-200 bg-white p-7 text-center shadow-[var(--shadow-card)]">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
          Tautan mungkin sudah berubah atau paket sudah tidak tersedia.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <ButtonLink href="/">Kembali ke beranda</ButtonLink>
          <Link
            href="/login"
            className="text-[12px] font-medium text-slate-500 hover:text-brand-600"
          >
            Masuk ke aplikasi
          </Link>
        </div>
      </div>
    </div>
  );
}

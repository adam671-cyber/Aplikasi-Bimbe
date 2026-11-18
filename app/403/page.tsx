import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser, roleHome } from "@/lib/auth/session";

export default async function ForbiddenPage() {
  const user = await getCurrentUser();

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-slate-200 bg-white p-7 text-center shadow-[var(--shadow-card)]">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldX className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
          Akses tidak diizinkan
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
          Halaman ini tidak tersedia untuk peran akunmu. Jika kamu merasa ini
          keliru, hubungi admin bimbel.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {user ? (
            <ButtonLink href={roleHome(user.role)}>
              <ArrowLeft className="h-4 w-4" />
              Kembali ke dashboard
            </ButtonLink>
          ) : (
            <ButtonLink href="/login">Masuk dengan akun lain</ButtonLink>
          )}
          <Link
            href="/"
            className="text-[12px] font-medium text-slate-500 hover:text-brand-600"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

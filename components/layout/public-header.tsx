import Link from "next/link";
import { ArrowRight, LogIn, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser, roleHome } from "@/lib/auth/session";

export async function PublicHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-slate-600 md:flex">
          <Link href="/#mapel" className="transition hover:text-brand-600">
            Mata Pelajaran
          </Link>
          <Link href="/#fitur" className="transition hover:text-brand-600">
            Fitur
          </Link>
          <Link href="/panduan" className="transition hover:text-brand-600">
            Panduan
          </Link>
          <Link href="/privasi" className="transition hover:text-brand-600">
            Privasi
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink href={roleHome(user.role)} size="sm">
              Buka Dashboard
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                <LogIn className="h-4 w-4" />
                Masuk
              </ButtonLink>
              <ButtonLink href="/login" size="sm">
                Mulai Belajar
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 md:hidden"
            aria-label="Menu navigasi"
            title="Gunakan menu bawah saat masuk"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

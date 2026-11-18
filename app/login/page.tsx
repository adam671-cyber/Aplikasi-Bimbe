import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Cloud,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, roleHome } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute -left-24 top-[-10%] h-96 w-96 rounded-full bg-brand-600/35 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-[-20%] right-[-10%] h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold">TKA Cerdas</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400">
                Bimbel Cerdas Nusantara
              </span>
            </span>
          </Link>
        </div>

        <div className="relative my-auto max-w-md py-10">
          <Badge tone="brand" className="bg-brand-500/15 text-brand-200 ring-brand-400/20">
            Simulasi TKA Kelas 6 SD/MI
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Belajar terarah,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-emerald-300 bg-clip-text text-transparent">
              hasil terukur.
            </span>
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Satu tempat untuk latihan, tryout, pembahasan, dan pemantauan
            perkembangan siswa bimbel.
          </p>

          <div className="mt-8 space-y-3">
            {[
              {
                icon: Clock3,
                title: "Waktu berjalan dari server",
                description: "Adil untuk semua siswa, tidak bisa diakali refresh.",
              },
              {
                icon: Cloud,
                title: "Jawaban tersimpan otomatis",
                description: "Koneksi sempat putus? Jawaban tetap aman.",
              },
              {
                icon: BarChart3,
                title: "Analisis per topik & level",
                description: "Tutor tahu persis bagian mana yang perlu diulang.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-brand-300 ring-1 ring-inset ring-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Data siswa terlindungi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Tanpa iklan
          </span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="ml-auto text-[12px] font-medium text-slate-500 transition hover:text-brand-600"
          >
            ← Kembali ke beranda
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Masuk ke akunmu
              </h2>
              <p className="mt-1 text-[13px] leading-6 text-slate-500">
                Gunakan username/NIS yang diberikan tutor atau admin bimbel.
              </p>
            </div>
            <LoginForm nextPath={next} />
            <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
              Dengan masuk, kamu menyetujui{" "}
              <Link href="/privasi" className="font-medium text-slate-600 underline-offset-2 hover:underline">
                kebijakan privasi
              </Link>{" "}
              dan aturan penggunaan aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

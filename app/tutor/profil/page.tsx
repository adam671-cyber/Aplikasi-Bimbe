import type { Metadata } from "next";
import {
  KeyRound,
  LogOut,
  Mail,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { logoutAction } from "@/lib/auth/actions";
import { requireTutor } from "@/lib/auth/guards";
import { getTutorClasses } from "@/lib/data/students";

export const metadata: Metadata = { title: "Profil Tutor" };

export default async function TutorProfilePage() {
  const user = await requireTutor();
  const classes = await getTutorClasses(user.id);

  const rows = [
    { label: "Username", value: user.username ?? "-", icon: UserRound },
    { label: "Email", value: user.email ?? "-", icon: Mail },
    {
      label: "Kelas diampu",
      value: classes.length ? classes.map((item) => item.name).join(", ") : "Belum ada",
      icon: School,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Akun"
        title="Profil & keamanan"
        description="Kelola akun tutor dan password untuk menjaga keamanan data siswa."
        actions={
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        }
      />

      {user.mustChangePassword ? (
        <Alert variant="warning" title="Ganti password awal" className="mb-4">
          Kamu masih menggunakan password sementara. Segera ganti melalui
          formulir di bawah.
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" className="h-16 w-16 text-xl" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold text-slate-900">
                  {user.name}
                </h2>
                <p className="text-[12px] text-slate-500">@{user.username}</p>
                <div className="mt-1.5">
                  <Badge tone="sky">Tutor</Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {rows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 py-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className="ml-auto text-right text-[12px] font-semibold text-slate-800">
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Ganti password"
              description="Gunakan minimal 8 karakter dan jangan bagikan ke siapa pun."
              action={<KeyRound className="h-4 w-4 text-slate-300" />}
            />
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Kewajiban tutor"
              description="Akses data siswa terbatas pada kelas yang diampu."
              action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
            />
            <CardContent className="space-y-2 text-[12px] leading-5 text-slate-500">
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Gunakan hasil analisis untuk mendampingi siswa, bukan membandingkan
                antar siswa di depan kelas.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Jangan membagikan akun tutor. Setiap aktivitas tercatat pada akun
                masing-masing.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Laporkan ke admin jika ada data siswa yang tidak sesuai.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

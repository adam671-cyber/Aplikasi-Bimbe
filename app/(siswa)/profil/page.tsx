import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { logoutAction } from "@/lib/auth/actions";
import { requireStudent } from "@/lib/auth/guards";
import { getStudentByUserId } from "@/lib/data";

export const metadata: Metadata = {
  title: "Profil",
};

export default async function StudentProfilePage() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);

  const rows = [
    { label: "NIS", value: student?.nis ?? "-", icon: BadgeCheck },
    { label: "Kelas", value: student?.classroom?.name ?? "Belum ada kelas", icon: GraduationCap },
    { label: "Asal sekolah", value: student?.school ?? "-", icon: School },
    {
      label: "Jenis kelamin",
      value: student?.gender === "P" ? "Perempuan" : student?.gender === "L" ? "Laki-laki" : "-",
      icon: UserRound,
    },
    { label: "HP orang tua", value: student?.parentPhone ?? "-", icon: Phone },
    { label: "Email", value: user.email ?? "-", icon: Mail },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Akun"
        title="Profil & keamanan"
        description="Data akun yang terhubung dengan kelas bimbelmu."
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
          Kamu masih menggunakan password sementara. Demi keamanan, ganti
          password melalui formulir di bawah.
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
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="brand">Siswa</Badge>
                  {student?.classroom ? (
                    <Badge tone="slate">{student.classroom.name}</Badge>
                  ) : null}
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

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                Tahun ajaran
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                {student?.classroom?.academicYear ?? "2026/2027"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Ganti password"
              description="Gunakan minimal 8 karakter dan jangan bagikan ke orang lain."
              action={<KeyRound className="h-4 w-4 text-slate-300" />}
            />
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Keamanan & privasi"
              description="Akun ini hanya untuk satu siswa. Jangan berbagi akun."
              action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
            />
            <CardContent className="space-y-2 text-[12px] leading-5 text-slate-500">
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Jawaban ujian tersimpan otomatis dan hanya dapat dilihat olehmu,
                tutor kelas, dan admin bimbel.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Kunci jawaban tidak dikirim ke perangkat sebelum ujian
                dikumpulkan.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Lupa password? Hubungi tutor atau admin untuk reset.
              </p>
              <Link
                href="/privasi"
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Baca kebijakan privasi
                <Info className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

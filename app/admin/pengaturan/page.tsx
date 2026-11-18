import type { Metadata } from "next";
import {
  Building2,
  Database,
  KeyRound,
  Megaphone,
  Save,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { updateSettingsAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <div>
      <PageHeader
        eyebrow="Pengaturan"
        title="Identitas & preferensi bimbel"
        description="Teks ini dipakai pada halaman publik dan panduan siswa."
      />

      {params.ok ? (
        <Alert variant="success" className="mb-4">
          {params.ok}
        </Alert>
      ) : null}
      {params.error ? (
        <Alert variant="error" className="mb-4">
          {params.error}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <CardHeader
            title="Informasi bimbel"
            description="Nama aplikasi, lembaga, dan tahun ajaran."
            action={<Building2 className="h-4 w-4 text-slate-300" />}
          />
          <CardContent>
            <form action={updateSettingsAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama aplikasi" htmlFor="appName" required>
                  <Input id="appName" name="appName" defaultValue={settings.appName} required />
                </Field>
                <Field label="Nama bimbel" htmlFor="bimbelName" required>
                  <Input
                    id="bimbelName"
                    name="bimbelName"
                    defaultValue={settings.bimbelName}
                    required
                  />
                </Field>
                <Field label="Tahun ajaran" htmlFor="academicYear" required>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    defaultValue={settings.academicYear}
                    placeholder="2026/2027"
                    required
                  />
                </Field>
                <Field label="WhatsApp admin" htmlFor="contactWhatsapp">
                  <Input
                    id="contactWhatsapp"
                    name="contactWhatsapp"
                    defaultValue={settings.contactWhatsapp}
                    placeholder="0812-xxxx-xxxx"
                  />
                </Field>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  <Megaphone className="h-3.5 w-3.5" />
                  Halaman depan
                </p>
                <div className="space-y-4">
                  <Field label="Judul hero" htmlFor="heroTitle">
                    <Input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} />
                  </Field>
                  <Field label="Subjudul hero" htmlFor="heroSubtitle">
                    <Textarea
                      id="heroSubtitle"
                      name="heroSubtitle"
                      defaultValue={settings.heroSubtitle}
                      rows={2}
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <Field
                  label="Petunjuk pengerjaan bawaan"
                  htmlFor="defaultInstructions"
                  hint="Ditampilkan pada konfirmasi mulai ujian."
                >
                  <Textarea
                    id="defaultInstructions"
                    name="defaultInstructions"
                    defaultValue={settings.defaultInstructions}
                    rows={4}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Simpan pengaturan
                </Button>
                <p className="text-[11px] text-slate-400">
                  Perubahan langsung terlihat pada halaman publik.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Status integrasi"
              description="Aplikasi berjalan dengan penyimpanan demo."
              action={<Database className="h-4 w-4 text-slate-300" />}
            />
            <CardContent className="space-y-2 text-[12px] leading-5 text-slate-500">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2">
                <span className="font-semibold text-amber-700">Database</span>
                <Badge tone="amber">Demo in-memory</Badge>
              </div>
              <p>
                Data akan kembali ke contoh awal setiap server dijalankan ulang.
                Skema Supabase telah disiapkan pada folder <code>supabase/</code>{" "}
                untuk integrasi berikutnya.
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="font-semibold text-slate-600">Autentikasi</span>
                <Badge tone="slate">Cookie sesi</Badge>
              </div>
              <p className="flex items-start gap-1.5">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                Akun demo tetap tersedia untuk pengujian alur siswa, tutor, dan admin.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Keamanan data"
              description="Prinsip yang harus dijaga saat migrasi."
              action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
            />
            <CardContent className="space-y-2 text-[12px] leading-5 text-slate-500">
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Siswa hanya dapat mengakses attempt miliknya sendiri.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Tutor hanya melihat siswa pada kelas yang diampu.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Penilaian memakai snapshot soal agar hasil lama tidak berubah.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Jangan menaruh service role key Supabase di sisi klien.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

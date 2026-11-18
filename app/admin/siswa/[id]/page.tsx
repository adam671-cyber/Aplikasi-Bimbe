import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { updateStudentAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getStudentById, listClasses } from "@/lib/data/students";

export const metadata: Metadata = { title: "Ubah Siswa" };

export default async function AdminStudentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const [student, classes] = await Promise.all([getStudentById(id), listClasses()]);

  if (!student) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Data siswa"
        title={`Ubah ${student.user.name}`}
        description={`NIS ${student.nis} · ${student.classroom?.name ?? "belum ada kelas"}`}
        backHref="/admin/siswa"
        backLabel="Kembali ke daftar siswa"
      />

      {error ? (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <form action={updateStudentAction} className="space-y-4">
            <input type="hidden" name="studentId" value={student.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap" htmlFor="name" required>
                <Input id="name" name="name" defaultValue={student.user.name} required />
              </Field>
              <Field label="NIS" htmlFor="nis" required hint="Juga dipakai sebagai username.">
                <Input id="nis" name="nis" defaultValue={student.nis} required />
              </Field>
              <Field label="Kelas" htmlFor="classId">
                <Select id="classId" name="classId" defaultValue={student.classId ?? ""}>
                  <option value="">Belum ditentukan</option>
                  {classes.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Jenis kelamin" htmlFor="gender">
                <Select id="gender" name="gender" defaultValue={student.gender ?? ""}>
                  <option value="">Tidak diisi</option>
                  <option value="P">Perempuan</option>
                  <option value="L">Laki-laki</option>
                </Select>
              </Field>
              <Field label="Asal sekolah" htmlFor="school">
                <Input id="school" name="school" defaultValue={student.school ?? ""} />
              </Field>
              <Field label="HP orang tua" htmlFor="parentPhone">
                <Input
                  id="parentPhone"
                  name="parentPhone"
                  defaultValue={student.parentPhone ?? ""}
                />
              </Field>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
              Password tidak ditampilkan di sini. Gunakan tombol “Reset” pada daftar
              siswa untuk membuat password sementara.
            </div>
            <div className="flex justify-end">
              <Button type="submit">Simpan perubahan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

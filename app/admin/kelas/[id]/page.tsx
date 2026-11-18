import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { updateClassAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getClassById, listTutors } from "@/lib/data/students";

export const metadata: Metadata = { title: "Ubah Kelas" };

export default async function AdminClassEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const [classroom, tutors] = await Promise.all([getClassById(id), listTutors()]);

  if (!classroom) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Data kelas"
        title={`Ubah ${classroom.name}`}
        description={`${classroom.studentCount} siswa · ${classroom.packageCount} paket`}
        backHref="/admin/kelas"
        backLabel="Kembali ke daftar kelas"
      />

      {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}

      <Card>
        <CardContent className="p-5">
          <form action={updateClassAction} className="space-y-4">
            <input type="hidden" name="classId" value={classroom.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nama kelas" htmlFor="name" required>
                <Input id="name" name="name" defaultValue={classroom.name} required />
              </Field>
              <Field label="Tahun ajaran" htmlFor="academicYear" required>
                <Input
                  id="academicYear"
                  name="academicYear"
                  defaultValue={classroom.academicYear}
                  required
                />
              </Field>
              <Field label="Tutor" htmlFor="tutorId">
                <Select id="tutorId" name="tutorId" defaultValue={classroom.tutorId ?? ""}>
                  <option value="">Belum ditentukan</option>
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </option>
                  ))}
                </Select>
              </Field>
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

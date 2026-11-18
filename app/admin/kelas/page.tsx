import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, School, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { createClassAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { listClasses, listTutors } from "@/lib/data/students";

export const metadata: Metadata = { title: "Kelola Kelas" };

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [classes, tutors] = await Promise.all([listClasses(), listTutors()]);

  return (
    <div>
      <PageHeader
        eyebrow="Data kelas"
        title="Kelola kelas"
        description="Atur kelas, tahun ajaran, dan tutor pendamping."
      />

      {params.ok ? <Alert variant="success" className="mb-4">{params.ok}</Alert> : null}
      {params.error ? <Alert variant="error" className="mb-4">{params.error}</Alert> : null}

      <details className="group mb-4 rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[13px] font-semibold text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Plus className="h-4 w-4" />
          </span>
          Tambah kelas
          <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-open:rotate-90" />
        </summary>
        <form action={createClassAction} className="border-t border-slate-100 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nama kelas" htmlFor="name" required>
              <Input id="name" name="name" placeholder="Contoh: Kelas 6C" required />
            </Field>
            <Field label="Tahun ajaran" htmlFor="academicYear" required>
              <Input
                id="academicYear"
                name="academicYear"
                defaultValue="2026/2027"
                required
              />
            </Field>
            <Field label="Tutor" htmlFor="tutorId">
              <Select id="tutorId" name="tutorId" defaultValue="">
                <option value="">Belum ditentukan</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Simpan kelas
            </Button>
          </div>
        </form>
      </details>

      <Card>
        <CardHeader title={`Daftar kelas (${classes.length})`} />
        {classes.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Kelas</Th>
                <Th>Tahun ajaran</Th>
                <Th>Tutor</Th>
                <Th className="text-center">Siswa</Th>
                <Th className="text-center">Paket</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {classes.map((classroom) => (
                <Tr key={classroom.id}>
                  <Td>
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <School className="h-4 w-4 text-slate-400" />
                      {classroom.name}
                    </span>
                  </Td>
                  <Td className="text-slate-600">{classroom.academicYear}</Td>
                  <Td>
                    {classroom.tutor ? (
                      <Badge tone="sky">{classroom.tutor.name}</Badge>
                    ) : (
                      <Badge tone="slate">Belum ada tutor</Badge>
                    )}
                  </Td>
                  <Td className="text-center">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {classroom.studentCount}
                    </span>
                  </Td>
                  <Td className="text-center tabular-nums">{classroom.packageCount}</Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/kelas/${classroom.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Ubah
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<School className="h-5 w-5" />}
              title="Belum ada kelas"
              description="Tambahkan kelas pertama melalui formulir di atas."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Filter,
  KeyRound,
  Plus,
  Power,
  RotateCcw,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import {
  createStudentAction,
  resetStudentPasswordAction,
  toggleStudentActiveAction,
} from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { listClasses, listStudents } from "@/lib/data/students";

export const metadata: Metadata = { title: "Kelola Siswa" };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    classId?: string;
    status?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [students, classes] = await Promise.all([
    listStudents({
      search: params.search,
      classId: params.classId,
      status:
        params.status === "active" || params.status === "inactive"
          ? params.status
          : "all",
    }),
    listClasses(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Data siswa"
        title="Kelola siswa"
        description="Buat akun siswa, atur kelas, dan reset password sementara."
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

      <Card className="mb-4">
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label htmlFor="search" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Cari nama atau NIS
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Contoh: Alya atau 6001"
                className="h-10 text-[13px]"
              />
            </div>
            <div className="min-w-[150px] flex-1">
              <label htmlFor="classId" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Kelas
              </label>
              <Select
                id="classId"
                name="classId"
                defaultValue={params.classId ?? ""}
                className="h-10 text-[13px]"
              >
                <option value="">Semua kelas</option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[130px] flex-1">
              <label htmlFor="status" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Status
              </label>
              <Select
                id="status"
                name="status"
                defaultValue={params.status ?? "all"}
                className="h-10 text-[13px]"
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </Select>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            <Link
              href="/admin/siswa"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Link>
          </form>
        </CardContent>
      </Card>

      <details className="group mb-4 rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[13px] font-semibold text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Plus className="h-4 w-4" />
          </span>
          Tambah siswa baru
          <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-open:rotate-90" />
        </summary>
        <form action={createStudentAction} className="border-t border-slate-100 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama lengkap" htmlFor="name" required>
              <Input id="name" name="name" placeholder="Nama siswa" required />
            </Field>
            <Field label="NIS" htmlFor="nis" required hint="Dipakai sebagai username login.">
              <Input id="nis" name="nis" placeholder="Contoh: 6009" required />
            </Field>
            <Field label="Kelas" htmlFor="classId">
              <Select id="classId" name="classId" defaultValue="">
                <option value="">Belum ditentukan</option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jenis kelamin" htmlFor="gender">
              <Select id="gender" name="gender" defaultValue="">
                <option value="">Tidak diisi</option>
                <option value="P">Perempuan</option>
                <option value="L">Laki-laki</option>
              </Select>
            </Field>
            <Field label="Asal sekolah" htmlFor="school">
              <Input id="school" name="school" placeholder="Contoh: SDN 01 Harapan" />
            </Field>
            <Field label="HP orang tua" htmlFor="parentPhone">
              <Input id="parentPhone" name="parentPhone" placeholder="08xx-xxxx-xxxx" />
            </Field>
            <Field
              label="Password awal"
              htmlFor="password"
              hint="Kosongkan untuk memakai siswa123. Siswa diminta mengganti password."
            >
              <Input id="password" name="password" type="text" placeholder="Minimal 8 karakter" />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Simpan siswa
            </Button>
          </div>
        </form>
      </details>

      <Card>
        <CardHeader
          title={`Daftar siswa (${students.length})`}
          description="Urut berdasarkan nama."
        />
        {students.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>NIS</Th>
                <Th>Kelas</Th>
                <Th>Sekolah</Th>
                <Th className="text-center">Attempt</Th>
                <Th className="text-center">Rata-rata</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <Tr key={student.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{student.user.name}</p>
                    <p className="text-[10px] text-slate-400">
                      @{student.user.username ?? "-"}
                    </p>
                  </Td>
                  <Td className="tabular-nums text-slate-500">{student.nis}</Td>
                  <Td className="text-slate-600">{student.classroom?.name ?? "—"}</Td>
                  <Td className="max-w-[160px] truncate text-slate-500">
                    {student.school ?? "—"}
                  </Td>
                  <Td className="text-center tabular-nums">{student.attemptCount}</Td>
                  <Td className="text-center tabular-nums font-semibold text-slate-700">
                    {student.averageScore ?? "—"}
                  </Td>
                  <Td>
                    <Badge tone={student.isActive ? "emerald" : "slate"}>
                      {student.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/siswa/${student.id}`}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Ubah
                      </Link>
                      <form action={resetStudentPasswordAction}>
                        <input type="hidden" name="studentId" value={student.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 px-2.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
                          title="Reset password sementara"
                        >
                          <KeyRound className="h-3 w-3" />
                          Reset
                        </button>
                      </form>
                      <form action={toggleStudentActiveAction}>
                        <input type="hidden" name="studentId" value={student.id} />
                        <input type="hidden" name="active" value={student.isActive ? "0" : "1"} />
                        <button
                          type="submit"
                          className={
                            student.isActive
                              ? "inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-2.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                              : "inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          }
                        >
                          <Power className="h-3 w-3" />
                          {student.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Tidak ada siswa"
              description="Ubah filter atau tambahkan siswa baru melalui formulir di atas."
            />
          </div>
        )}
      </Card>
    </div>
  );
}

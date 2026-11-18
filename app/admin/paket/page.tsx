import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  Package,
  Plus,
  Power,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { setPackageStatusAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import {
  listPackageViews,
  packageAvailability,
} from "@/lib/data/catalog";
import { listClasses } from "@/lib/data/students";
import { PACKAGE_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kelola Paket" };

const statusTone: Record<string, "emerald" | "amber" | "slate"> = {
  PUBLISHED: "emerald",
  DRAFT: "amber",
  ARCHIVED: "slate",
};

const statusLabels: Record<string, string> = {
  PUBLISHED: "Dipublikasikan",
  DRAFT: "Draft",
  ARCHIVED: "Diarsipkan",
};

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [packages, classes] = await Promise.all([
    listPackageViews({ includeDraft: true }),
    listClasses(),
  ]);

  const classNames = new Map(classes.map((item) => [item.id, item.name]));

  return (
    <div>
      <PageHeader
        eyebrow="Paket ujian"
        title="Kelola paket"
        description="Susun latihan dan tryout, atur jadwal, akses kelas, serta publikasi paket."
        actions={
          <ButtonLink href="/admin/paket/baru" size="sm">
            <Plus className="h-4 w-4" />
            Buat paket
          </ButtonLink>
        }
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

      <Card>
        <CardHeader
          title={`Daftar paket (${packages.length})`}
          description="Paket draft dan arsip tidak tampil di portal siswa."
        />
        {packages.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Paket</Th>
                <Th>Mapel</Th>
                <Th>Jenis</Th>
                <Th className="text-center">Soal</Th>
                <Th className="text-center">Durasi</Th>
                <Th>Akses kelas</Th>
                <Th>Jadwal</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const availability = packageAvailability(pkg);
                return (
                  <Tr key={pkg.id}>
                    <Td>
                      <p className="max-w-[240px] text-[12px] font-semibold text-slate-800">
                        {pkg.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Dibuat {formatDate(pkg.createdAt)}
                      </p>
                    </Td>
                    <Td className="text-[12px] text-slate-600">{pkg.subject.name}</Td>
                    <Td>
                      <Badge tone={pkg.type === "tryout" ? "amber" : "brand"}>
                        {pkg.type === "tryout" ? "Tryout" : "Latihan"}
                      </Badge>
                    </Td>
                    <Td className="text-center tabular-nums">{pkg.questionCount}</Td>
                    <Td className="text-center">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-slate-600">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        {pkg.durationMinutes} mnt
                      </span>
                    </Td>
                    <Td>
                      {pkg.classIds.length ? (
                        <div className="flex max-w-[180px] flex-wrap gap-1">
                          {pkg.classIds.map((classId) => (
                            <Badge key={classId} tone="slate">
                              {classNames.get(classId) ?? "Kelas dihapus"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge tone="sky">Semua siswa</Badge>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-[11px] text-slate-500">
                      {pkg.availableFrom || pkg.availableTo ? (
                        <>
                          {pkg.availableFrom ? formatDate(pkg.availableFrom) : "…"} –{" "}
                          {pkg.availableTo ? formatDate(pkg.availableTo) : "…"}
                        </>
                      ) : (
                        "Tanpa jadwal"
                      )}
                      {!availability.open && pkg.status === "PUBLISHED" ? (
                        <p className="text-[10px] text-amber-600">{availability.reason}</p>
                      ) : null}
                    </Td>
                    <Td>
                      <form action={setPackageStatusAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="packageId" value={pkg.id} />
                        <select
                          name="status"
                          defaultValue={pkg.status}
                          aria-label="Status paket"
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-brand-400"
                        >
                          {PACKAGE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status] ?? status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          title="Perbarui status"
                        >
                          Set
                        </button>
                      </form>
                      <div className="mt-1">
                        <Badge tone={statusTone[pkg.status] ?? "slate"}>
                          <Power className="h-3 w-3" />
                          {statusLabels[pkg.status] ?? pkg.status}
                        </Badge>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/paket/${pkg.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Ubah
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="Belum ada paket"
              description="Buat paket latihan atau tryout pertama untuk siswa."
              action={<ButtonLink href="/admin/paket/baru">Buat paket</ButtonLink>}
            />
          </div>
        )}
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
        <RotateCcw className="h-3.5 w-3.5" />
        Mengubah bank soal tidak mengubah paket yang sudah ada — periksa kembali daftar
        soal setelah mengedit soal.
      </p>
    </div>
  );
}

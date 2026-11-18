import type { Metadata } from "next";
import { ChevronRight, School, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTutor } from "@/lib/auth/guards";
import { getTutorClasses } from "@/lib/data/students";

export const metadata: Metadata = { title: "Kelas Saya" };

export default async function TutorClassesPage() {
  const user = await requireTutor();
  const classes = await getTutorClasses(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Kelas"
        title="Kelas yang saya ampu"
        description="Buka kelas untuk melihat daftar siswa, rekap nilai, dan topik yang perlu diperkuat."
      />

      {classes.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((classroom) => (
            <Card key={classroom.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <School className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-bold text-slate-900">
                      {classroom.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tahun ajaran {classroom.academicYear}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="slate">
                        <Users className="h-3 w-3" />
                        {classroom.studentCount} siswa
                      </Badge>
                      <Badge tone="brand">{classroom.packageCount} paket</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <ButtonLink href={`/tutor/kelas/${classroom.id}`} size="sm">
                  Buka kelas
                  <ChevronRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<School className="h-5 w-5" />}
          title="Belum ada kelas"
          description="Hubungi admin bimbel untuk menugaskan kelas ke akun tutor ini."
        />
      )}
    </div>
  );
}

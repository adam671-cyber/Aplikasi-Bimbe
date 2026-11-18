import { AppShell } from "@/components/layout/app-shell";
import { requireTutor } from "@/lib/auth/guards";
import { tutorNav } from "@/lib/navigation";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireTutor();

  return (
    <AppShell
      user={{ name: user.name, role: user.role, className: user.className }}
      items={tutorNav}
      areaLabel="Ruang tutor"
    >
      {children}
    </AppShell>
  );
}

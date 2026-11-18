import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/auth/guards";
import { studentNav } from "@/lib/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudent();

  return (
    <AppShell
      user={{ name: user.name, role: user.role, className: user.className }}
      items={studentNav}
      areaLabel="Ruang siswa"
    >
      {children}
    </AppShell>
  );
}

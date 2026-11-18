import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/guards";
import { adminNav } from "@/lib/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <AppShell
      user={{ name: user.name, role: user.role, className: user.className }}
      items={adminNav}
      areaLabel="Ruang admin"
    >
      {children}
    </AppShell>
  );
}

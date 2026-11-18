"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  History,
  LayoutDashboard,
  Layers,
  Library,
  LogOut,
  MoreHorizontal,
  Package,
  School,
  Settings,
  Timer,
  User,
  Users,
  X,
} from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/auth/actions";

const iconMap: Record<NavItem["icon"], React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  book: BookOpen,
  materials: Library,
  timer: Timer,
  history: History,
  user: User,
  users: Users,
  school: School,
  layers: Layers,
  question: FileQuestion,
  package: Package,
  report: BarChart3,
  settings: Settings,
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/tutor" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  items,
  areaLabel,
  children,
}: {
  user: { name: string; role: string; className?: string | null };
  items: NavItem[];
  areaLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const maxDirect = items.length > 5 ? 4 : items.length;
  const primary = items.slice(0, maxDirect);
  const overflow = items.slice(maxDirect);
  const roleLabel =
    user.role === "ADMIN" ? "Admin" : user.role === "TUTOR" ? "Tutor" : "Siswa";

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo href={user.role === "ADMIN" ? "/admin" : user.role === "TUTOR" ? "/tutor" : "/dashboard"} />
        </div>
        <div className="px-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Ruang kerja
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              {areaLabel}
              <Badge tone={user.role === "ADMIN" ? "rose" : user.role === "TUTOR" ? "sky" : "brand"}>
                {roleLabel}
              </Badge>
            </p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span>{item.label}</span>
                {active ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {user.className ?? roleLabel}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo href={user.role === "ADMIN" ? "/admin" : user.role === "TUTOR" ? "/tutor" : "/dashboard"} compact />
          <div className="flex items-center gap-2">
            <Badge tone={user.role === "ADMIN" ? "rose" : user.role === "TUTOR" ? "sky" : "brand"}>
              {roleLabel}
            </Badge>
            <Avatar name={user.name} size="sm" />
          </div>
        </div>
      </header>

      <div className="lg:pl-[248px]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${primary.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}>
          {primary.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active ? "text-brand-600" : "text-slate-400"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {overflow.length ? (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-400"
              aria-haspopup="dialog"
            >
              <MoreHorizontal className="h-5 w-5" />
              Lainnya
            </button>
          ) : null}
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="Tutup menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] slide-up">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-slate-900">Menu lainnya</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {overflow.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="h-5 w-5 text-slate-400" />
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </Link>
                );
              })}
              <form action={logoutAction} className="pt-1">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-5 w-5" />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

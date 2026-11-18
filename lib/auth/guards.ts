import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { getCurrentUser, roleHome } from "./session";
import type { SessionUser } from "@/lib/data/types";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/403");
  return user;
}

export async function requireStudent(): Promise<SessionUser> {
  const user = await requireRole(["STUDENT"]);
  if (!user.studentId) redirect("/403");
  return user;
}

export async function requireTutor(): Promise<SessionUser> {
  return requireRole(["TUTOR"]);
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN"]);
}

/** Untuk route handler API: tidak melakukan redirect. */
export async function getApiUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}

export { roleHome };

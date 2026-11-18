import type { SessionUser, UserRecord } from "./types";
import { getStore } from "./store";
import { ensureStore, saveProfile } from "@/lib/supabase/store-sync";

export async function findUserByLogin(
  identifier: string
): Promise<UserRecord | undefined> {
  await ensureStore();
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return undefined;
  return getStore().users.find(
    (user) =>
      user.username?.toLowerCase() === normalized ||
      user.email?.toLowerCase() === normalized
  );
}

export async function getUserById(id: string) {
  await ensureStore();
  return getStore().users.find((user) => user.id === id);
}

export async function getSessionUser(id: string): Promise<SessionUser | null> {
  await ensureStore();
  const store = getStore();
  const user = store.users.find((item) => item.id === id);
  if (!user || !user.isActive) return null;

  const student = store.students.find((item) => item.userId === user.id);
  const classroom = student?.classId
    ? store.classes.find((item) => item.id === student.classId)
    : null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    studentId: student?.id ?? null,
    classId: classroom?.id ?? null,
    className: classroom?.name ?? null,
  };
}

export async function touchLogin(id: string) {
  await ensureStore();
  const user = getStore().users.find((item) => item.id === id);
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  await saveProfile(user);
}

export async function setPasswordHash(id: string, passwordHash: string) {
  await ensureStore();
  const user = getStore().users.find((item) => item.id === id);
  if (!user) return false;
  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  await saveProfile(user);
  return true;
}

export async function setMustChangePassword(id: string, value: boolean) {
  await ensureStore();
  const user = getStore().users.find((item) => item.id === id);
  if (!user) return false;
  user.mustChangePassword = value;
  await saveProfile(user);
  return true;
}

export async function listUsers(role?: UserRecord["role"]) {
  await ensureStore();
  return getStore().users.filter((user) => !role || user.role === role);
}

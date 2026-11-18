"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  findUserByLogin,
  getUserById,
  setMustChangePassword,
  setPasswordHash,
  touchLogin,
} from "@/lib/data/users";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSession, destroySession, getCurrentUser, roleHome } from "./session";
import {
  checkLoginLimit,
  clearLoginLimit,
  recordLoginFailure,
} from "./rate-limit";

export interface LoginState {
  error?: string;
}

const DUMMY_HASH =
  "$2b$10$buaZwEOVmgxTyOTGozCyyeYP/iPlck/Xpy.Oo2455j/0qfe0Wk/Aq";

async function requestIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "local"
  );
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Isi username/NIS dan password terlebih dahulu." };
  }

  const ip = await requestIp();
  const limitKey = `${identifier.toLowerCase()}|${ip}`;
  const limit = checkLoginLimit(limitKey);
  if (!limit.allowed) {
    return {
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(
        limit.retryAfterSeconds / 60
      )} menit.`,
    };
  }

  const user = await findUserByLogin(identifier);

  if (isSupabaseConfigured()) {
    if (!user || !user.email) {
      recordLoginFailure(limitKey);
      return { error: "Username/NIS atau password salah. Silakan coba lagi." };
    }
    if (!user.isActive) {
      recordLoginFailure(limitKey);
      return { error: "Akun ini sedang dinonaktifkan. Hubungi tutor atau admin." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) {
      recordLoginFailure(limitKey);
      return { error: "Username/NIS atau password salah. Silakan coba lagi." };
    }

    clearLoginLimit(limitKey);
    await touchLogin(user.id);
    redirect(roleHome(user.role));
  }

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    recordLoginFailure(limitKey);
    return { error: "Username/NIS atau password salah. Silakan coba lagi." };
  }

  if (!user.isActive) {
    recordLoginFailure(limitKey);
    return { error: "Akun ini sedang dinonaktifkan. Hubungi tutor atau admin." };
  }

  clearLoginLimit(limitKey);
  await createSession({ userId: user.id, role: user.role, name: user.name });
  await touchLogin(user.id);
  redirect(roleHome(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export interface PasswordState {
  error?: string;
  success?: string;
}

export async function changePasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Sesi berakhir. Silakan login ulang." };

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!oldPassword || !newPassword || !confirmPassword) {
    return { error: "Semua kolom password wajib diisi." };
  }
  if (newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const user = await getUserById(current.id);
  if (!user) return { error: "Akun tidak ditemukan." };

  if (isSupabaseConfigured()) {
    if (!user.email) {
      return { error: "Akun belum memiliki email login. Hubungi admin." };
    }
    const supabase = await createSupabaseServerClient();
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (verifyError) return { error: "Password lama tidak sesuai." };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        error:
          error.message.toLowerCase().includes("different")
            ? "Password baru harus berbeda dari password lama."
            : "Password gagal diperbarui. Silakan coba lagi.",
      };
    }
    await setMustChangePassword(user.id, false);
    return { success: "Password berhasil diperbarui." };
  }

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) return { error: "Password lama tidak sesuai." };

  await setPasswordHash(user.id, await bcrypt.hash(newPassword, 10));
  return { success: "Password berhasil diperbarui." };
}

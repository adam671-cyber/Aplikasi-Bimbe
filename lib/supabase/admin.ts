import type { Role } from "@/lib/types";
import { getServiceClient } from "./server";

export interface ProvisionUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
}

/**
 * Membuat user Supabase Auth. Trigger `handle_new_user` otomatis membuat
 * baris `profiles`; pemanggil kemudian meng-upsert profil lengkap (username,
 * must_change_password, dsb).
 */
export async function provisionAuthUser(input: ProvisionUserInput) {
  const client = getServiceClient();
  const { data, error } = await client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
    app_metadata: { role: input.role },
  });

  if (error || !data.user) {
    throw new Error(
      error?.message
        ? `Gagal membuat akun login: ${error.message}`
        : "Gagal membuat akun login."
    );
  }
  return data.user;
}

export async function updateAuthUser(
  userId: string,
  input: {
    email?: string;
    password?: string;
    name?: string;
    role?: Role;
    disabled?: boolean;
  }
) {
  const client = getServiceClient();
  const attributes: {
    email?: string;
    email_confirm?: boolean;
    password?: string;
    user_metadata?: { name: string };
    app_metadata?: { role: Role };
    ban_duration?: string;
  } = {};
  if (input.email) {
    attributes.email = input.email;
    // NIS berubah → email Auth baru langsung dikonfirmasi agar siswa bisa login.
    attributes.email_confirm = true;
  }
  if (input.password) attributes.password = input.password;
  if (input.name) attributes.user_metadata = { name: input.name };
  if (input.role) attributes.app_metadata = { role: input.role };
  // Supabase: "none" mencabut blokir, durasi panjang = nonaktif.
  if (input.disabled !== undefined) {
    attributes.ban_duration = input.disabled ? "876000h" : "none";
  }

  const { error } = await client.auth.admin.updateUserById(userId, attributes);

  if (error) {
    throw new Error(`Gagal memperbarui akun login: ${error.message}`);
  }
}

export async function deleteAuthUser(userId: string) {
  const client = getServiceClient();
  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Gagal menghapus akun login: ${error.message}`);
}

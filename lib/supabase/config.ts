/**
 * Deteksi konfigurasi Supabase.
 *
 * Bila ketiga variabel tersedia, aplikasi memakai Supabase Auth + database.
 * Bila tidak, aplikasi jatuh ke mode demo in-memory (lib/data/store.ts) agar
 * pengembangan lokal dan test tetap berjalan tanpa project Supabase.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

let warnedPartialConfig = false;

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url && !anonKey && !serviceRoleKey) return null;

  if (!url || !anonKey || !serviceRoleKey) {
    if (!warnedPartialConfig) {
      warnedPartialConfig = true;
      const missing = [
        !url && "NEXT_PUBLIC_SUPABASE_URL",
        !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
      ]
        .filter(Boolean)
        .join(", ");
      console.warn(
        `[TKA Cerdas] Konfigurasi Supabase belum lengkap (kurang: ${missing}). ` +
          "Aplikasi memakai data demo in-memory; isi ketiga variabel untuk mengaktifkan Supabase."
      );
    }
    return null;
  }

  return { url, anonKey, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

/**
 * Domain email internal untuk akun siswa. Siswa tetap login memakai NIS;
 * Supabase Auth membutuhkan email, sehingga NIS dipetakan ke email internal.
 * Domain ini tidak perlu menerima email sungguhan.
 */
export function authEmailDomain() {
  return process.env.SUPABASE_AUTH_EMAIL_DOMAIN?.trim() || "siswa.tkaceras.id";
}

export function studentAuthEmail(nis: string) {
  return `${nis.trim().toLowerCase()}@${authEmailDomain()}`;
}

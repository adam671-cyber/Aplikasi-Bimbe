import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

let serviceClient: SupabaseClient | null = null;

/**
 * Klien service-role. Hanya untuk kode server (Server Component, Server
 * Action, Route Handler, seed). Jangan pernah diimpor dari komponen client.
 */
export function getServiceClient(): SupabaseClient {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!serviceClient) {
    serviceClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return serviceClient;
}

/**
 * Klien Supabase yang membaca/menulis cookie sesi pada request saat ini.
 * Dipakai untuk login, logout, cek sesi, dan ganti password.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Refresh sesi tetap
          // ditangani middleware, jadi kegagalan di sini aman diabaikan.
        }
      },
    },
  });
}

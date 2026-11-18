import { getStore } from "./store";
import { ensureStore, saveSettings } from "@/lib/supabase/store-sync";

export interface AppSettings {
  appName: string;
  bimbelName: string;
  academicYear: string;
  contactWhatsapp: string;
  heroTitle: string;
  heroSubtitle: string;
  defaultInstructions: string;
}

const DEFAULTS: AppSettings = {
  appName: "BIMBEL STAR KIDS",
  bimbelName: "BIMBEL STAR KIDS",
  academicYear: "2026/2027",
  contactWhatsapp: "0812-3456-7890",
  heroTitle: "Simulasi TKA Kelas 6 SD/MI",
  heroSubtitle:
    "Latihan, tryout, dan pantau hasilmu dalam satu aplikasi yang nyaman digunakan di HP.",
  defaultInstructions:
    "Kerjakan setiap soal dengan teliti. Waktu berjalan setelah kamu menekan tombol Mulai. Jawaban tersimpan otomatis.",
};

export async function getSettings(): Promise<AppSettings> {
  await ensureStore();
  return { ...DEFAULTS, ...getStore().settings };
}

export async function updateSettings(input: Partial<AppSettings>) {
  await ensureStore();
  const store = getStore();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") store.settings[key] = value;
  }
  await saveSettings(store.settings);
  return { ...DEFAULTS, ...store.settings };
}

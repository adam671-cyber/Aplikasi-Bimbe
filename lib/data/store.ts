import { createSeedData } from "./seed";
import type { StoreData } from "./types";

const globalForStore = globalThis as unknown as {
  __tkaStore?: StoreData;
};

/**
 * Penyimpanan demo in-memory.
 *
 * Ini adalah satu-satunya tempat state demo disimpan. Saat Supabase
 * diintegrasikan, ganti isi modul repository agar membaca/menulis ke Supabase,
 * tanpa mengubah halaman maupun komponen.
 */
export function getStore(): StoreData {
  if (!globalForStore.__tkaStore) {
    globalForStore.__tkaStore = createSeedData();
  }
  return globalForStore.__tkaStore;
}

export function resetStore() {
  globalForStore.__tkaStore = createSeedData();
}

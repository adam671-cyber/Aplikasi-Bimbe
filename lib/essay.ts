/**
 * Aturan jawaban isian singkat / esai pendek.
 *
 * - Maksimal 15 kata.
 * - Hanya huruf, angka, spasi, titik, koma, apostrof, dan tanda hubung.
 * - Simbol seperti ! @ # $ % ^ & * ( ) tidak diperbolehkan.
 */

export const ESSAY_MAX_WORDS = 15;

/** Karakter yang boleh diketik pada jawaban esai. */
const ALLOWED_CHARS = /[^\p{L}\p{N}\s.,'’\-]/gu;

/** Simbol yang secara eksplisit dilarang (dipakai untuk pesan validasi). */
const FORBIDDEN_SYMBOLS = /[!@#$%^&*()]/;

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * True jika teks memuat karakter di luar huruf, angka, spasi, titik, koma,
 * apostrof, dan tanda hubung (termasuk simbol seperti ! @ # $ % ^ & * ( )).
 */
export function hasForbiddenEssaySymbols(text: string) {
  return FORBIDDEN_SYMBOLS.test(text) || stripEssaySymbols(text) !== text;
}

/** Membuang karakter yang tidak diizinkan tanpa mengubah huruf/angka. */
export function stripEssaySymbols(text: string) {
  return text.replace(ALLOWED_CHARS, "");
}

/** Merapikan spasi berlebih dan membatasi jumlah kata. */
export function normalizeEssaySpacing(
  text: string,
  maxWords = ESSAY_MAX_WORDS
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

/** Membersihkan input siswa sebelum disimpan atau dikirim ke server. */
export function sanitizeEssayText(text: string, maxWords = ESSAY_MAX_WORDS) {
  return normalizeEssaySpacing(stripEssaySymbols(text), maxWords);
}

export function validateEssayText(text: string) {
  if (!text.trim()) return "Jawaban wajib diisi.";
  if (hasForbiddenEssaySymbols(text))
    return "Simbol tidak diperbolehkan. Gunakan huruf, angka, spasi, titik, koma, apostrof, dan tanda hubung.";
  if (countWords(text) > ESSAY_MAX_WORDS)
    return `Jawaban maksimal ${ESSAY_MAX_WORDS} kata.`;
  return null;
}

/** Bentuk pembanding saat menilai jawaban esai. */
export function normalizeEssayForComparison(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.,'’\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function essayMatches(text: string, accepted: string[]) {
  const value = normalizeEssayForComparison(text);
  if (!value) return false;
  return accepted.some(
    (candidate) => normalizeEssayForComparison(candidate) === value
  );
}

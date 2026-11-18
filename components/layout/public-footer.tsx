import Link from "next/link";
import { Logo } from "@/components/logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-[13px] leading-6 text-slate-500">
            Simulasi TKA kelas 6 SD/MI untuk bimbel. Latihan terarah, tryout
            realistis, dan hasil yang mudah dipahami.
          </p>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
            Belajar
          </p>
          <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
            <li>
              <Link href="/mapel/matematika" className="hover:text-brand-600">
                Matematika
              </Link>
            </li>
            <li>
              <Link href="/mapel/bahasa-indonesia" className="hover:text-brand-600">
                Bahasa Indonesia
              </Link>
            </li>
            <li>
              <Link href="/mapel/ipas" className="hover:text-brand-600">
                IPAS
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
            Bantuan
          </p>
          <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
            <li>
              <Link href="/panduan" className="hover:text-brand-600">
                Panduan siswa
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-600">
                Masuk akun
              </Link>
            </li>
            <li>
              <Link href="/privasi" className="hover:text-brand-600">
                Kebijakan privasi
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
            Kontak
          </p>
          <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
            <li>Bimbel Cerdas Nusantara</li>
            <li>WhatsApp 0812-3456-7890</li>
            <li>halo@tkaceras.id</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Bimbel Cerdas Nusantara. Hak cipta dilindungi.</p>
          <p>Tidak ada iklan. Fokus belajar, tanpa gangguan.</p>
        </div>
      </div>
    </footer>
  );
}

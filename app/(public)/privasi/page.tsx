import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge tone="emerald">
        <ShieldCheck className="h-3.5 w-3.5" />
        Perlindungan data anak
      </Badge>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">
        Kebijakan Privasi
      </h1>
      <p className="mt-2 text-[13px] leading-6 text-slate-500">
        Terakhir diperbarui: 16 November 2026. Kebijakan ini menjelaskan data apa
        yang kami simpan, mengapa, dan siapa yang dapat mengaksesnya.
      </p>

      <div className="mt-8 space-y-7 text-[13px] leading-7 text-slate-600">
        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            1. Data yang kami kumpulkan
          </h2>
          <p className="mt-1.5">
            Kami hanya menyimpan data yang diperlukan untuk proses belajar:
            nama siswa, NIS, kelas, asal sekolah, jenis kelamin, dan nomor HP
            orang tua (opsional). Kami tidak meminta alamat rumah, foto, atau
            data pembayaran.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            2. Data pengerjaan ujian
          </h2>
          <p className="mt-1.5">
            Jawaban, waktu mulai, waktu selesai, skor, dan aktivitas ujian
            (misalnya berpindah tab) dicatat untuk menjaga keadilan penilaian
            dan membantu tutor memberikan pendampingan. Kunci jawaban tidak
            pernah dikirim ke perangkat siswa sebelum ujian dikumpulkan.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            3. Siapa yang dapat melihat hasil
          </h2>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Siswa hanya dapat melihat hasil miliknya sendiri.</li>
            <li>Tutor hanya dapat melihat hasil siswa di kelas yang diampu.</li>
            <li>Admin bimbel dapat melihat seluruh data untuk keperluan operasional.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            4. Penyimpanan dan retensi
          </h2>
          <p className="mt-1.5">
            Data attempt disimpan selama siswa masih aktif dan satu tahun ajaran
            setelahnya. Data dapat dihapus atas permintaan orang tua/wali melalui
            admin bimbel, dengan tetap memperhatikan kewajiban administratif
            bimbel.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            5. Keamanan
          </h2>
          <p className="mt-1.5">
            Akses dibatasi berdasarkan peran, password disimpan dalam bentuk hash,
            dan komunikasi data menggunakan HTTPS. Aktivitas perubahan data
            penting dicatat untuk audit.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            6. Tidak ada iklan
          </h2>
          <p className="mt-1.5">
            Aplikasi ini tidak menampilkan iklan dan tidak menjual data pengguna
            kepada pihak ketiga.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-slate-900">
            7. Hubungi kami
          </h2>
          <p className="mt-1.5">
            Pertanyaan tentang privasi dapat disampaikan ke admin bimbel melalui
            WhatsApp <span className="font-semibold">0812-3456-7890</span> atau
            email <span className="font-semibold">halo@tkaceras.id</span>.
          </p>
        </section>
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <p className="text-[12px] leading-6 text-slate-500">
          Persetujuan orang tua/wali dilakukan saat pendaftaran siswa di bimbel,
          di luar aplikasi. Baca juga{" "}
          <Link href="/panduan" className="font-semibold text-brand-600 hover:text-brand-700">
            panduan penggunaan
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

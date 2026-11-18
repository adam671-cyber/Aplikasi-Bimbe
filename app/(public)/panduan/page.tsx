import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MousePointerClick,
  Timer,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Panduan Penggunaan",
};

const studentSteps = [
  {
    title: "Masuk dengan akun bimbel",
    description:
      "Gunakan NIS atau username yang diberikan tutor. Password awal wajib diganti jika diminta.",
  },
  {
    title: "Pilih mapel dan paket",
    description:
      "Latihan cocok untuk topik tertentu. Tryout memiliki durasi dan aturan seperti ujian.",
  },
  {
    title: "Baca instruksi dengan teliti",
    description:
      "Perhatikan jumlah soal, durasi, dan batas percobaan sebelum menekan tombol mulai.",
  },
  {
    title: "Kerjakan soal satu per satu",
    description:
      "Gunakan navigasi soal dan tombol tandai ragu. Jawaban tersimpan otomatis.",
  },
  {
    title: "Kumpulkan dan lihat hasil",
    description:
      "Setelah submit, skor, jawaban benar, kunci, dan pembahasan langsung tersedia.",
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge tone="brand">
        <BookOpen className="h-3.5 w-3.5" />
        Panduan singkat
      </Badge>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">
        Panduan penggunaan TKA Cerdas
      </h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">
        Panduan ini dibuat singkat agar siswa, tutor, dan admin bisa langsung
        mulai tanpa pelatihan panjang.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <GraduationCap className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Untuk siswa</h2>
              <p className="text-[11px] text-slate-400">Lima langkah, siap mengerjakan.</p>
            </div>
          </div>
          <ol className="mt-4 space-y-3">
            {studentSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{step.title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <ButtonLink href="/login" className="mt-5">
            Masuk sekarang
          </ButtonLink>
        </section>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-800">
              <Users className="h-4 w-4 text-sky-600" />
              <h3 className="text-[13px] font-bold">Untuk tutor</h3>
            </div>
            <ul className="mt-2 space-y-2 text-[12px] leading-5 text-slate-500">
              <li>• Lihat rekap kelas dan nilai rata-rata.</li>
              <li>• Buka detail attempt siswa dan pembahasannya.</li>
              <li>• Buat soal sendiri dan ekspor laporan CSV.</li>
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-800">
              <MousePointerClick className="h-4 w-4 text-rose-600" />
              <h3 className="text-[13px] font-bold">Untuk admin</h3>
            </div>
            <ul className="mt-2 space-y-2 text-[12px] leading-5 text-slate-500">
              <li>• Kelola siswa, kelas, mapel, dan topik.</li>
              <li>• Susun bank soal lalu publikasikan paket.</li>
              <li>• Pantau hasil dan atur branding bimbel.</li>
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 text-amber-900">
              <Timer className="h-4 w-4" />
              <h3 className="text-[13px] font-bold">Saat ujian berlangsung</h3>
            </div>
            <ul className="mt-2 space-y-2 text-[12px] leading-5 text-amber-800">
              <li>• Jangan menutup tab; waktu tetap berjalan.</li>
              <li>• Jika tertutup, buka dashboard → Lanjutkan ujian.</li>
              <li>• Jawaban yang sudah tersimpan tetap aman.</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Pertanyaan yang sering muncul
        </h2>
        <div className="mt-3 space-y-2">
          {[
            {
              question: "Apakah jawaban saya hilang jika internet putus?",
              answer:
                "Tidak. Jawaban disimpan di perangkat dan dikirim ulang otomatis saat koneksi kembali. Indikator di bagian atas menunjukkan status penyimpanan.",
            },
            {
              question: "Bisakah saya mengulang tryout?",
              answer:
                "Tergantung pengaturan paket. Batas percobaan ditampilkan di halaman detail paket. Hubungi tutor jika membutuhkan tambahan percobaan.",
            },
            {
              question: "Mengapa saya tidak bisa melihat kunci jawaban?",
              answer:
                "Kunci jawaban hanya dikirim setelah ujian dikumpulkan, agar hasil tetap valid. Setelah submit, buka menu Review Jawaban.",
            },
            {
              question: "Bagaimana jika saya lupa password?",
              answer:
                "Minta tutor atau admin bimbel untuk mereset password. Kamu akan menerima password sementara dan diminta menggantinya.",
            },
          ].map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-slate-800">
                {item.question}
                <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-300 group-open:text-emerald-500" />
              </summary>
              <p className="mt-2 text-[12px] leading-6 text-slate-500">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <p className="text-[12px] leading-6 text-slate-500">
          Butuh bantuan lain? Hubungi admin bimbel via WhatsApp{" "}
          <span className="font-semibold">0812-3456-7890</span> pada jam kerja.
          Baca juga{" "}
          <Link href="/privasi" className="font-semibold text-brand-600 hover:text-brand-700">
            kebijakan privasi
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

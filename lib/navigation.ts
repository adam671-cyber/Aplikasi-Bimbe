export interface NavItem {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "book"
    | "materials"
    | "timer"
    | "history"
    | "user"
    | "users"
    | "school"
    | "layers"
    | "question"
    | "package"
    | "report"
    | "settings";
}

export const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: "dashboard" },
  { href: "/latihan", label: "Latihan", icon: "book" },
  { href: "/materi", label: "Materi", icon: "materials" },
  { href: "/tryout", label: "Tryout", icon: "timer" },
  { href: "/riwayat", label: "Riwayat", icon: "history" },
  { href: "/profil", label: "Profil", icon: "user" },
];

export const tutorNav: NavItem[] = [
  { href: "/tutor", label: "Beranda", icon: "dashboard" },
  { href: "/tutor/kelas", label: "Kelas", icon: "school" },
  { href: "/tutor/soal", label: "Bank Soal", icon: "question" },
  { href: "/tutor/laporan", label: "Laporan", icon: "report" },
  { href: "/tutor/profil", label: "Profil", icon: "user" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Beranda", icon: "dashboard" },
  { href: "/admin/siswa", label: "Siswa", icon: "users" },
  { href: "/admin/kelas", label: "Kelas", icon: "school" },
  { href: "/admin/soal", label: "Soal", icon: "question" },
  { href: "/admin/paket", label: "Paket", icon: "package" },
  { href: "/admin/hasil", label: "Laporan", icon: "report" },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: "settings" },
];

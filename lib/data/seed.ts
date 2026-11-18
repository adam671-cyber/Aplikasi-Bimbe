import type { AnswerPayload } from "@/lib/types";
import { gradeAttempt } from "@/lib/scoring";
import { studentAuthEmail } from "@/lib/supabase/config";
import { createSnapshot } from "./snapshots";
import type {
  AttemptRecord,
  MaterialRecord,
  PackageRecord,
  QuestionRecord,
  StoreData,
  TopicRecord,
} from "./types";

const HASH = {
  admin: "$2b$10$9qpfjZKHbGos09yf8JFpmuCe/KkrVh4xX7ZUGn6gAIx46F7ejfBvW", // admin123
  tutor: "$2b$10$UYA/Lslszm6cIspgNyPVeemmxfcpn4kN4lkYRNCg3zvxwuQMm2cfa", // tutor123
  student: "$2b$10$buaZwEOVmgxTyOTGozCyyeYP/iPlck/Xpy.Oo2455j/0qfe0Wk/Aq", // siswa123
};

const now = Date.now();
const iso = (value: number) => new Date(value).toISOString();
const hoursAgo = (hours: number) => iso(now - hours * 3600_000);
const daysAgo = (days: number) => iso(now - days * 86_400_000);
const daysFromNow = (days: number) => iso(now + days * 86_400_000);

type QuestionInput = {
  id: string;
  subjectId: string;
  topicId: string | null;
  type: QuestionRecord["type"];
  level: QuestionRecord["level"];
  stimulus?: string;
  question: string;
  indicator?: string;
  explanation: string;
  status?: QuestionRecord["status"];
  createdById?: string | null;
  options?: [content: string, correct: boolean][];
  statements?: [content: string, correct: boolean][];
};

function question(input: QuestionInput): QuestionRecord {
  return {
    id: input.id,
    subjectId: input.subjectId,
    topicId: input.topicId,
    type: input.type,
    level: input.level,
    stimulus: input.stimulus ?? null,
    question: input.question,
    indicator: input.indicator ?? null,
    explanation: input.explanation,
    imageUrl: null,
    status: input.status ?? "ACTIVE",
    createdById: input.createdById ?? "u-admin",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
    options: (input.options ?? []).map(([content, isCorrect], index) => ({
      id: `${input.id}-${String.fromCharCode(97 + index)}`,
      optionKey: String.fromCharCode(65 + index),
      content,
      isCorrect,
      sortOrder: index,
    })),
    statements: (input.statements ?? []).map(([content, correctAnswer], index) => ({
      id: `${input.id}-s${index + 1}`,
      content,
      correctAnswer,
      sortOrder: index,
    })),
  };
}

function buildSeedAttempts(
  questions: QuestionRecord[],
  topics: TopicRecord[],
  data: Pick<StoreData, "packages">
): AttemptRecord[] {
  const attempts: AttemptRecord[] = [];

  const build = (options: {
    id: string;
    studentId: string;
    packageId: string;
    correct: number;
    unanswered?: number;
    startedHoursAgo: number;
    submittedHoursAgo: number;
  }) => {
    const examPackage = data.packages.find((p) => p.id === options.packageId)!;
    const ordered = examPackage.questions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const record = questions.find((q) => q.id === item.questionId)!;
        const topic = topics.find((t) => t.id === record.topicId);
        return {
          record,
          points: item.points,
          snapshot: createSnapshot(record, topic?.name ?? null),
        };
      });

    const answers: AttemptRecord["answers"] = {};
    const answerMap: Record<string, AnswerPayload | null> = {};

    ordered.forEach((item, index) => {
      const unansweredFrom = ordered.length - (options.unanswered ?? 0);
      let kind: "correct" | "wrong" | "empty" = "wrong";
      if (index < options.correct) kind = "correct";
      else if (index >= unansweredFrom) kind = "empty";

      const answer = makeAnswer(item.record, kind);
      answerMap[item.record.id] = answer;
      answers[item.record.id] = {
        questionId: item.record.id,
        answer,
        isCorrect: null,
        pointsAwarded: null,
        snapshot: item.snapshot,
        isFlagged: index === 3 && kind === "wrong",
        answeredAt: answer ? hoursAgo(options.startedHoursAgo) : null,
        updatedAt: hoursAgo(options.submittedHoursAgo),
      };
    });

    const ledger = gradeAttempt(
      ordered.map((item) => ({ question: item.snapshot, points: item.points })),
      answerMap,
      examPackage.scoringMode
    );

    const startedAt = hoursAgo(options.startedHoursAgo);
    const submittedAt = hoursAgo(options.submittedHoursAgo);
    const expiresAt = iso(
      new Date(startedAt).getTime() + examPackage.durationMinutes * 60_000
    );

    attempts.push({
      id: options.id,
      studentId: options.studentId,
      packageId: options.packageId,
      status: "submitted",
      scoringMode: examPackage.scoringMode,
      startedAt,
      expiresAt,
      submittedAt,
      score: ledger.score,
      correctCount: ledger.correctCount,
      incorrectCount: ledger.incorrectCount,
      unansweredCount: ledger.unansweredCount,
      questionOrder: ordered.map((item) => item.record.id),
      optionOrder: Object.fromEntries(
        ordered.map((item) => [
          item.record.id,
          item.record.options.map((option) => option.id),
        ])
      ),
      lastQuestionIndex: 0,
      answers,
      events: [],
    });
  };

  build({
    id: "at-1",
    studentId: "st-1",
    packageId: "pkg-mat-tryout-1",
    correct: 11,
    startedHoursAgo: 52,
    submittedHoursAgo: 51,
  });
  build({
    id: "at-2",
    studentId: "st-2",
    packageId: "pkg-mat-tryout-1",
    correct: 8,
    unanswered: 1,
    startedHoursAgo: 50,
    submittedHoursAgo: 49,
  });
  build({
    id: "at-3",
    studentId: "st-3",
    packageId: "pkg-indo-tryout-1",
    correct: 5,
    startedHoursAgo: 26,
    submittedHoursAgo: 25,
  });
  build({
    id: "at-4",
    studentId: "st-4",
    packageId: "pkg-ipas-tryout-1",
    correct: 5,
    startedHoursAgo: 22,
    submittedHoursAgo: 21,
  });
  build({
    id: "at-5",
    studentId: "st-5",
    packageId: "pkg-mat-tryout-1",
    correct: 7,
    unanswered: 2,
    startedHoursAgo: 30,
    submittedHoursAgo: 29,
  });
  build({
    id: "at-6",
    studentId: "st-6",
    packageId: "pkg-mat-tryout-1",
    correct: 9,
    startedHoursAgo: 8,
    submittedHoursAgo: 7,
  });
  build({
    id: "at-7",
    studentId: "st-1",
    packageId: "pkg-mat-latihan-1",
    correct: 4,
    startedHoursAgo: 4,
    submittedHoursAgo: 4,
  });
  build({
    id: "at-8",
    studentId: "st-7",
    packageId: "pkg-indo-latihan-1",
    correct: 4,
    startedHoursAgo: 3,
    submittedHoursAgo: 3,
  });

  return attempts;
}

function makeAnswer(
  record: QuestionRecord,
  kind: "correct" | "wrong" | "empty"
): AnswerPayload | null {
  if (kind === "empty") return null;

  if (record.type === "single_choice") {
    const correct = record.options.find((option) => option.isCorrect)!;
    const wrong = record.options.find((option) => !option.isCorrect);
    return {
      selected: kind === "correct" ? correct.id : (wrong ?? correct).id,
    };
  }

  if (record.type === "multiple_choice") {
    const correctIds = record.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    if (kind === "correct") return { selected: correctIds };
    return { selected: correctIds.slice(0, Math.max(1, correctIds.length - 1)) };
  }

  if (record.type === "short_answer") {
    const accepted = record.options.find((option) => option.isCorrect);
    return { text: kind === "correct" ? accepted?.content ?? "" : "jawaban salah" };
  }

  const statements = Object.fromEntries(
    record.statements.map((statement, index) => {
      const value =
        kind === "correct"
          ? statement.correctAnswer
          : index === 0
            ? !statement.correctAnswer
            : statement.correctAnswer;
      return [statement.id, value];
    })
  );
  return { statements };
}

export function createSeedData(): StoreData {
  const subjects = [
    {
      id: "sub-mat",
      name: "Matematika",
      slug: "matematika",
      description:
        "Bilangan, pecahan, geometri, pengukuran, dan pengolahan data untuk kelas 6 SD/MI.",
      color: "indigo" as const,
      icon: "calculator",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "sub-indo",
      name: "Bahasa Indonesia",
      slug: "bahasa-indonesia",
      description:
        "Membaca pemahaman, kebahasaan, menulis, dan mengevaluasi informasi dalam teks.",
      color: "rose" as const,
      icon: "book-open",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "sub-ipas",
      name: "IPAS",
      slug: "ipas",
      description:
        "Makhluk hidup, ekosistem, energi, bumi, dan alam sekitar dalam kehidupan sehari-hari.",
      color: "emerald" as const,
      icon: "flask-conical",
      sortOrder: 3,
      isActive: true,
    },
  ];

  const topics: TopicRecord[] = [
    { id: "top-bilangan", subjectId: "sub-mat", name: "Bilangan & Operasi", slug: "bilangan-operasi", sortOrder: 1 },
    { id: "top-pecahan", subjectId: "sub-mat", name: "Pecahan & Desimal", slug: "pecahan-desimal", sortOrder: 2 },
    { id: "top-geometri", subjectId: "sub-mat", name: "Geometri & Pengukuran", slug: "geometri-pengukuran", sortOrder: 3 },
    { id: "top-data", subjectId: "sub-mat", name: "Data & Peluang", slug: "data-peluang", sortOrder: 4 },
    { id: "top-membaca", subjectId: "sub-indo", name: "Membaca Pemahaman", slug: "membaca-pemahaman", sortOrder: 1 },
    { id: "top-kebahasaan", subjectId: "sub-indo", name: "Kebahasaan", slug: "kebahasaan", sortOrder: 2 },
    { id: "top-menulis", subjectId: "sub-indo", name: "Menulis & Menyunting", slug: "menulis-menyunting", sortOrder: 3 },
    { id: "top-makhluk", subjectId: "sub-ipas", name: "Makhluk Hidup & Ekosistem", slug: "makhluk-hidup-ekosistem", sortOrder: 1 },
    { id: "top-bumi", subjectId: "sub-ipas", name: "Bumi & Alam", slug: "bumi-alam", sortOrder: 2 },
    { id: "top-energi", subjectId: "sub-ipas", name: "Energi & Perubahan", slug: "energi-perubahan", sortOrder: 3 },
  ];

  const materials: MaterialRecord[] = [
    {
      id: "mat-bilangan-operasi",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      title: "Operasi Hitung Bilangan Cacah",
      slug: "operasi-hitung-bilangan-cacah",
      summary:
        "Aturan urutan operasi hitung, FPB, dan KPK untuk bilangan cacah.",
      content:
        "**Urutan operasi hitung**\nKerjakan operasi di dalam tanda kurung terlebih dahulu, lalu perkalian atau pembagian, kemudian penjumlahan atau pengurangan dari kiri ke kanan.\n\nContoh:\n1. 1.250 + 3.750 - 1.500 = 3.500\n2. 24 + 6 x 5 = 24 + 30 = 54\n\n**FPB dan KPK**\nFPB adalah faktor terbesar yang sama dari dua bilangan. KPK adalah kelipatan terkecil yang sama.\n\nContoh: 12 dan 18\n- 12 = 2 x 2 x 3\n- 18 = 2 x 3 x 3\n- FPB = 2 x 3 = 6\n- KPK = 2 x 2 x 3 x 3 = 36\n\n**Tips**: tulis faktorisasi prima dengan rapi agar FPB dan KPK mudah ditentukan.",
      sortOrder: 1,
      updatedAt: daysAgo(5),
    },
    {
      id: "mat-pecahan-desimal",
      subjectId: "sub-mat",
      topicId: "top-pecahan",
      title: "Pecahan, Desimal, dan Persen",
      slug: "pecahan-desimal-persen",
      summary:
        "Cara mengubah pecahan ke desimal dan persen, serta operasi hitungnya.",
      content:
        "**Pecahan** menyatakan bagian dari keseluruhan. Pecahan senilai diperoleh dengan mengalikan atau membagi pembilang dan penyebut dengan bilangan yang sama.\n\nContoh pecahan senilai:\n2/5 = 4/10 = 6/15 = 8/20\n\n**Mengubah pecahan ke desimal**\nBagi pembilang dengan penyebut.\n- 3/4 = 3 : 4 = 0,75\n- 1/2 = 0,5\n\n**Mengubah desimal ke persen**\nKalikan dengan 100 lalu tambahkan tanda persen.\n- 0,75 = 75%\n- 0,5 = 50%\n\n**Tips**: samakan penyebut sebelum menjumlahkan atau mengurangkan pecahan.",
      sortOrder: 2,
      updatedAt: daysAgo(4),
    },
    {
      id: "mat-luas-keliling",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      title: "Luas dan Keliling Bangun Datar",
      slug: "luas-keliling-bangun-datar",
      summary:
        "Rumus luas dan keliling persegi, persegi panjang, segitiga, dan lingkaran.",
      content:
        "**Persegi**\n- Keliling = 4 x sisi\n- Luas = sisi x sisi\n\n**Persegi panjang**\n- Keliling = 2 x (panjang + lebar)\n- Luas = panjang x lebar\n\n**Segitiga**\n- Keliling = jumlah semua sisi\n- Luas = 1/2 x alas x tinggi\n\n**Lingkaran**\n- Keliling = 2 x pi x r\n- Luas = pi x r x r\nGunakan pi = 22/7 jika jari-jari kelipatan 7, atau 3,14 untuk angka lain.\n\n**Tips**: tulis satuan luas dengan cm persegi atau m persegi agar jawaban lengkap.",
      sortOrder: 3,
      updatedAt: daysAgo(3),
    },
    {
      id: "ind-ide-pokok",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      title: "Menentukan Ide Pokok",
      slug: "menentukan-ide-pokok",
      summary:
        "Cara menemukan ide pokok, kalimat utama, dan informasi penting dalam paragraf.",
      content:
        "**Ide pokok** adalah gagasan utama yang menjadi dasar sebuah paragraf. Ide pokok biasanya terdapat pada kalimat utama.\n\n**Letak kalimat utama**\n1. Awal paragraf (deduktif)\n2. Akhir paragraf (induktif)\n3. Awal dan akhir paragraf (campuran)\n\n**Langkah menentukan ide pokok**\n1. Baca seluruh paragraf.\n2. Temukan kalimat yang paling umum.\n3. Periksa apakah kalimat lain menjelaskan kalimat tersebut.\n4. Tulis ide pokok dengan kalimat singkat.\n\n**Tips**: jangan memilih kalimat yang hanya berisi contoh atau rincian.",
      sortOrder: 1,
      updatedAt: daysAgo(6),
    },
    {
      id: "ind-sinonim-antonim",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      title: "Sinonim dan Antonim",
      slug: "sinonim-antonim",
      summary:
        "Memahami persamaan dan lawan kata serta penggunaannya dalam kalimat.",
      content:
        "**Sinonim** adalah kata yang memiliki makna sama atau hampir sama.\nContoh:\n- cerdas = pandai\n- indah = cantik, elok\n- hemat = irit\n\n**Antonim** adalah kata yang memiliki makna berlawanan.\nContoh:\n- tinggi >< rendah\n- hemat >< boros\n- rajin >< malas\n\n**Tips**: perhatikan konteks kalimat. Sebuah kata bisa memiliki sinonim berbeda pada konteks yang berbeda.",
      sortOrder: 2,
      updatedAt: daysAgo(4),
    },
    {
      id: "ind-kalimat-efektif",
      subjectId: "sub-indo",
      topicId: "top-menulis",
      title: "Kalimat Efektif dan Tanda Baca",
      slug: "kalimat-efektif-tanda-baca",
      summary:
        "Ciri kalimat efektif serta penggunaan titik, koma, dan tanda tanya.",
      content:
        "**Kalimat efektif** adalah kalimat yang jelas, singkat, dan tidak berlebihan.\n\nCiri kalimat efektif:\n1. Memiliki subjek dan predikat yang jelas.\n2. Tidak mengulang kata secara berlebihan.\n3. Tidak menggunakan kata penguat ganda.\n4. Menggunakan tanda baca dengan tepat.\n\nContoh tidak efektif:\n- Para siswa-siswa berbaris dengan rapi.\n- Ia sangat rajin sekali belajar.\n\nPerbaikan:\n- Para siswa berbaris dengan rapi.\n- Ia sangat rajin belajar.\n\n**Tanda baca**\n- Titik (.) mengakhiri kalimat berita.\n- Koma (,) memisahkan perincian.\n- Tanda tanya (?) mengakhiri kalimat tanya.",
      sortOrder: 3,
      updatedAt: daysAgo(2),
    },
    {
      id: "ipas-fotosintesis",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      title: "Fotosintesis dan Rantai Makanan",
      slug: "fotosintesis-rantai-makanan",
      summary:
        "Proses tumbuhan membuat makanan serta peran produsen, konsumen, dan pengurai.",
      content:
        "**Fotosintesis** adalah proses tumbuhan hijau membuat makanan dengan bantuan cahaya matahari.\n\nBahan yang dibutuhkan:\n- air dari akar\n- karbon dioksida dari udara\n- cahaya matahari\n- klorofil pada daun\n\nHasil fotosintesis adalah glukosa dan oksigen. Oksigen dilepas ke udara dan dimanfaatkan makhluk hidup lain.\n\n**Rantai makanan**\nProdusen -> konsumen I -> konsumen II -> pengurai\n\nContoh:\npadi -> tikus -> ular -> pengurai\n\n**Peran makhluk hidup**\n- Produsen: membuat makanan sendiri, contoh padi dan rumput.\n- Konsumen: memakan makhluk hidup lain.\n- Pengurai: menguraikan sisa makhluk hidup, contoh jamur dan bakteri.",
      sortOrder: 1,
      updatedAt: daysAgo(5),
    },
    {
      id: "ipas-siklus-air",
      subjectId: "sub-ipas",
      topicId: "top-bumi",
      title: "Perubahan Wujud dan Siklus Air",
      slug: "perubahan-wujud-siklus-air",
      summary:
        "Evaporasi, kondensasi, presipitasi, serta perubahan wujud benda.",
      content:
        "**Perubahan wujud benda**\n- Mencair: padat menjadi cair, contoh es mencair.\n- Membeku: cair menjadi padat, contoh air menjadi es.\n- Menguap: cair menjadi gas, contoh air menjadi uap.\n- Mengembun: gas menjadi cair, contoh uap menjadi titik air.\n- Menyublim: padat menjadi gas, contoh kapur barus mengecil.\n\n**Siklus air**\n1. Evaporasi: air laut, sungai, dan danau menguap karena panas matahari.\n2. Kondensasi: uap air naik dan mendingin membentuk awan.\n3. Presipitasi: awan mengeluarkan hujan.\n4. Infiltrasi: air hujan meresap ke dalam tanah.\n\n**Tips**: ingat urutan evaporasi, kondensasi, lalu presipitasi.",
      sortOrder: 2,
      updatedAt: daysAgo(3),
    },
    {
      id: "ipas-energi",
      subjectId: "sub-ipas",
      topicId: "top-energi",
      title: "Energi dan Perubahannya",
      slug: "energi-perubahannya",
      summary:
        "Bentuk energi, perubahan energi, dan sumber energi terbarukan.",
      content:
        "**Energi** adalah kemampuan melakukan usaha. Energi tidak dapat diciptakan dan tidak dapat dimusnahkan, tetapi dapat berubah bentuk.\n\n**Bentuk energi**\n- energi listrik\n- energi cahaya\n- energi panas\n- energi gerak\n- energi kimia\n- energi bunyi\n\n**Contoh perubahan energi**\n- Kipas angin: listrik -> gerak\n- Lampu: listrik -> cahaya\n- Panel surya: cahaya -> listrik\n- Setrika: listrik -> panas\n- Makanan: kimia -> gerak dan panas\n\n**Sumber energi terbarukan**: matahari, angin, air, dan biomassa.\n**Sumber energi tidak terbarukan**: batu bara, minyak bumi, dan gas alam.",
      sortOrder: 3,
      updatedAt: daysAgo(2),
    },
  ];

  const questions: QuestionRecord[] = [
    question({
      id: "q-mat-01",
      subjectId: "sub-mat",
      topicId: "top-pecahan",
      type: "single_choice",
      level: "C4",
      stimulus:
        "Ibu membeli $\\frac{3}{4}$ kg gula. Sebanyak 0,5 kg gula digunakan untuk membuat kue. Sisa gula tersebut akan dimasukkan ke dalam 5 stoples kecil dengan isi yang sama banyak.",
      question: "Berapa kg gula dalam setiap stoples kecil?",
      indicator:
        "Mengaplikasikan operasi pengurangan dan pembagian pada bilangan pecahan dan desimal dalam konteks sehari-hari.",
      options: [
        ["0,05 kg", true],
        ["0,15 kg", false],
        ["0,25 kg", false],
        ["0,50 kg", false],
      ],
      explanation:
        "Sisa gula = $\\frac{3}{4} - 0,5 = 0,75 - 0,5 = 0,25$ kg. Gula per stoples = $0,25 \\div 5 = 0,05$ kg.",
    }),
    question({
      id: "q-mat-02",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      type: "single_choice",
      level: "C3",
      question: "Hasil dari 1.250 + 3.750 − 1.500 adalah ....",
      indicator: "Menghitung operasi penjumlahan dan pengurangan bilangan cacah.",
      options: [
        ["3.000", false],
        ["3.500", true],
        ["4.000", false],
        ["4.500", false],
      ],
      explanation:
        "1.250 + 3.750 = 5.000. Kemudian 5.000 − 1.500 = 3.500.",
    }),
    question({
      id: "q-mat-03",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "multiple_choice",
      level: "C4",
      stimulus:
        "Sebuah taman berukuran 30 m × 20 m. Di tengah taman dibuat kolam berbentuk lingkaran dengan diameter 14 m. Gunakan $\\pi = \\frac{22}{7}$.",
      question: "Pilih semua pernyataan yang benar.",
      indicator:
        "Menganalisis gabungan luas persegi panjang dan lingkaran dalam konteks nyata.",
      options: [
        ["Luas taman 600 m².", true],
        ["Luas kolam 154 m².", true],
        ["Keliling taman 100 m.", true],
        ["Luas rumput di luar kolam 500 m².", false],
      ],
      explanation:
        "Luas taman = 30 × 20 = 600 m². Luas kolam = $\\frac{22}{7} \\times 7 \\times 7 = 154$ m². Keliling taman = 2 × (30 + 20) = 100 m. Luas rumput = 600 − 154 = 446 m², bukan 500 m².",
    }),
    question({
      id: "q-mat-04",
      subjectId: "sub-mat",
      topicId: "top-data",
      type: "true_false_grid",
      level: "C5",
      stimulus:
        "Data nilai ulangan Matematika 10 siswa: 70, 80, 80, 90, 60, 70, 80, 100, 90, 80.",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan berdasarkan data tersebut.",
      indicator:
        "Mengevaluasi informasi dari data tunggal untuk menentukan modus, rata-rata, dan jangkauan.",
      statements: [
        ["Modus dari data tersebut adalah 80.", true],
        ["Nilai tertinggi pada data tersebut adalah 90.", false],
        ["Rata-rata nilai data tersebut adalah 80.", true],
        ["Ada dua siswa yang memperoleh nilai 90.", true],
      ],
      explanation:
        "Nilai 80 muncul 4 kali sehingga menjadi modus. Nilai tertinggi adalah 100. Jumlah nilai = 800, rata-rata = 800 ÷ 10 = 80. Nilai 90 muncul 2 kali.",
    }),
    question({
      id: "q-mat-05",
      subjectId: "sub-mat",
      topicId: "top-pecahan",
      type: "single_choice",
      level: "C4",
      stimulus: "Dari 45 siswa, $\\frac{2}{3}$ di antaranya mengikuti ekstrakurikuler musik.",
      question: "Berapa siswa yang mengikuti ekstrakurikuler musik?",
      indicator: "Menentukan bagian dari suatu keseluruhan pada bilangan pecahan.",
      options: [
        ["15 siswa", false],
        ["25 siswa", false],
        ["30 siswa", true],
        ["35 siswa", false],
      ],
      explanation: "Banyak siswa = $\\frac{2}{3} \\times 45 = 30$ siswa.",
    }),
    question({
      id: "q-mat-06",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "single_choice",
      level: "C3",
      question:
        "Sebuah persegi panjang memiliki panjang 12 cm dan lebar 8 cm. Keliling persegi panjang tersebut adalah ....",
      indicator: "Menghitung keliling bangun datar persegi panjang.",
      options: [
        ["20 cm", false],
        ["40 cm", true],
        ["48 cm", false],
        ["96 cm", false],
      ],
      explanation: "Keliling = 2 × (panjang + lebar) = 2 × (12 + 8) = 40 cm.",
    }),
    question({
      id: "q-mat-07",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      type: "single_choice",
      level: "C4",
      question: "Faktor persekutuan terbesar (FPB) dari 24 dan 36 adalah ....",
      indicator: "Menentukan FPB dua bilangan menggunakan faktorisasi.",
      options: [
        ["6", false],
        ["8", false],
        ["12", true],
        ["18", false],
      ],
      explanation:
        "24 = 2³ × 3 dan 36 = 2² × 3². FPB = 2² × 3 = 12.",
    }),
    question({
      id: "q-mat-08",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua bilangan prima dari bilangan berikut.",
      indicator: "Mengidentifikasi bilangan prima.",
      options: [
        ["2", true],
        ["17", true],
        ["21", false],
        ["29", true],
      ],
      explanation:
        "2, 17, dan 29 hanya memiliki dua faktor, yaitu 1 dan bilangan itu sendiri. Angka 21 memiliki faktor 1, 3, 7, dan 21.",
    }),
    question({
      id: "q-mat-09",
      subjectId: "sub-mat",
      topicId: "top-data",
      type: "single_choice",
      level: "C5",
      question: "Rata-rata dari data 6, 7, 8, 9, dan 10 adalah ....",
      indicator: "Mengevaluasi rata-rata data tunggal.",
      options: [
        ["7", false],
        ["8", true],
        ["8,5", false],
        ["9", false],
      ],
      explanation: "Jumlah data = 40. Banyak data = 5. Rata-rata = 40 ÷ 5 = 8.",
    }),
    question({
      id: "q-mat-10",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "true_false_grid",
      level: "C4",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan tentang kubus.",
      indicator: "Menganalisis sifat-sifat bangun ruang kubus.",
      statements: [
        ["Kubus memiliki 6 sisi berbentuk persegi.", true],
        ["Kubus memiliki 8 rusuk.", false],
        ["Semua rusuk kubus sama panjang.", true],
        ["Kubus memiliki 12 titik sudut.", false],
      ],
      explanation:
        "Kubus memiliki 6 sisi persegi, 12 rusuk sama panjang, dan 8 titik sudut.",
    }),
    question({
      id: "q-mat-11",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "single_choice",
      level: "C4",
      stimulus: "Jarak dua kota pada peta adalah 5 cm. Skala peta tersebut 1 : 200.000.",
      question: "Jarak sebenarnya kedua kota tersebut adalah ....",
      indicator: "Menggunakan skala untuk menentukan jarak sebenarnya.",
      options: [
        ["1 km", false],
        ["4 km", false],
        ["10 km", true],
        ["40 km", false],
      ],
      explanation:
        "Jarak sebenarnya = 5 × 200.000 = 1.000.000 cm = 10 km.",
    }),
    question({
      id: "q-mat-12",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "single_choice",
      level: "C3",
      question: "Volume kubus dengan panjang rusuk 6 cm adalah ....",
      indicator: "Menghitung volume kubus.",
      options: [
        ["36 cm³", false],
        ["108 cm³", false],
        ["216 cm³", true],
        ["432 cm³", false],
      ],
      explanation: "Volume kubus = s × s × s = 6 × 6 × 6 = 216 cm³.",
    }),
    question({
      id: "q-mat-13",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      type: "single_choice",
      level: "C4",
      question: "Kelipatan persekutuan terkecil (KPK) dari 12 dan 18 adalah ....",
      indicator: "Menentukan KPK dua bilangan menggunakan faktorisasi.",
      options: [
        ["24", false],
        ["36", true],
        ["48", false],
        ["72", false],
      ],
      explanation:
        "12 = 2² × 3 dan 18 = 2 × 3². KPK = 2² × 3² = 36.",
    }),
    question({
      id: "q-mat-14",
      subjectId: "sub-mat",
      topicId: "top-pecahan",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua pecahan yang senilai dengan $\\frac{2}{5}$.",
      indicator: "Mengidentifikasi pecahan senilai.",
      options: [
        ["$\\frac{4}{10}$", true],
        ["$\\frac{6}{15}$", true],
        ["$\\frac{8}{20}$", true],
        ["$\\frac{5}{2}$", false],
      ],
      explanation:
        "Pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan yang sama. $\\frac{2}{5} = \\frac{4}{10} = \\frac{6}{15} = \\frac{8}{20}$.",
    }),
    question({
      id: "q-mat-15",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "true_false_grid",
      level: "C3",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan tentang persegi.",
      indicator: "Menganalisis sifat-sifat bangun datar persegi.",
      statements: [
        ["Persegi memiliki empat sisi yang sama panjang.", true],
        ["Persegi memiliki dua sudut siku-siku.", false],
        ["Diagonal persegi sama panjang.", true],
        ["Keliling persegi dihitung dengan sisi × sisi.", false],
      ],
      explanation:
        "Persegi memiliki empat sudut siku-siku dan keliling dihitung dengan 4 × sisi. Sisi × sisi adalah rumus luas.",
    }),
    question({
      id: "q-mat-16",
      subjectId: "sub-mat",
      topicId: "top-pecahan",
      type: "short_answer",
      level: "C3",
      question: "Hasil dari 0,25 + 0,5 adalah ....",
      indicator: "Menghitung penjumlahan bilangan desimal.",
      options: [
        ["0,75", true],
        ["nol koma tujuh lima", true],
      ],
      explanation: "0,25 + 0,50 = 0,75.",
    }),
    question({
      id: "q-mat-17",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "short_answer",
      level: "C3",
      question:
        "Sebuah persegi memiliki panjang sisi 9 cm. Luas persegi tersebut adalah ... cm persegi.",
      indicator: "Menghitung luas persegi.",
      options: [
        ["81", true],
        ["81 cm persegi", true],
      ],
      explanation: "Luas persegi = sisi × sisi = 9 × 9 = 81 cm².",
    }),
    question({
      id: "q-mat-18",
      subjectId: "sub-mat",
      topicId: "top-data",
      type: "single_choice",
      level: "C4",
      question: "Rata-rata dari data 5, 6, 7, 8, dan 9 adalah ....",
      indicator: "Menghitung rata-rata data tunggal.",
      options: [
        ["6", false],
        ["7", true],
        ["8", false],
        ["9", false],
      ],
      explanation: "Jumlah data = 35. Rata-rata = 35 ÷ 5 = 7.",
    }),
    question({
      id: "q-mat-19",
      subjectId: "sub-mat",
      topicId: "top-geometri",
      type: "multiple_choice",
      level: "C5",
      question: "Pilih semua bangun ruang yang memiliki 6 sisi.",
      indicator: "Mengevaluasi sifat-sifat bangun ruang.",
      options: [
        ["kubus", true],
        ["balok", true],
        ["limas segiempat", false],
        ["prisma segitiga", false],
      ],
      explanation:
        "Kubus dan balok memiliki 6 sisi. Limas segiempat memiliki 5 sisi, sedangkan prisma segitiga memiliki 5 sisi.",
    }),
    question({
      id: "q-mat-20",
      subjectId: "sub-mat",
      topicId: "top-bilangan",
      type: "short_answer",
      level: "C4",
      question: "Tentukan faktor persekutuan terbesar (FPB) dari 18 dan 24.",
      indicator: "Menentukan FPB dua bilangan.",
      options: [
        ["6", true],
        ["enam", true],
      ],
      explanation: "18 = 2 × 3² dan 24 = 2³ × 3. FPB = 2 × 3 = 6.",
    }),

    question({
      id: "q-ind-01",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "single_choice",
      level: "C4",
      stimulus:
        "Setiap pagi, Rani membantu ibunya menyiram tanaman di halaman. Ia juga memberi makan ayam peliharaan. Setelah itu, Rani berangkat ke sekolah dengan sepeda. Di sekolah, Rani selalu membuang sampah pada tempatnya.",
      question: "Apa kegiatan Rani sebelum berangkat ke sekolah?",
      indicator:
        "Menyimpulkan informasi tersurat dari teks naratif pendek.",
      options: [
        ["Menyiram tanaman dan memberi makan ayam", true],
        ["Membersihkan kelas dan menyapu halaman", false],
        ["Membaca buku dan menulis catatan", false],
        ["Bermain sepeda di lapangan", false],
      ],
      explanation:
        "Teks menyebutkan Rani menyiram tanaman dan memberi makan ayam sebelum berangkat sekolah.",
    }),
    question({
      id: "q-ind-02",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "true_false_grid",
      level: "C5",
      stimulus:
        "Setiap pagi, Rani membantu ibunya menyiram tanaman di halaman. Ia juga memberi makan ayam peliharaan. Setelah itu, Rani berangkat ke sekolah dengan sepeda. Di sekolah, Rani selalu membuang sampah pada tempatnya.",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan berdasarkan teks.",
      indicator:
        "Mengevaluasi kesesuaian pernyataan dengan informasi dalam teks.",
      statements: [
        ["Rani pergi ke sekolah dengan sepeda.", true],
        ["Rani tidak peduli dengan kebersihan sekolah.", false],
        ["Rani membantu ibunya setiap pagi.", true],
      ],
      explanation:
        "Rani bersepeda ke sekolah dan membuang sampah pada tempatnya, sehingga pernyataan kedua salah.",
    }),
    question({
      id: "q-ind-03",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      type: "single_choice",
      level: "C3",
      question: "Sinonim kata **cerdas** adalah ....",
      indicator: "Menentukan sinonim kata dalam konteks kalimat.",
      options: [
        ["rajin", false],
        ["pandai", true],
        ["ramah", false],
        ["sabar", false],
      ],
      explanation: "Kata cerdas memiliki makna yang sama dengan pandai.",
    }),
    question({
      id: "q-ind-04",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "single_choice",
      level: "C4",
      stimulus:
        "Kerja bakti dilakukan warga setiap hari Minggu. Mereka membersihkan saluran air dan memangkas rumput di lingkungan sekitar. Kegiatan itu membuat lingkungan menjadi bersih dan sehat. Warga juga merasa lebih akrab setelah bekerja bersama.",
      question: "Ide pokok paragraf tersebut adalah ....",
      indicator: "Menentukan ide pokok paragraf.",
      options: [
        ["Warga bekerja bakti setiap hari Minggu.", true],
        ["Rumput di lingkungan harus dipangkas.", false],
        ["Saluran air sering tersumbat sampah.", false],
        ["Warga senang berkumpul di hari Minggu.", false],
      ],
      explanation:
        "Kalimat utama paragraf pertama menjelaskan kegiatan kerja bakti warga setiap hari Minggu.",
    }),
    question({
      id: "q-ind-05",
      subjectId: "sub-indo",
      topicId: "top-menulis",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua kalimat yang efektif.",
      indicator: "Menganalisis kalimat efektif dalam teks.",
      options: [
        ["Semua siswa hadir dalam acara itu.", true],
        ["Para siswa-siswa berbaris dengan rapi.", false],
        ["Kami saling membantu membersihkan kelas.", true],
        ["Ia sangat rajin sekali belajar.", false],
      ],
      explanation:
        "Kalimat kedua dan keempat tidak efektif karena menggunakan kata jamak dan kata penguat yang berlebihan.",
    }),
    question({
      id: "q-ind-06",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      type: "single_choice",
      level: "C3",
      question: "Antonim kata **hemat** adalah ....",
      indicator: "Menentukan antonim kata.",
      options: [
        ["kikir", false],
        ["boros", true],
        ["cermat", false],
        ["teliti", false],
      ],
      explanation: "Antonim atau lawan kata hemat adalah boros.",
    }),
    question({
      id: "q-ind-07",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "single_choice",
      level: "C4",
      stimulus:
        "Sampah plastik membutuhkan waktu ratusan tahun untuk terurai. Oleh karena itu, kita perlu mengurangi penggunaan plastik sekali pakai. Membawa tas sendiri saat berbelanja adalah langkah sederhana yang dapat dilakukan.",
      question: "Apa saran yang disampaikan dalam teks tersebut?",
      indicator: "Menyimpulkan saran dari teks persuasif pendek.",
      options: [
        ["Mengurangi penggunaan plastik sekali pakai.", true],
        ["Membakar sampah plastik di halaman.", false],
        ["Membeli plastik dalam jumlah banyak.", false],
        ["Membuang sampah plastik ke sungai.", false],
      ],
      explanation:
        "Teks menyarankan agar kita mengurangi penggunaan plastik sekali pakai, misalnya dengan membawa tas sendiri.",
    }),
    question({
      id: "q-ind-08",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "true_false_grid",
      level: "C5",
      stimulus:
        "Setiap sore, Sinta menyiram bunga di halaman. Ia juga membersihkan daun yang kering. Bunga-bunga itu tumbuh subur karena dirawat dengan baik.",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan berdasarkan teks.",
      indicator: "Mengevaluasi kesesuaian pernyataan dengan isi teks.",
      statements: [
        ["Sinta menyiram bunga setiap sore.", true],
        ["Sinta tidak pernah membersihkan daun kering.", false],
        ["Bunga tumbuh subur karena dirawat dengan baik.", true],
      ],
      explanation:
        "Teks menyebutkan Sinta membersihkan daun kering, sehingga pernyataan kedua salah.",
    }),
    question({
      id: "q-ind-09",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua kata baku.",
      indicator: "Membedakan kata baku dan tidak baku.",
      options: [
        ["apotek", true],
        ["apotik", false],
        ["izin", true],
        ["ijin", false],
      ],
      explanation:
        "Kata baku yang sesuai Kamus Besar Bahasa Indonesia adalah apotek dan izin.",
    }),
    question({
      id: "q-ind-10",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      type: "short_answer",
      level: "C3",
      question: "Lawan kata **tinggi** adalah ....",
      indicator: "Menentukan antonim kata.",
      options: [["rendah", true]],
      explanation: "Antonim atau lawan kata tinggi adalah rendah.",
    }),
    question({
      id: "q-ind-11",
      subjectId: "sub-indo",
      topicId: "top-kebahasaan",
      type: "short_answer",
      level: "C3",
      question: "Tuliskan sinonim kata **indah**.",
      indicator: "Menentukan sinonim kata.",
      options: [
        ["cantik", true],
        ["elok", true],
        ["bagus", true],
      ],
      explanation:
        "Kata indah memiliki makna yang sama dengan cantik, elok, atau bagus.",
    }),
    question({
      id: "q-ind-12",
      subjectId: "sub-indo",
      topicId: "top-menulis",
      type: "single_choice",
      level: "C4",
      question: "Kalimat yang menggunakan tanda baca dengan tepat adalah ....",
      indicator: "Menganalisis penggunaan tanda baca dalam kalimat.",
      options: [
        ["Rani membeli buku, pensil, dan penghapus.", true],
        ["Rani membeli buku pensil dan, penghapus.", false],
        ["Rani membeli buku pensil dan penghapus?", false],
        ["Rani membeli buku pensil, dan penghapus!", false],
      ],
      explanation:
        "Tanda koma digunakan untuk memisahkan unsur perincian, dan kalimat berita diakhiri titik.",
    }),
    question({
      id: "q-ind-13",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua unsur yang terdapat dalam sebuah berita.",
      indicator: "Mengidentifikasi unsur-unsur teks berita.",
      options: [
        ["judul berita", true],
        ["isi berita", true],
        ["pendapat pribadi penulis", false],
        ["sumber informasi", true],
      ],
      explanation:
        "Berita memuat judul, isi, dan sumber informasi. Pendapat pribadi penulis tidak termasuk unsur berita.",
    }),
    question({
      id: "q-ind-14",
      subjectId: "sub-indo",
      topicId: "top-membaca",
      type: "short_answer",
      level: "C3",
      stimulus:
        "Rani rajin menabung. Setiap hari ia menyisihkan sebagian uang saku untuk ditabung di celengan.",
      question: "Siapa tokoh utama dalam teks di atas?",
      indicator: "Menentukan tokoh utama dalam teks naratif.",
      options: [
        ["Rani", true],
        ["rani", true],
      ],
      explanation: "Tokoh yang dibahas dalam teks adalah Rani.",
    }),

    question({
      id: "q-ipas-01",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "single_choice",
      level: "C3",
      question:
        "Proses tumbuhan hijau membuat makanan dengan bantuan cahaya matahari disebut ....",
      indicator: "Menjelaskan proses fotosintesis pada tumbuhan.",
      options: [
        ["respirasi", false],
        ["fotosintesis", true],
        ["penguapan", false],
        ["pembusukan", false],
      ],
      explanation:
        "Fotosintesis adalah proses tumbuhan hijau mengolah air dan karbon dioksida dengan bantuan cahaya matahari untuk menghasilkan makanan.",
    }),
    question({
      id: "q-ipas-02",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua makhluk hidup yang berperan sebagai produsen dalam ekosistem.",
      indicator: "Menganalisis peran makhluk hidup dalam rantai makanan.",
      options: [
        ["padi", true],
        ["rumput", true],
        ["kambing", false],
        ["fitoplankton", true],
      ],
      explanation:
        "Produsen adalah organisme yang dapat membuat makanannya sendiri melalui fotosintesis, seperti padi, rumput, dan fitoplankton.",
    }),
    question({
      id: "q-ipas-03",
      subjectId: "sub-ipas",
      topicId: "top-energi",
      type: "true_false_grid",
      level: "C5",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan tentang energi.",
      indicator: "Mengevaluasi konsep perubahan energi dalam kehidupan sehari-hari.",
      statements: [
        ["Energi tidak dapat diciptakan dan tidak dapat dimusnahkan.", true],
        ["Panel surya mengubah energi cahaya menjadi energi listrik.", true],
        ["Kipas angin mengubah energi listrik menjadi energi kimia.", false],
      ],
      explanation:
        "Kipas angin mengubah energi listrik menjadi energi gerak, bukan energi kimia.",
    }),
    question({
      id: "q-ipas-04",
      subjectId: "sub-ipas",
      topicId: "top-bumi",
      type: "single_choice",
      level: "C4",
      question:
        "Perubahan uap air menjadi titik-titik air ketika suhu udara turun disebut ....",
      indicator: "Menganalisis tahapan siklus air.",
      options: [
        ["evaporasi", false],
        ["kondensasi", true],
        ["presipitasi", false],
        ["infiltrasi", false],
      ],
      explanation:
        "Kondensasi adalah proses perubahan uap air menjadi titik-titik air yang membentuk awan.",
    }),
    question({
      id: "q-ipas-05",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "single_choice",
      level: "C3",
      question: "Organ tubuh yang berfungsi memompa darah ke seluruh tubuh adalah ....",
      indicator: "Mengidentifikasi fungsi organ tubuh manusia.",
      options: [
        ["paru-paru", false],
        ["jantung", true],
        ["ginjal", false],
        ["lambung", false],
      ],
      explanation:
        "Jantung adalah organ yang memompa darah ke seluruh tubuh melalui pembuluh darah.",
    }),
    question({
      id: "q-ipas-06",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "single_choice",
      level: "C3",
      question: "Organ yang berfungsi sebagai alat pernapasan manusia adalah ....",
      indicator: "Mengidentifikasi organ pernapasan manusia.",
      options: [
        ["paru-paru", true],
        ["jantung", false],
        ["ginjal", false],
        ["lambung", false],
      ],
      explanation:
        "Paru-paru adalah organ pernapasan yang menukar oksigen dan karbon dioksida.",
    }),
    question({
      id: "q-ipas-07",
      subjectId: "sub-ipas",
      topicId: "top-energi",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua sumber energi terbarukan.",
      indicator: "Membedakan sumber energi terbarukan dan tidak terbarukan.",
      options: [
        ["sinar matahari", true],
        ["angin", true],
        ["batu bara", false],
        ["air", true],
      ],
      explanation:
        "Sinar matahari, angin, dan air dapat diperbarui. Batu bara termasuk sumber energi tidak terbarukan.",
    }),
    question({
      id: "q-ipas-08",
      subjectId: "sub-ipas",
      topicId: "top-energi",
      type: "true_false_grid",
      level: "C4",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan tentang magnet.",
      indicator: "Menganalisis sifat-sifat magnet.",
      statements: [
        ["Magnet memiliki kutub utara dan kutub selatan.", true],
        ["Kutub magnet yang sejenis saling tarik-menarik.", false],
        ["Magnet dapat menarik benda berbahan besi.", true],
      ],
      explanation:
        "Kutub magnet yang sejenis saling tolak-menolak, sedangkan kutub berbeda saling tarik-menarik.",
    }),
    question({
      id: "q-ipas-09",
      subjectId: "sub-ipas",
      topicId: "top-bumi",
      type: "short_answer",
      level: "C3",
      question: "Perubahan wujud air menjadi uap disebut ....",
      indicator: "Menjelaskan proses penguapan dalam siklus air.",
      options: [
        ["penguapan", true],
        ["evaporasi", true],
      ],
      explanation:
        "Penguapan atau evaporasi adalah perubahan air menjadi uap akibat pemanasan.",
    }),
    question({
      id: "q-ipas-10",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "short_answer",
      level: "C4",
      question: "Sebutkan satu contoh hewan herbivora.",
      indicator: "Mengelompokkan hewan berdasarkan jenis makanannya.",
      options: [
        ["sapi", true],
        ["kambing", true],
        ["kelinci", true],
        ["kerbau", true],
        ["gajah", true],
      ],
      explanation:
        "Herbivora adalah hewan pemakan tumbuhan, contohnya sapi, kambing, kelinci, kerbau, dan gajah.",
    }),
    question({
      id: "q-ipas-11",
      subjectId: "sub-ipas",
      topicId: "top-bumi",
      type: "single_choice",
      level: "C3",
      question: "Planet yang berada paling dekat dengan Matahari adalah ....",
      indicator: "Mengidentifikasi urutan planet dalam tata surya.",
      options: [
        ["Merkurius", true],
        ["Venus", false],
        ["Bumi", false],
        ["Mars", false],
      ],
      explanation:
        "Merkurius adalah planet terdekat dari Matahari, diikuti Venus, Bumi, dan Mars.",
    }),
    question({
      id: "q-ipas-12",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "multiple_choice",
      level: "C4",
      question: "Pilih semua ciri makhluk hidup.",
      indicator: "Mengidentifikasi ciri-ciri makhluk hidup.",
      options: [
        ["bernapas", true],
        ["bergerak", true],
        ["berkembang biak", true],
        ["selalu berpindah tempat", false],
      ],
      explanation:
        "Makhluk hidup bernapas, bergerak, dan berkembang biak. Tidak semua makhluk hidup selalu berpindah tempat, seperti tumbuhan.",
    }),
    question({
      id: "q-ipas-13",
      subjectId: "sub-ipas",
      topicId: "top-makhluk",
      type: "short_answer",
      level: "C3",
      question: "Alat pernapasan pada ikan adalah ....",
      indicator: "Mengidentifikasi alat pernapasan hewan.",
      options: [["insang", true]],
      explanation: "Ikan bernapas menggunakan insang untuk mengambil oksigen dari air.",
    }),
    question({
      id: "q-ipas-14",
      subjectId: "sub-ipas",
      topicId: "top-energi",
      type: "true_false_grid",
      level: "C5",
      question: "Tentukan Benar atau Salah untuk setiap pernyataan tentang energi.",
      indicator: "Mengevaluasi pemanfaatan energi dalam kehidupan sehari-hari.",
      statements: [
        ["Kipas angin mengubah energi listrik menjadi energi gerak.", true],
        ["Energi cahaya matahari tidak dapat dimanfaatkan manusia.", false],
        ["Makanan merupakan sumber energi bagi tubuh.", true],
      ],
      explanation:
        "Matahari dimanfaatkan untuk panel surya, pengeringan, dan fotosintesis. Jadi pernyataan kedua salah.",
    }),
  ];

  const subjectsPkg = [
    {
      id: "pkg-mat-latihan-1",
      subjectId: "sub-mat",
      title: "Latihan Matematika — Bilangan & Pecahan",
      slug: "latihan-matematika-bilangan-pecahan",
      type: "latihan" as const,
      description:
        "Latihan singkat untuk mengasah operasi bilangan, pecahan, dan geometri dasar.",
      durationMinutes: 25,
      maxAttempts: null,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: false,
      shuffleOptions: false,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(30),
      availableTo: null,
      questions: [
        { questionId: "q-mat-01", sortOrder: 1, points: 1 },
        { questionId: "q-mat-02", sortOrder: 2, points: 1 },
        { questionId: "q-mat-05", sortOrder: 3, points: 1 },
        { questionId: "q-mat-06", sortOrder: 4, points: 1 },
        { questionId: "q-mat-07", sortOrder: 5, points: 1 },
        { questionId: "q-mat-13", sortOrder: 6, points: 1 },
        { questionId: "q-mat-16", sortOrder: 7, points: 1 },
        { questionId: "q-mat-20", sortOrder: 8, points: 1 },
      ],
      classIds: ["cls-6"],
      createdAt: daysAgo(30),
    },
    {
      id: "pkg-mat-tryout-1",
      subjectId: "sub-mat",
      title: "Tryout Matematika 1",
      slug: "tryout-matematika-1",
      type: "tryout" as const,
      description:
        "Simulasi tryout TKA Matematika dengan 12 soal dan durasi 60 menit.",
      durationMinutes: 60,
      maxAttempts: 3,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: false,
      shuffleOptions: true,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(14),
      availableTo: null,
      questions: questions
        .filter((q) => q.subjectId === "sub-mat")
        .map((q, index) => ({
          questionId: q.id,
          sortOrder: index + 1,
          points: 1,
        })),
      classIds: ["cls-6"],
      createdAt: daysAgo(14),
    },
    {
      id: "pkg-indo-latihan-1",
      subjectId: "sub-indo",
      title: "Latihan Bahasa Indonesia — Membaca",
      slug: "latihan-bahasa-indonesia-membaca",
      type: "latihan" as const,
      description:
        "Latihan membaca pemahaman, sinonim, antonim, dan kalimat efektif.",
      durationMinutes: 20,
      maxAttempts: null,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: false,
      shuffleOptions: false,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(21),
      availableTo: null,
      questions: [
        { questionId: "q-ind-01", sortOrder: 1, points: 1 },
        { questionId: "q-ind-02", sortOrder: 2, points: 1 },
        { questionId: "q-ind-03", sortOrder: 3, points: 1 },
        { questionId: "q-ind-06", sortOrder: 4, points: 1 },
        { questionId: "q-ind-10", sortOrder: 5, points: 1 },
        { questionId: "q-ind-11", sortOrder: 6, points: 1 },
        { questionId: "q-ind-12", sortOrder: 7, points: 1 },
      ],
      classIds: ["cls-6"],
      createdAt: daysAgo(21),
    },
    {
      id: "pkg-indo-tryout-1",
      subjectId: "sub-indo",
      title: "Tryout Bahasa Indonesia 1",
      slug: "tryout-bahasa-indonesia-1",
      type: "tryout" as const,
      description:
        "Tryout Bahasa Indonesia dengan teks bacaan, soal kebahasaan, dan kalimat efektif.",
      durationMinutes: 45,
      maxAttempts: 3,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: false,
      shuffleOptions: true,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(10),
      availableTo: null,
      questions: questions
        .filter((q) => q.subjectId === "sub-indo")
        .map((q, index) => ({
          questionId: q.id,
          sortOrder: index + 1,
          points: 1,
        })),
      classIds: ["cls-6"],
      createdAt: daysAgo(10),
    },
    {
      id: "pkg-ipas-latihan-1",
      subjectId: "sub-ipas",
      title: "Latihan IPAS — Makhluk Hidup & Energi",
      slug: "latihan-ipas-makhluk-hidup-energi",
      type: "latihan" as const,
      description:
        "Latihan singkat tentang fotosintesis, organ tubuh, energi, dan siklus air.",
      durationMinutes: 20,
      maxAttempts: null,
      scoringMode: "partial" as const,
      shuffleQuestions: false,
      shuffleOptions: false,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(18),
      availableTo: null,
      questions: [
        { questionId: "q-ipas-01", sortOrder: 1, points: 1 },
        { questionId: "q-ipas-02", sortOrder: 2, points: 1 },
        { questionId: "q-ipas-05", sortOrder: 3, points: 1 },
        { questionId: "q-ipas-09", sortOrder: 4, points: 1 },
        { questionId: "q-ipas-11", sortOrder: 5, points: 1 },
        { questionId: "q-ipas-13", sortOrder: 6, points: 1 },
      ],
      classIds: ["cls-6"],
      createdAt: daysAgo(18),
    },
    {
      id: "pkg-ipas-tryout-1",
      subjectId: "sub-ipas",
      title: "Tryout IPAS 1",
      slug: "tryout-ipas-1",
      type: "tryout" as const,
      description:
        "Simulasi tryout IPAS mencakup makhluk hidup, energi, dan bumi.",
      durationMinutes: 30,
      maxAttempts: 2,
      scoringMode: "partial" as const,
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysAgo(7),
      availableTo: null,
      questions: questions
        .filter((q) => q.subjectId === "sub-ipas")
        .map((q, index) => ({
          questionId: q.id,
          sortOrder: index + 1,
          points: 1,
        })),
      classIds: ["cls-6"],
      createdAt: daysAgo(7),
    },
    {
      id: "pkg-mat-tryout-2",
      subjectId: "sub-mat",
      title: "Tryout Matematika 2 (Draft)",
      slug: "tryout-matematika-2",
      type: "tryout" as const,
      description:
        "Paket tryout lanjutan yang masih disusun. Belum dipublikasikan ke siswa.",
      durationMinutes: 60,
      maxAttempts: 3,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanation: true,
      status: "DRAFT" as const,
      availableFrom: null,
      availableTo: null,
      questions: [
        { questionId: "q-mat-03", sortOrder: 1, points: 1 },
        { questionId: "q-mat-04", sortOrder: 2, points: 1 },
        { questionId: "q-mat-09", sortOrder: 3, points: 1 },
        { questionId: "q-mat-10", sortOrder: 4, points: 1 },
        { questionId: "q-mat-11", sortOrder: 5, points: 1 },
        { questionId: "q-mat-12", sortOrder: 6, points: 1 },
      ],
      classIds: [],
      createdAt: daysAgo(2),
    },
    {
      id: "pkg-mat-tryout-3",
      subjectId: "sub-mat",
      title: "Tryout Matematika Akhir Semester",
      slug: "tryout-matematika-akhir-semester",
      type: "tryout" as const,
      description:
        "Tryout terjadwal yang akan dibuka pada pekan depan untuk seluruh kelas 6.",
      durationMinutes: 60,
      maxAttempts: 1,
      scoringMode: "all_or_nothing" as const,
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanation: true,
      status: "PUBLISHED" as const,
      availableFrom: daysFromNow(7),
      availableTo: daysFromNow(14),
      questions: [
        { questionId: "q-mat-01", sortOrder: 1, points: 1 },
        { questionId: "q-mat-02", sortOrder: 2, points: 1 },
        { questionId: "q-mat-05", sortOrder: 3, points: 1 },
        { questionId: "q-mat-06", sortOrder: 4, points: 1 },
        { questionId: "q-mat-07", sortOrder: 5, points: 1 },
        { questionId: "q-mat-08", sortOrder: 6, points: 1 },
        { questionId: "q-mat-09", sortOrder: 7, points: 1 },
        { questionId: "q-mat-10", sortOrder: 8, points: 1 },
      ],
      classIds: ["cls-6"],
      createdAt: daysAgo(1),
    },
  ];

  const users = [
    {
      id: "u-admin",
      name: "Admin Bimbel",
      username: "admin",
      email: "admin@tkaceras.id",
      passwordHash: HASH.admin,
      role: "ADMIN" as const,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: hoursAgo(2),
    },
    {
      id: "u-tutor-rani",
      name: "Bu Rani",
      username: "tutor",
      email: "tutor@tkaceras.id",
      passwordHash: HASH.tutor,
      role: "TUTOR" as const,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: hoursAgo(5),
    },
    {
      id: "u-tutor-dimas",
      name: "Pak Dimas",
      username: "tutor2",
      email: "dimas@tkaceras.id",
      passwordHash: HASH.tutor,
      role: "TUTOR" as const,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: daysAgo(1),
    },
    ...[
      ["u-s1", "Alya Putri", "6001", "P"],
      ["u-s2", "Bima Saputra", "6002", "L"],
      ["u-s3", "Citra Lestari", "6003", "P"],
      ["u-s4", "Dewi Anggraini", "6004", "P"],
      ["u-s5", "Eka Pratama", "6005", "L"],
      ["u-s6", "Fajar Nugroho", "6006", "L"],
      ["u-s7", "Gita Maharani", "6007", "P"],
      ["u-s8", "Hadi Wijaya", "6008", "L"],
    ].map(([id, name, nis, gender], index) => ({
      id,
      name,
      username: nis,
      // Samakan dengan email Auth yang dibuat `supabase/seed.ts`.
      email: studentAuthEmail(nis),
      passwordHash: HASH.student,
      role: "STUDENT" as const,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: index === 0 ? hoursAgo(1) : daysAgo(index + 1),
    })),
  ];

  const students = [
    { id: "st-1", userId: "u-s1", nis: "6001", classId: "cls-6", school: "SDN 01 Harapan", gender: "P" as const, parentPhone: "0812-0000-0001" },
    { id: "st-2", userId: "u-s2", nis: "6002", classId: "cls-6", school: "SDN 01 Harapan", gender: "L" as const, parentPhone: "0812-0000-0002" },
    { id: "st-3", userId: "u-s3", nis: "6003", classId: "cls-6", school: "SDN 02 Melati", gender: "P" as const, parentPhone: "0812-0000-0003" },
    { id: "st-4", userId: "u-s4", nis: "6004", classId: "cls-6", school: "SDN 02 Melati", gender: "P" as const, parentPhone: "0812-0000-0004" },
    { id: "st-5", userId: "u-s5", nis: "6005", classId: "cls-6", school: "SDN 03 Cendana", gender: "L" as const, parentPhone: "0812-0000-0005" },
    { id: "st-6", userId: "u-s6", nis: "6006", classId: "cls-6", school: "SDN 03 Cendana", gender: "L" as const, parentPhone: "0812-0000-0006" },
    { id: "st-7", userId: "u-s7", nis: "6007", classId: "cls-6", school: "SDN 04 Kenanga", gender: "P" as const, parentPhone: "0812-0000-0007" },
    { id: "st-8", userId: "u-s8", nis: "6008", classId: "cls-6", school: "SDN 04 Kenanga", gender: "L" as const, parentPhone: "0812-0000-0008" },
  ].map((student) => ({
    ...student,
    isActive: true,
  }));

  const classes = [
    {
      id: "cls-6",
      name: "Kelas 6",
      academicYear: "2026/2027",
      tutorId: "u-tutor-rani",
      isActive: true,
    },
  ];

  const packages: PackageRecord[] = subjectsPkg;
  const attempts = buildSeedAttempts(questions, topics, { packages });

  // Attempt yang masih berjalan untuk demo tombol "Lanjutkan ujian".
  const indoPackage = packages.find((p) => p.id === "pkg-indo-latihan-1")!;
  const indoQuestions = indoPackage.questions.map((item) => {
    const record = questions.find((q) => q.id === item.questionId)!;
    const topic = topics.find((t) => t.id === record.topicId);
    return { record, snapshot: createSnapshot(record, topic?.name ?? null), points: item.points };
  });
  const inProgressAnswers: AttemptRecord["answers"] = {};
  indoQuestions.forEach((item) => {
    inProgressAnswers[item.record.id] = {
      questionId: item.record.id,
      answer: item === indoQuestions[0] ? makeAnswer(item.record, "correct") : null,
      isCorrect: null,
      pointsAwarded: null,
      snapshot: item.snapshot,
      isFlagged: false,
      answeredAt: item === indoQuestions[0] ? hoursAgo(0.1) : null,
      updatedAt: hoursAgo(0.1),
    };
  });
  attempts.push({
    id: "at-9",
    studentId: "st-1",
    packageId: indoPackage.id,
    status: "in_progress",
    scoringMode: indoPackage.scoringMode,
    startedAt: iso(now - 5 * 60_000),
    expiresAt: iso(now + (indoPackage.durationMinutes - 5) * 60_000),
    submittedAt: null,
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    questionOrder: indoQuestions.map((item) => item.record.id),
    optionOrder: Object.fromEntries(
      indoQuestions.map((item) => [
        item.record.id,
        item.record.options.map((option) => option.id),
      ])
    ),
    lastQuestionIndex: 0,
    answers: inProgressAnswers,
    events: [],
  });

  return {
    users,
    students,
    classes,
    subjects,
    topics,
    materials,
    questions,
    packages,
    attempts,
    settings: {
      appName: "BIMBEL STAR KIDS",
      bimbelName: "BIMBEL STAR KIDS",
      academicYear: "2026/2027",
      contactWhatsapp: "0812-3456-7890",
      heroTitle: "Simulasi TKA Kelas 6 SD/MI",
      heroSubtitle:
        "Latihan, tryout, dan pantau hasilmu dalam satu aplikasi yang nyaman digunakan di HP.",
      defaultInstructions:
        "Kerjakan setiap soal dengan teliti. Waktu berjalan setelah kamu menekan tombol Mulai. Jawaban tersimpan otomatis.",
    },
  };
}

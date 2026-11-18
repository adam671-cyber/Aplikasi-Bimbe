import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Copy, FileQuestion, Filter, Plus, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { duplicateQuestionAction, setQuestionStatusAction } from "@/lib/actions/questions";
import { requireAdmin } from "@/lib/auth/guards";
import { getSubjects, getTopics } from "@/lib/data/catalog";
import { listQuestions } from "@/lib/data/questions";
import { QUESTION_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kelola Soal" };

const typeLabels: Record<string, string> = {
  single_choice: "PG",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar/Salah",
  short_answer: "Isian singkat",
};

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    subjectId?: string;
    topicId?: string;
    status?: string;
    type?: string;
    search?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [subjects, questions] = await Promise.all([
    getSubjects(true),
    listQuestions({
      subjectId: params.subjectId || undefined,
      topicId: params.topicId || undefined,
      status:
        params.status && params.status !== "ALL"
          ? (params.status as "DRAFT" | "ACTIVE" | "INACTIVE")
          : "ALL",
      type:
        params.type && params.type !== "all"
          ? (params.type as
              | "single_choice"
              | "multiple_choice"
              | "true_false_grid"
              | "short_answer")
          : undefined,
      search: params.search,
    }),
  ]);
  const topics = await getTopics(params.subjectId || undefined);

  return (
    <div>
      <PageHeader
        eyebrow="Bank soal"
        title="Kelola bank soal"
        description="Tambah, ubah, gandakan, dan atur status soal. Perubahan tidak memengaruhi hasil attempt lama."
        actions={
          <ButtonLink href="/admin/soal/baru" size="sm">
            <Plus className="h-4 w-4" />
            Tambah soal
          </ButtonLink>
        }
      />

      {params.ok ? <Alert variant="success" className="mb-4">{params.ok}</Alert> : null}
      {params.error ? <Alert variant="error" className="mb-4">{params.error}</Alert> : null}

      <Card className="mb-4">
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1">
              <label htmlFor="subjectId" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Mapel
              </label>
              <Select
                id="subjectId"
                name="subjectId"
                defaultValue={params.subjectId ?? ""}
                className="h-10 text-[13px]"
              >
                <option value="">Semua mapel</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[150px] flex-1">
              <label htmlFor="topicId" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Topik
              </label>
              <Select
                id="topicId"
                name="topicId"
                defaultValue={params.topicId ?? ""}
                className="h-10 text-[13px]"
              >
                <option value="">Semua topik</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[130px] flex-1">
              <label htmlFor="status" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Status
              </label>
              <Select
                id="status"
                name="status"
                defaultValue={params.status ?? "ALL"}
                className="h-10 text-[13px]"
              >
                <option value="ALL">Semua status</option>
                {QUESTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[130px] flex-1">
              <label htmlFor="type" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Jenis
              </label>
              <Select
                id="type"
                name="type"
                defaultValue={params.type ?? "all"}
                className="h-10 text-[13px]"
              >
                <option value="all">Semua jenis</option>
                <option value="single_choice">PG</option>
                <option value="multiple_choice">PG kompleks</option>
                <option value="true_false_grid">Benar/Salah</option>
                <option value="short_answer">Isian singkat</option>
              </Select>
            </div>
            <div className="min-w-[170px] flex-1">
              <label htmlFor="search" className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Cari soal
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Kata kunci pertanyaan"
                className="h-10 text-[13px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            <Link
              href="/admin/soal"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Link>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={`Soal ditemukan (${questions.length})`} />
        {questions.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Pertanyaan</Th>
                <Th>Mapel / topik</Th>
                <Th>Jenis</Th>
                <Th>Level</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <Tr key={question.id}>
                  <Td>
                    <p className="line-clamp-2 max-w-[320px] text-[12px] leading-5 text-slate-800">
                      {question.question}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Diperbarui {formatDate(question.updatedAt)} ·{" "}
                      {question.author?.name ?? "—"}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-[12px] text-slate-700">{question.subject.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {question.topic?.name ?? "Tanpa topik"}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone="slate">
                      {typeLabels[question.type] ?? question.type}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone="brand">{question.level}</Badge>
                  </Td>
                  <Td>
                    <form action={setQuestionStatusAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="questionId" value={question.id} />
                      <Select
                        name="status"
                        defaultValue={question.status}
                        className="h-8 w-[108px] text-[11px]"
                        aria-label={`Status soal`}
                      >
                        {QUESTION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Set
                      </button>
                    </form>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/soal/${question.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Ubah
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <form action={duplicateQuestionAction}>
                        <input type="hidden" name="questionId" value={question.id} />
                        <button
                          type="submit"
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                          <Copy className="h-3 w-3" />
                          Duplikat
                        </button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<FileQuestion className="h-5 w-5" />}
              title="Tidak ada soal"
              description="Ubah filter atau tambahkan soal baru."
              action={<ButtonLink href="/admin/soal/baru">Tambah soal</ButtonLink>}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

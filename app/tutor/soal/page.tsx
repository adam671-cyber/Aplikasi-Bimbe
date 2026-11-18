import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileQuestion, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { requireTutor } from "@/lib/auth/guards";
import { listQuestions } from "@/lib/data/questions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Bank Soal" };

const statusTone = {
  ACTIVE: "emerald",
  DRAFT: "amber",
  INACTIVE: "slate",
} as const;

const typeLabels: Record<string, string> = {
  single_choice: "PG",
  multiple_choice: "PG kompleks",
  true_false_grid: "Benar/Salah",
  short_answer: "Isian singkat",
};

export default async function TutorQuestionsPage() {
  const user = await requireTutor();
  const questions = await listQuestions();

  return (
    <div>
      <PageHeader
        eyebrow="Bank soal"
        title="Soal yang tersedia"
        description="Soal aktif dan draft. Tutor dapat membuat soal baru; soal baru tersimpan sebagai draft sampai admin mengaktifkannya."
        actions={
          <ButtonLink href="/tutor/soal/baru" size="sm">
            <Plus className="h-4 w-4" />
            Tambah soal
          </ButtonLink>
        }
      />

      <Card>
        {questions.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Pertanyaan</Th>
                <Th>Mapel / topik</Th>
                <Th>Jenis</Th>
                <Th>Level</Th>
                <Th>Status</Th>
                <Th>Diperbarui</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => {
                const own = question.createdById === user.id;
                return (
                  <Tr key={question.id}>
                    <Td>
                      <p className="line-clamp-2 max-w-[340px] text-[12px] leading-5 text-slate-800">
                        {question.question}
                      </p>
                      {question.stimulus ? (
                        <p className="mt-0.5 line-clamp-1 max-w-[340px] text-[10px] text-slate-400">
                          Stimulus: {question.stimulus.replace(/\$[^$]*\$/g, "…")}
                        </p>
                      ) : null}
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
                      <Badge tone={statusTone[question.status]}>{question.status}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-[11px] text-slate-400">
                      {formatDate(question.updatedAt)}
                    </Td>
                    <Td className="text-right">
                      {own ? (
                        <Link
                          href={`/tutor/soal/${question.id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                        >
                          Ubah
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-300">
                          {question.author?.name ?? "—"}
                        </span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<FileQuestion className="h-5 w-5" />}
              title="Belum ada soal"
              description="Tambahkan soal pertama untuk mulai membangun bank soal bimbel."
              action={<ButtonLink href="/tutor/soal/baru">Tambah soal</ButtonLink>}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { BookPlus, Layers, Plus, Power } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  createSubjectAction,
  createTopicAction,
  toggleSubjectActiveAction,
} from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getSubjects, getTopics } from "@/lib/data/catalog";
import { countQuestions } from "@/lib/data/questions";

export const metadata: Metadata = { title: "Mata Pelajaran" };

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const subjects = await getSubjects(true);
  const topics = await getTopics();
  const counts = await Promise.all(
    subjects.map((subject) => countQuestions({ subjectId: subject.id }))
  );

  return (
    <div>
      <PageHeader
        eyebrow="Kurikulum"
        title="Mata pelajaran & topik"
        description="Kelola daftar mapel dan topik yang dipakai pada bank soal."
      />

      {params.ok ? <Alert variant="success" className="mb-4">{params.ok}</Alert> : null}
      {params.error ? <Alert variant="error" className="mb-4">{params.error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Tambah mata pelajaran"
            action={<BookPlus className="h-4 w-4 text-slate-300" />}
          />
          <CardContent>
            <form action={createSubjectAction} className="space-y-3">
              <Field label="Nama mapel" htmlFor="name" required>
                <Input id="name" name="name" placeholder="Contoh: Pendidikan Pancasila" required />
              </Field>
              <Field label="Deskripsi" htmlFor="description">
                <Textarea id="description" name="description" rows={2} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Warna" htmlFor="color">
                  <Select id="color" name="color" defaultValue="indigo">
                    <option value="indigo">Indigo</option>
                    <option value="rose">Rose</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="sky">Sky</option>
                  </Select>
                </Field>
                <Field label="Ikon" htmlFor="icon">
                  <Select id="icon" name="icon" defaultValue="book-open">
                    <option value="book-open">Buku</option>
                    <option value="calculator">Kalkulator</option>
                    <option value="flask-conical">Labu</option>
                  </Select>
                </Field>
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Tambah mapel
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Tambah topik"
            action={<Layers className="h-4 w-4 text-slate-300" />}
          />
          <CardContent>
            <form action={createTopicAction} className="space-y-3">
              <Field label="Mata pelajaran" htmlFor="subjectId" required>
                <Select id="subjectId" name="subjectId" required>
                  {subjects
                    .filter((subject) => subject.isActive)
                    .map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Nama topik" htmlFor="topicName" required>
                <Input
                  id="topicName"
                  name="name"
                  placeholder="Contoh: Bangun Ruang"
                  required
                />
              </Field>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Tambah topik
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 space-y-4">
        {subjects.map((subject, index) => {
          const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id);
          return (
            <Card key={subject.id}>
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {subject.name}
                    <Badge tone={subject.isActive ? "emerald" : "slate"}>
                      {subject.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </span>
                }
                description={subject.description}
                action={
                  <form action={toggleSubjectActiveAction}>
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={subject.isActive ? "0" : "1"}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Power className="h-3 w-3" />
                      {subject.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                }
              />
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{counts[index]} soal</Badge>
                  <Badge tone="slate">{subjectTopics.length} topik</Badge>
                  <span className="text-[11px] text-slate-400">/{subject.slug}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {subjectTopics.length ? (
                    subjectTopics.map((topic) => (
                      <span
                        key={topic.id}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {topic.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Belum ada topik pada mapel ini.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

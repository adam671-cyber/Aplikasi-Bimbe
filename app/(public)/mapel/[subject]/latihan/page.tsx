import type { Metadata } from "next";
import { SubjectPackageList } from "@/components/pages/subject-package-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  return { title: `Latihan ${subject}` };
}

export default async function LatihanListPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  return <SubjectPackageList slug={subject} type="latihan" />;
}

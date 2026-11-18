import { getStore } from "./store";
import { ensureStore } from "@/lib/supabase/store-sync";
import type { MaterialRecord, SubjectRecord, TopicRecord } from "./types";

export interface MaterialView extends MaterialRecord {
  subject: SubjectRecord;
  topic: TopicRecord | null;
}

function attachMeta(record: MaterialRecord): MaterialView | null {
  const store = getStore();
  const subject = store.subjects.find((item) => item.id === record.subjectId);
  if (!subject) return null;
  return {
    ...record,
    subject,
    topic: store.topics.find((item) => item.id === record.topicId) ?? null,
  };
}

export async function listMaterials(filter?: {
  subjectId?: string;
  topicId?: string;
}): Promise<MaterialView[]> {
  await ensureStore();
  return getStore()
    .materials.filter((material) => {
      if (filter?.subjectId && material.subjectId !== filter.subjectId)
        return false;
      if (filter?.topicId && material.topicId !== filter.topicId) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(attachMeta)
    .filter((item): item is MaterialView => Boolean(item));
}

export async function getMaterialBySlug(
  subjectSlug: string,
  materialSlug: string
): Promise<MaterialView | null> {
  await ensureStore();
  const store = getStore();
  const subject = store.subjects.find(
    (item) => item.slug === subjectSlug && item.isActive
  );
  if (!subject) return null;
  const record = store.materials.find(
    (item) => item.subjectId === subject.id && item.slug === materialSlug
  );
  return record ? attachMeta(record) : null;
}

export async function countMaterials(subjectId?: string) {
  await ensureStore();
  return getStore().materials.filter(
    (material) => !subjectId || material.subjectId === subjectId
  ).length;
}

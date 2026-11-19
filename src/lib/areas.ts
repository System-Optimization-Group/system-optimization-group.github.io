import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Area = CollectionEntry<'areas'>;

export async function getAreas() {
  return (await getCollection('areas')).sort((a, b) => a.data.order - b.data.order);
}

/** Title/summary in the interface language, falling back to the English frontmatter. */
export function areaText(area: Area, lang: Lang) {
  const o = lang === 'en' ? undefined : area.data.i18n[lang];
  return { title: o?.title ?? area.data.title, summary: o?.summary ?? area.data.summary, topics: o?.topics ?? area.data.topics };
}

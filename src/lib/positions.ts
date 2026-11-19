import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Position = {
  id: string;                          // folder name, e.g. "phd"
  entry: CollectionEntry<'positions'>; // the file to render (translated body if there is one)
  title: string;
  kind?: string;
  summary?: string;
  start?: string;
  location?: string;
  deadline?: Date;
  apply?: string;
  open: boolean;                       // actively recruiting (and deadline not passed)
};

/**
 * All positions for a language. Files are `<id>/<lang>.md`; `en.md` holds the settings and
 * any language without its own file falls back to English.
 */
export async function getPositions(lang: Lang, now = Date.now()): Promise<Position[]> {
  const all = await getCollection('positions');
  const ids = [...new Set(all.map((e) => e.id.split('/')[0]))];
  return ids
    .map((id) => {
      const en = all.find((e) => e.id === `${id}/en`);
      if (!en) throw new Error(`positions/${id}/en.md is missing (it holds the settings)`);
      const tr = lang === 'en' ? undefined : all.find((e) => e.id === `${id}/${lang}`);
      const d = en.data;
      const open = !!d.open && (!d.deadline || +d.deadline + 864e5 > now);
      return {
        id, entry: tr ?? en, open,
        title: tr?.data.title ?? d.title,
        kind: d.kind,
        summary: tr?.data.summary ?? d.summary,
        start: tr?.data.start ?? d.start,
        location: tr?.data.location ?? d.location,
        deadline: d.deadline,
        apply: d.apply,
        order: d.order ?? 100,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...p }) => p);
}

/** mailto: for plain email addresses, otherwise the URL as given. */
export const applyHref = (apply: string) => (apply.includes('@') && !apply.includes('://') ? `mailto:${apply}` : apply);

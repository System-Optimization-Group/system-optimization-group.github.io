import { getCollection } from 'astro:content';

// Normalise "S. Pokutta", "Sebastian  Pokutta" etc. for matching author strings.
export const norm = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.\s]+/g, ' ').trim();

let cache: Map<string, string> | undefined;
/** Map of normalised author name/alias -> member id. */
export async function authorIndex() {
  if (!cache) {
    cache = new Map();
    for (const m of await getCollection('members')) {
      for (const n of [m.data.name, ...m.data.aliases]) cache.set(norm(n), m.id);
    }
  }
  return cache;
}

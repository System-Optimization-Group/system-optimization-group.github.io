import type { Paper } from './papers';

const ascii = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
const esc = (s: string) => s.replace(/([&%$#_])/g, '\\$1');

/** Citation key like "lovelace2024adaptive". */
export function bibKey(p: Paper) {
  const last = ascii(p.authors[0]?.split(/\s+/).pop() ?? 'anon').toLowerCase().replace(/[^a-z]/g, '');
  const stop = new Set(['a', 'an', 'the', 'on', 'of', 'for', 'and', 'in', 'to', 'with']);
  const word = ascii(p.title).toLowerCase().split(/[^a-z0-9]+/).find((w) => w && !stop.has(w)) ?? '';
  return `${last}${p.published.slice(0, 4)}${word}`;
}

export function bibtex(p: Paper) {
  const venue = p.journal_ref || p.venue;
  const isConf = p.type === 'conference-paper' || /conference|proceedings|symposium|workshop|neurips|icml|iclr/i.test(venue ?? '');
  const isChapter = p.type === 'book-chapter';
  const kind = !venue ? 'misc' : isChapter || isConf ? 'inproceedings' : 'article';
  const f: [string, string | null | undefined][] = [
    ['title', `{${esc(p.title)}}`],
    ['author', p.authors.map(esc).join(' and ')],
    [kind === 'article' ? 'journal' : 'booktitle', venue && kind !== 'misc' ? esc(venue) : null],
    ['year', p.published.slice(0, 4)],
    ['doi', p.doi],
    ['eprint', p.arxiv_id],
    ['archivePrefix', p.arxiv_id ? 'arXiv' : null],
    ['primaryClass', p.arxiv_id ? p.primary_category : null],
    ['url', !p.doi && !p.arxiv_id ? p.url : null],
  ];
  const body = f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(',\n');
  return `@${kind}{${bibKey(p)},\n${body}\n}`;
}

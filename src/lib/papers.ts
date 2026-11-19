import data from '../data/publications.json';

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  published: string;
  primary_category?: string | null;
  categories?: string[];
  journal_ref?: string | null;
  venue?: string | null;
  type?: string | null;
  arxiv_id?: string | null;
  doi?: string | null;
  url?: string;
  pdf?: string;
  source?: string;
  members: string[];
};

export const papers: Paper[] = (data as { papers: Paper[] }).papers;
export const generated: string | undefined = (data as { generated?: string }).generated;

export const papersBy = (memberId: string) => papers.filter((p) => p.members.includes(memberId));

export const year = (p: Paper) => p.published.slice(0, 4);

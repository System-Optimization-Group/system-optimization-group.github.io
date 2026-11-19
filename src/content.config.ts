import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per person: src/content/members/<firstname-lastname>.md
// Frontmatter = profile data and how to find papers; Markdown body = bio (optional).
const members = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/members' }),
  schema: z.object({
    name: z.string(),
    aliases: z.array(z.string()).default([]),
    role: z.enum(['pi', 'postdoc', 'phd', 'ra', 'master', 'staff', 'alumni']),
    title: z.string().optional(),
    photo: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    github: z.string().optional(),
    scholar: z.string().optional(),
    interests: z.array(z.string()).default([]),
    arxiv: z.any().optional(),      // read by scripts/fetch_publications.py
    openalex: z.any().optional(),   // read by scripts/fetch_publications.py
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tag: z.enum(['News', 'Award', 'Paper', 'Talk', 'Event']).default('News'),
    summary: z.string().optional(),
  }),
});

// Research areas: the top level of the Research section. Optional `i18n` gives
// translated title/summary (areas are few and read like site texts).
const localized = z.object({ title: z.string().optional(), summary: z.string().optional(), topics: z.array(z.string()).optional() });
const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/areas' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(100),
    topics: z.array(z.string()).default([]),   // sub-topics shown under the area title
    i18n: z.object({ 'zh-hans': localized.optional(), 'zh-hant': localized.optional() }).default({}),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    area: reference('areas').optional(),  // file name in src/content/areas/
    tags: z.array(z.string()).default([]),
    members: z.array(reference('members')).default([]),   // file names in src/content/members/
    link: z.string().optional(),
    code: z.string().optional(),
    order: z.number().default(100),
    active: z.boolean().default(true),
  }),
});

const software = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/software' }),
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    repo: z.string().optional(),
    docs: z.string().optional(),
    install: z.string().optional(),      // one-line install command
    language: z.string().optional(),
    license: z.string().optional(),
    tags: z.array(z.string()).default([]),
    members: z.array(reference('members')).default([]),
    papers: z.array(z.string()).default([]),  // publication ids (arXiv / OpenAlex)
    order: z.number().default(100),
  }),
});

// Positions ("Join us" page): one folder per position, one Markdown file per language:
//   src/content/positions/phd/en.md  (+ zh-hans.md, zh-hant.md, optional)
// en.md carries the settings (kind, open, deadline, order, apply); translated files only need
// title/summary/start/location and the translated body.
const positions = defineCollection({
  loader: glob({ pattern: '*/*.md', base: 'src/content/positions' }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['PhD', 'Postdoc', 'Master', 'Research Assistant', 'Intern', 'Other']).optional(),
    summary: z.string().optional(),
    open: z.boolean().optional(),           // true = actively recruiting; false = "possible position"
    order: z.number().optional(),
    posted: z.coerce.date().optional(),
    deadline: z.coerce.date().optional(),   // omit for "open until filled"
    start: z.string().optional(),           // free text, e.g. "Autumn 2027" / "flexible"
    location: z.string().optional(),
    apply: z.string().optional(),           // URL or email address; defaults to the group email
  }),
});

export const collections = { members, news, areas, projects, software, positions };

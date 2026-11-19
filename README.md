# Group website

Static research-group website: **Astro** for the site, a small **Python** script that pulls
members' papers from **arXiv** and **OpenAlex**, and **GitHub Actions** that refreshes papers daily and deploys
to GitHub Pages. No database or server.

## Install

Requirements: **Node.js 22.23+**, **Python 3.10+**, `git`. Optional: [GitHub CLI](https://cli.github.com) (`gh`) for publishing.

```bash
git clone https://github.com/<you>/<repo>.git && cd <repo>
make install        # or: bash scripts/setup.sh
make dev            # http://localhost:4321, live reload
```

| Command | What it does |
|---|---|
| `make dev` | local server with live reload |
| `make papers` | refresh `src/data/publications.json` from arXiv + OpenAlex |
| `make build` / `make preview` | build `dist/` / serve the built site |
| `make stop` | stop a running local server |
| `make github REPO=my-group` | **first publish**: create the GitHub repo, enable Pages, push |
| `make deploy` | push your commits; GitHub builds and deploys |
| `make update` | re-run the workflow now (refresh papers + redeploy) |

Without `make`: `npm install`, `npm run dev`, `npm run build`, `npm run fetch:papers`.

## Publish on GitHub Pages

```bash
gh auth login                      # once
make github REPO=my-group            # VISIBILITY=private needs a paid GitHub plan for Pages
```

The site goes live at `https://<user>.github.io/my-group/` a minute or two later (`gh run watch`).
After that, edit, commit and `make deploy`. Papers also refresh every day at 03:00 UTC.

## Where things live

**Everything that changes lives in Markdown files, one file per item.** The file name is the id
and the URL (`liding-xu.md` becomes `/people/liding-xu`). At build time Astro turns them into pages.

| What | File | URL |
|---|---|---|
| Member (profile + bio) | `src/content/members/<firstname-lastname>.md` | `/people/<id>` |
| Research area | `src/content/areas/<topic>.md` | `/research/areas/<id>` |
| Research project | `src/content/projects/<topic>.md` | `/research/projects/<id>` |
| Position ("Join us") | `src/content/positions/<kind>/<lang>.md` | `/join` |
| Software | `src/content/software/<name>.md` | `/software/<id>` |
| News | `src/content/news/<yyyy-mm-slug>.md` | `/news/<id>` |
| Group name, about text, address, email, nav | `src/site.config.ts` | |
| Interface translations (menu, buttons, headings) | `src/i18n/ui.ts` | |
| Page layouts | `src/views/*.astro` | |
| Papers not on arXiv | `src/data/manual_publications.yaml` | |
| Generated paper list (don't edit by hand) | `src/data/publications.json` | |
| Member photos | `public/images/people/` | `photo: /images/people/x.jpg` |
| Colours / fonts | `src/styles/global.css` (`:root` variables) | |

**Create a new file from a template** (the file name is generated from the name):

```bash
make new TYPE=member   NAME="Jane Doe"          # src/content/members/jane-doe.md
make new TYPE=project  NAME="Neural Solvers"    # src/content/projects/neural-solvers.md
make new TYPE=area     NAME="Formal Methods"
make new TYPE=position NAME="Master thesis"     # src/content/positions/master-thesis/{en,zh-hans,zh-hant}.md
make new TYPE=news     NAME="Best paper award"  # src/content/news/2026-11-best-paper-award.md
make new TYPE=software NAME="MyOpt"
```

**Links between files use file names and are checked at build time.** A project's
`area: mathematical-optimization` and `members: [liding-xu]` must match existing files in
`areas/` and `members/`; a typo stops the build with a clear message instead of a broken link.

**Naming rules:** lower-case ASCII with hyphens; members `firstname-lastname`; news start with
`yyyy-mm-`; positions are folders named after the kind (`phd`, `postdoc`, ...). Order inside a
list is set by an `order:` number (smaller first), never by the file name.

The members, projects and positions shipped here may be placeholders. Replace them with your own.

## How papers are found

Each member file has optional `arxiv:` and `openalex:` blocks in its frontmatter (`src/content/members/<id>.md`):

```yaml
---
name: Jane Doe
aliases: ["J. Doe"]          # bold + link the name in author lists
role: phd
arxiv:
  author_id: doe_j_1         # best: arXiv author ID, see https://arxiv.org/a/
  # orcid: 0000-0000-0000-0000   # or the ORCID linked to their arXiv account
  ids: ["2401.01234"]        # extra papers
  # query: 'au:"Jane Doe" AND cat:math.OC'   # text search, may hit namesakes
  exclude: ["2301.99999"]    # drop wrong matches (arXiv ID, DOI or OpenAlex W-ID)
openalex:
  orcid: 0000-0000-0000-0000 # journal/conference papers, books, chapters
  since: 2018                # optional
---
```

`author_id`/`orcid` use arXiv's author feed, so they only return papers the person has
**claimed on arXiv**. They never pick up namesakes. `query` is a text search and does.

The script collects papers per member and merges them:

- **OpenAlex** works that have an arXiv version are combined with the arXiv entry. The
  arXiv metadata is used, plus the published venue and DOI from OpenAlex.
- OpenAlex works with no arXiv version (journal papers, books, chapters) become their own
  entries. Duplicates are removed by title.
- Papers shared by several members appear once, and manual papers are merged in last.
- If a source fails for a member, that member's previously fetched papers are kept.

OpenAlex works without a key, but anonymous use shares a small daily budget per IP. For
reliable daily runs, get a free key at <https://openalex.org/settings/api> and add it as the
repository secret `OPENALEX_API_KEY` (locally: `export OPENALEX_API_KEY=...`).

OpenAlex sometimes lists every chapter of a book, or an abstract, as a separate work. Use
`exclude` with the W-ID or DOI to hide these.

## Languages

The interface is available in **English** (`/`), **简体中文** (`/zh-hans/`) and **繁體中文** (Hong Kong usage,
`/zh-hant/`), with a language switcher in the top bar. Only interface text is
translated. Papers, projects, news, job posts and member profiles look the same in every language.

- **Interface text** (menu, buttons, headings, labels): `src/i18n/ui.ts`, one dictionary per
  language. Use it in a page or component with:
  ```astro
  ---
  import { useI18n } from '../i18n';
  const { t, l, intl } = useI18n(Astro);   // t = translate, l = localized link, intl = date locale
  ---
  <a href={l('/people')}>{t('nav.people')}</a>
  ```
- **Group texts** (name, tagline, institution, About paragraphs, research areas): `translations`
  in `src/site.config.ts`. Anything left out falls back to English.
- **Dates and times** are formatted per language automatically.
- **Adding a language:** add it to `langs`, `meta` and `ui` in `src/i18n/ui.ts` and to
  `i18n.locales` in `astro.config.mjs`. Missing keys fall back to English.
- **Adding a page:** create it in `src/views/` and register it in `src/pages/[...path].astro`.
  It is then built in every language.

## Research areas and projects

Research is organised as **areas** (`src/content/areas/*.md`: `title`, `summary`, `order`,
optional `topics: [..]` (sub-topics shown under the title), optional `i18n: { zh-hans: {title, summary}, zh-hant: {...} }`, Markdown
body) and **projects** (`src/content/projects/*.md`, with `area: <area-file-name>`). Areas live
at `/research/areas/<id>`, projects at `/research/projects/<id>`; the Research page lists
the areas, then all projects (labelled with their area), then `active: false` ones under
"Past projects".

## Positions ("Join our group!")

One folder per position in `src/content/positions/`, one Markdown file per language:

```
src/content/positions/phd/en.md        # settings + English text (required)
src/content/positions/phd/zh-hans.md   # optional translation, falls back to English
src/content/positions/phd/zh-hant.md
```

`en.md` holds the settings; the Markdown body is the position text (use `##` headings):

```yaml
---
title: PhD theses at PolyU
kind: PhD            # PhD | Postdoc | Master | Research Assistant | Intern | Other
summary: One sentence.
open: false          # true = actively recruiting: shows "Open", the deadline and an Apply button
order: 1             # smaller first
deadline: 2027-01-31 # omit for "open until filled"; passed deadlines switch "open" off
start: Flexible
location: PolyU
apply: someone@example.org   # URL or email, defaults to the group email
---
```

Translated files need only `title` (optionally `summary`, `start`, `location`) and the translated body.
All positions are listed as foldable entries on `/join`. The page intro, "What we look for" and
the application steps are in `join` in `src/site.config.ts` (Chinese under `translations`). Contact
details (institution, address, email) are in the footer of every page.

## How deployment works

`make github` does three things: creates the repo, sets **Settings → Pages → Source** to
**GitHub Actions**, and pushes. You can also do these by hand.
`.github/workflows/site.yml` runs on every push to `main`, daily at 03:00 UTC, and on demand.
   Each run fetches papers, commits `publications.json` if it changed, builds and deploys.

The base path for project sites (`user.github.io/repo`) is set automatically.
Each build also writes `sitemap-index.xml` / `sitemap-0.xml` (all pages, with links between
the language versions) and a `robots.txt` that points search engines at the sitemap. Set the real
domain via `SITE` (done automatically on GitHub Pages) so the sitemap URLs are correct.
For a custom domain, add `public/CNAME`. For other hosts (Cloudflare Pages, Netlify, a
university server), run `npm run build` and serve `dist/`.

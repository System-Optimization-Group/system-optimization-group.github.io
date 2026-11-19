# Instructions for agents editing this site

Static research-group website: Astro (site) + Python (paper fetcher) + GitHub Actions (daily refresh and deploy).
Read `README.md` for install and deploy. This file says **what to edit for which request** and what not to break.

## Ground rules

1. Make the smallest change that does the job. Edit content files before code.
2. Everything the user sees exists in **three languages**: English (`en`), Simplified Chinese (`zh-hans`), Traditional Chinese for Hong Kong (`zh-hant`). Never add an English-only interface string.
3. After every change run `npx astro build`. It must end with `Complete!` and no errors.
4. Never hand-edit `src/data/publications.json` (generated). Never commit `dist/`, `node_modules/`, `.venv/`.
5. Do not commit, push or deploy unless the user asks. Publishing is `make github` (first time) or `make deploy`.
6. Never invent people, papers, emails or affiliations. Take facts from the user or from a page they point to. Mark anything unverified as a placeholder.

## Where things live

| Request | Edit |
|---|---|
| Group name, tagline, about text, address, email, nav | `src/site.config.ts` (`site`, plus Chinese in `site.translations`) |
| "Join us" page text (intro, what we look for, documents) | `join` in `src/site.config.ts`, English and both Chinese `translations` |
| Menu, button, heading, label text | `src/i18n/ui.ts` (one dictionary per language) |
| A member (profile, bio, how to find papers) | `src/content/members/<firstname-lastname>.md` |
| Which People sections show when empty | `alwaysShowRoles` in `src/site.config.ts` |
| Research area | `src/content/areas/<id>.md` |
| Research project | `src/content/projects/<id>.md` (set `area: <area-id>`) |
| Software | `src/content/software/<id>.md` |
| News post | `src/content/news/<yyyy-mm-slug>.md` |
| Position ("Join us") | `src/content/positions/<kind>/{en,zh-hans,zh-hant}.md` |
| Papers not on arXiv/OpenAlex | `src/data/manual_publications.yaml` |
| Member photo | file in `public/images/people/` (resize to about 600px, under 150 KB), then `photo: /images/people/<file>` |
| Colours, fonts, spacing | `src/styles/global.css` (`:root` variables; Chinese typography block) |
| Page layout | `src/views/*.astro`; routes are in `src/pages/[...path].astro` |

## Recipes

**Create content with the scaffold, then fill it in:** `make new TYPE=member|project|area|position|news|software NAME="..."`. It writes a commented template under `src/content/` with the right file name. Prefer it over copying a file by hand.

**Add a member.** `make new TYPE=member NAME="Jane Doe"` creates `src/content/members/jane-doe.md`:
```yaml
---
name: Jane Doe
aliases: ["J. Doe"]       # spellings used on papers
role: phd                 # pi | postdoc | phd | ra | master | staff | alumni
title: PhD Student
email: ...                # optional: photo, website, github, scholar, interests
openalex: { orcid: 0000-0000-0000-0000 }   # finds journal papers
arxiv: { ids: ["2401.01234"] }             # or author_id: <arXiv author id>
---
Optional bio in Markdown.
```
Then `make papers` (needs network, about 3 s per arXiv request) and rebuild. Wrong papers: add the arXiv ID, DOI or OpenAlex W-ID to `exclude:`. The file name is the member id used in project/software `members:` lists.

**Add a position.** `make new TYPE=position NAME="Master thesis"` creates `positions/master-thesis/{en,zh-hans,zh-hant}.md`. `en.md` holds `kind`, `open`, `order`, `deadline`, `apply`; every file has its own `title` and Markdown body. A language without a file falls back to English.

**Add a research area.** New file `src/content/areas/<id>.md`:
```yaml
---
title: Mathematical Optimization
summary: One sentence.
order: 1                       # sort order
topics: [Topic A, Topic B]     # optional sub-topics shown under the title
i18n:
  zh-hans: { title: 数学优化, summary: ..., topics: [...] }
  zh-hant: { title: 數學優化, summary: ..., topics: [...] }
---
Markdown body shown on /research/areas/<id>.
```

**Add a project.** New file `src/content/projects/<id>.md` with `title`, `summary`, `area` (an area file name), `tags`, `members` (member file names), optional `code`, `link`, `order`, `active: false` for past projects. Project text is not translated.

**Add or change interface text.** Add the key to the English dictionary in `src/i18n/ui.ts` first (it defines the key type), then add it to `zhHans` and `zhHant`. A missing Chinese key does not fail the build; the page silently falls back to English, so check every key exists in all three dictionaries.

**Add a page.** Create `src/views/<Name>.astro` using `useI18n(Astro)` (`t` translate, `l` localized link), register it in `src/pages/[...path].astro`. It builds in every language automatically. Add a nav entry in `site.nav` if it belongs in the menu.

**Add a language.** `langs`, `meta`, `ui` in `src/i18n/ui.ts`, and `i18n.locales` plus the sitemap `locales` in `astro.config.mjs`.

## Conventions

- Content ids are file names: lower-case ASCII, hyphens, no spaces. Members `firstname-lastname`, news `yyyy-mm-slug`, positions are folders. `area:` and `members:` are checked at build time (`reference()`), so a wrong id fails the build.

- Internal links: always `l('/path')` (adds language prefix and deploy base path). Never hard-code `/zh-hans/...`.
- Hong Kong usage for Traditional Chinese (電郵, 軟件, 項目, 數據, 優化), not Taiwan usage. Simplified Chinese uses mainland usage.
- Chinese text uses full-width punctuation. Do not add `text-transform` or italics to CJK.
- Dates go through `src/lib/dates.ts` (per-language format, UTC wall-clock).
- Layout must work at 360 px width. No fixed widths, no horizontal scrolling. Tap targets at least 40 px.
- Colours only via the CSS variables, so dark mode keeps working.
- Spelling: American English in UI text ("Compiler", "Optimization").
- Roles are labelled in `ui.ts` as `role.<id>`. "Research Assistants" is the label for `ra`.

## Verify before reporting done

```bash
npx astro build                                  # must say Complete!
npx astro dev stop; npx astro dev --port 4321 --host 127.0.0.1   # serve http://127.0.0.1:4321
```
Check the changed page in all three languages (`/…`, `/zh-hans/…`, `/zh-hant/…`) and at phone width.
Dev-server gotchas: after adding a new **content file or collection**, stop the server, delete `.astro/data-store.json` and `node_modules/.astro/data-store.json`, and start it again, otherwise the page shows stale content. Do not use `pkill -f` patterns that match your own shell.

## Out of scope without asking

Changing the deploy workflow (`.github/workflows/site.yml`), the repo name or visibility, adding dependencies, removing a language, or deleting content the user did not mention.

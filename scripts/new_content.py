#!/usr/bin/env python3
"""Create a new content file from a template: make new TYPE=member NAME="Jane Doe"

TYPE: member | project | area | position | news | software
File names are the ids and the URLs (kebab-case ASCII; news get a YYYY-MM prefix)."""
import argparse, re, sys, unicodedata
from datetime import date
from pathlib import Path

C = Path(__file__).resolve().parent.parent / "src/content"


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


MEMBER = """---
name: {name}
aliases: []            # other spellings on papers, e.g. ["J. Doe"]
role: phd              # pi | postdoc | phd | ra | master | staff | alumni
title: PhD Student     # alumni: e.g. "PhD 2025, now at Example Corp"
# photo: /images/people/{id}.jpg     (resize to ~600 px)
# email:
# website:
# github:
# scholar:
interests: []
# How papers are found (see README "How papers are found"); run `make papers` afterwards.
# openalex: {{ orcid: 0000-0000-0000-0000 }}
# arxiv: {{ author_id: doe_j_1, ids: [], exclude: [] }}
---

Optional short bio in Markdown.
"""
PROJECT = """---
title: {name}
summary: One sentence.
area: mathematical-optimization   # file name in src/content/areas/
tags: []
members: []                        # file names in src/content/members/
# code: https://github.com/...
# link: https://...
order: 100
active: true
---

Describe the project in Markdown: goals, results, related papers, funding.
"""
AREA = """---
title: {name}
summary: One sentence.
order: 100
topics: []
# i18n:                       # optional translations of title / summary / topics
#   zh-hans: {{ title: ..., summary: ..., topics: [...] }}
#   zh-hant: {{ title: ..., summary: ..., topics: [...] }}
---

Describe the research area in Markdown.
"""
NEWS = """---
title: {name}
date: {today}
tag: News            # News | Award | Paper | Talk | Event
summary: One sentence.
---

Text in Markdown.
"""
SOFTWARE = """---
name: {name}
summary: One sentence.
repo: https://github.com/...
# docs:
# install: pip install ...
# language:
# license:
tags: []
members: []          # file names in src/content/members/
papers: []           # arXiv ids or DOIs of related papers
order: 100
---

Describe the software in Markdown.
"""
POSITION_EN = """---
title: {name}
kind: PhD            # PhD | Postdoc | Master | Research Assistant | Intern | Other
summary: One sentence.
open: false          # true = actively recruiting (shows "Open", deadline and Apply button)
order: 100
# deadline: 2027-01-31
start: Flexible
# location:
# apply: someone@example.org
---

## What does this cover?

## What are the requirements?

## What to include?

## Funding and support
"""
POSITION_TR = """---
title: {name}
# summary:
# start:
# location:
---

(translated body; delete this file to fall back to English)
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("type", choices=["member", "project", "area", "position", "news", "software"])
    ap.add_argument("name", help='e.g. "Jane Doe"')
    a = ap.parse_args()
    ident = slug(a.name)
    if not ident:
        sys.exit("NAME must contain letters or digits")
    ctx = dict(name=a.name, id=ident, today=date.today().isoformat())
    files: dict[Path, str] = {}
    if a.type == "member":
        files[C / "members" / f"{ident}.md"] = MEMBER
    elif a.type == "project":
        files[C / "projects" / f"{ident}.md"] = PROJECT
    elif a.type == "area":
        files[C / "areas" / f"{ident}.md"] = AREA
    elif a.type == "software":
        files[C / "software" / f"{ident}.md"] = SOFTWARE
    elif a.type == "news":
        files[C / "news" / f"{date.today():%Y-%m}-{ident}.md"] = NEWS
    else:
        for lang, tpl in (("en", POSITION_EN), ("zh-hans", POSITION_TR), ("zh-hant", POSITION_TR)):
            files[C / "positions" / ident / f"{lang}.md"] = tpl
    for f in files:
        if f.exists():
            sys.exit(f"{f.relative_to(C.parent.parent)} already exists")
    for f, tpl in files.items():
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(tpl.format(**ctx), encoding="utf-8")
        print("created", f.relative_to(C.parent.parent))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Fetch group members' papers from arXiv and OpenAlex into src/data/publications.json.

Per member in src/content/members/<id>.md frontmatter (all optional):

  arxiv:
    author_id   arXiv author identifier, e.g. "pokutta_s_1"   (arxiv.org/a/<id>)
    orcid       ORCID linked to an arXiv account              (arxiv.org/a/<orcid>)
    ids         explicit arXiv IDs
    query       raw arXiv search, e.g. 'au:"Jane Doe" AND cat:math.OC'
                (text match, can pick up namesakes - combine with exclude)

  openalex:
    orcid       ORCID - finds journal / conference papers, books, ...
    author_id   OpenAlex author ID (e.g. A5023888391), alternative to orcid
    since       only works published in or after this year

  exclude may go in either block and applies to both sources: arXiv IDs,
  DOIs or OpenAlex work IDs (W...). Excluding a published version by DOI
  also drops its arXiv preprint.

How the sources are merged:
  * OpenAlex works that have an arXiv version are added to the member's arXiv
    papers (arXiv metadata is used), and the published venue + DOI from
    OpenAlex are attached to them.
  * OpenAlex works without an arXiv version become their own entries,
    deduplicated by title against everything else.
  * src/data/manual_publications.yaml is merged in last.
If a source fails for a member, that member's previously fetched papers are kept.

Environment (optional): OPENALEX_API_KEY (free key, https://openalex.org/settings/api),
OPENALEX_MAILTO (contact address sent to OpenAlex).

Only needs PyYAML. Usage: python3 scripts/fetch_publications.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
MEMBERS = ROOT / "src/content/members"      # one <id>.md per member; frontmatter holds arxiv/openalex
MANUAL = ROOT / "src/data/manual_publications.yaml"
OUT = ROOT / "src/data/publications.json"

ARXIV_API = "https://export.arxiv.org/api/query"
ARXIV_AUTHOR_FEED = "https://arxiv.org/a/{}.atom2"
OPENALEX_API = "https://api.openalex.org/works"
NS = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
UA = "group-site-publication-fetcher/1.1"
ARXIV_BATCH = 100
ARXIV_QUERY_MAX = 200

# OpenAlex work types that are not real publications of the member.
SKIP_TYPES = {"paratext", "erratum", "retraction", "peer-review", "editorial", "letter",
              "dataset", "libguides", "supplementary-materials", "standard", "grant", "other"}

_last: dict[str, float] = {}


def get(url: str, host: str, delay: float, retries: int = 3) -> bytes:
    """GET with per-host spacing (arXiv asks for >= 3 s between requests)."""
    for attempt in range(1, retries + 1):
        wait = delay - (time.monotonic() - _last.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        _last[host] = time.monotonic()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print(f"  ! {e} ({attempt}/{retries}) {url}", file=sys.stderr)
            time.sleep(delay * attempt * 2 + 1)
    raise RuntimeError(f"giving up on {url}")


def clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]", "", title.lower())


def base_id(raw: str) -> str:
    """'http://arxiv.org/abs/2104.13734v2' -> '2104.13734'; keeps old-style 'math/0601001'."""
    raw = raw.strip()
    raw = re.sub(r"^https?://(export\.)?arxiv\.org/(abs|pdf)/", "", raw)
    raw = re.sub(r"\.pdf$", "", raw)
    raw = re.sub(r"^arXiv:", "", raw, flags=re.I)
    return re.sub(r"v\d+$", "", raw)


def bare_doi(doi: str | None) -> str | None:
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", doi).lower() if doi else None


def exclude_key(s: str) -> str:
    """Normalise an OpenAlex exclude entry: work ID -> 'w123', DOI -> bare DOI, else arXiv ID."""
    s = s.strip()
    if re.fullmatch(r"(https://openalex\.org/)?W\d+", s, re.I):
        return s.rsplit("/", 1)[-1].lower()
    if re.match(r"(https?://(dx\.)?doi\.org/)?10\.\d+/", s, re.I):
        return bare_doi(s)
    return base_id(s)


# ---------------------------------------------------------------- arXiv

def arxiv_get(url: str) -> ET.Element:
    return ET.fromstring(get(url, "arxiv", 3.0))


def arxiv_ids_from_feed(ident: str) -> list[str]:
    root = arxiv_get(ARXIV_AUTHOR_FEED.format(urllib.parse.quote(ident)))
    return [base_id(e.findtext("a:id", "", NS)) for e in root.findall("a:entry", NS)]


def arxiv_ids_from_query(query: str) -> list[str]:
    params = {"search_query": query, "start": 0, "max_results": ARXIV_QUERY_MAX,
              "sortBy": "submittedDate", "sortOrder": "descending"}
    root = arxiv_get(f"{ARXIV_API}?{urllib.parse.urlencode(params)}")
    return [base_id(e.findtext("a:id", "", NS)) for e in root.findall("a:entry", NS)]


def arxiv_metadata(ids: list[str]) -> dict[str, dict]:
    papers: dict[str, dict] = {}
    for i in range(0, len(ids), ARXIV_BATCH):
        chunk = ids[i:i + ARXIV_BATCH]
        root = arxiv_get(f"{ARXIV_API}?{urllib.parse.urlencode({'id_list': ','.join(chunk), 'max_results': len(chunk)})}")
        for e in root.findall("a:entry", NS):
            aid = base_id(e.findtext("a:id", "", NS))
            if not aid or e.findtext("a:title", None, NS) is None:
                continue  # unknown id -> arXiv returns an error entry
            primary = e.find("arxiv:primary_category", NS)
            papers[aid] = {
                "id": aid,
                "title": clean(e.findtext("a:title", "", NS)),
                "authors": [clean(a.findtext("a:name", "", NS)) for a in e.findall("a:author", NS)],
                "abstract": clean(e.findtext("a:summary", "", NS)),
                "published": e.findtext("a:published", "", NS)[:10],
                "primary_category": primary.get("term") if primary is not None else None,
                "journal_ref": clean(e.findtext("arxiv:journal_ref", None, NS)) or None,
                "doi": clean(e.findtext("arxiv:doi", None, NS)) or None,
                "url": f"https://arxiv.org/abs/{aid}",
                "pdf": f"https://arxiv.org/pdf/{aid}",
                "arxiv_id": aid,
                "source": "arxiv",
            }
        print(f"  arXiv metadata {min(i + ARXIV_BATCH, len(ids))}/{len(ids)}")
    return papers


# ------------------------------------------------------------- OpenAlex

def openalex_works(cfg: dict) -> list[dict]:
    if cfg.get("orcid"):
        flt = f"author.orcid:{cfg['orcid']}"
    elif cfg.get("author_id"):
        flt = f"author.id:{cfg['author_id']}"
    else:
        return []
    if cfg.get("since"):
        flt += f",from_publication_date:{int(cfg['since'])}-01-01"
    params = {"filter": flt, "per-page": 200, "cursor": "*",
              "select": "id,doi,title,type,publication_date,primary_location,locations,"
                        "best_oa_location,authorships,abstract_inverted_index"}
    if os.environ.get("OPENALEX_API_KEY"):
        params["api_key"] = os.environ["OPENALEX_API_KEY"]
    if os.environ.get("OPENALEX_MAILTO"):
        params["mailto"] = os.environ["OPENALEX_MAILTO"]
    works = []
    while params["cursor"]:
        data = json.loads(get(f"{OPENALEX_API}?{urllib.parse.urlencode(params)}", "openalex", 0.2))
        works += data["results"]
        params["cursor"] = data["meta"].get("next_cursor")
    return works


def openalex_arxiv_id(w: dict) -> str | None:
    for loc in w.get("locations") or []:
        url = loc.get("landing_page_url") or ""
        m = re.search(r"arxiv\.org/(?:abs|pdf)/([^\s?#]+)", url) or \
            re.search(r"10\.48550/arxiv\.(.+)$", url, re.I)
        if m:
            return base_id(m.group(1))
    m = re.search(r"10\.48550/arxiv\.(.+)$", w.get("doi") or "", re.I)
    return base_id(m.group(1)) if m else None


def openalex_venue(w: dict) -> tuple[str | None, str | None]:
    """(venue name, DOI) of the published, non-repository version, if any."""
    locs = [w.get("primary_location") or {}] + (w.get("locations") or [])
    for loc in locs:
        src = loc.get("source") or {}
        if src.get("type") in ("journal", "conference", "book series", "ebook platform"):
            doi = bare_doi(w.get("doi"))
            return src.get("display_name"), (doi if doi and "10.48550/" not in doi else None)
    return None, None


def openalex_abstract(inv: dict | None) -> str | None:
    if not inv:
        return None
    words = sorted((pos, word) for word, positions in inv.items() for pos in positions)
    return " ".join(w for _, w in words)


def openalex_paper(w: dict) -> dict:
    venue, doi = openalex_venue(w)
    best = w.get("best_oa_location") or {}
    return {
        "id": w["id"].rsplit("/", 1)[-1],
        "title": clean(w.get("title")),
        "authors": [clean((a.get("author") or {}).get("display_name")) for a in w.get("authorships") or []],
        "abstract": openalex_abstract(w.get("abstract_inverted_index")),
        "published": w.get("publication_date") or "",
        "venue": venue,
        "type": w.get("type"),
        "doi": doi,
        "url": w.get("doi") or (w.get("primary_location") or {}).get("landing_page_url") or w["id"],
        "pdf": best.get("pdf_url"),
        "source": "openalex",
    }


# ------------------------------------------------------------------ main

def load_members() -> list[dict]:
    """Read every src/content/members/<id>.md: the file name is the member id, the YAML
    frontmatter between the two '---' lines is the profile (the Markdown body is ignored)."""
    out = []
    for f in sorted(MEMBERS.glob("*.md")):
        parts = f.read_text(encoding="utf-8").split("---", 2)
        if len(parts) < 3:
            raise SystemExit(f"{f}: missing '---' frontmatter")
        out.append({**(yaml.safe_load(parts[1]) or {}), "id": f.stem})
    return out


def main() -> int:
    members = load_members()
    previous: dict[str, dict] = {}
    if OUT.exists():
        previous = {p["id"]: p for p in json.loads(OUT.read_text()).get("papers", [])}

    arxiv_owners: dict[str, set[str]] = {}       # arXiv id -> members
    published: dict[str, tuple[str, str | None]] = {}  # arXiv id -> (venue, doi) from OpenAlex
    oa_papers: dict[str, dict] = {}               # OpenAlex-only works
    failed: set[str] = set()

    for m in members:
        mid = m["id"]
        ax = m.get("arxiv") or {}
        oa = m.get("openalex") or {}
        # One exclusion list per member, applied to both sources.
        excl = {exclude_key(str(x)) for x in [*(ax.get("exclude") or []), *(oa.get("exclude") or [])]}
        found: list[str] = [base_id(str(x)) for x in ax.get("ids") or []]

        try:
            for key in ("author_id", "orcid"):
                if ax.get(key):
                    found += arxiv_ids_from_feed(ax[key])
            if ax.get("query"):
                found += arxiv_ids_from_query(ax["query"])
        except Exception as e:  # noqa: BLE001
            failed.add(mid)
            print(f"  ! {mid}: arXiv failed ({e}); keeping previous papers", file=sys.stderr)

        n_oa = 0
        try:
            for w in openalex_works(oa):
                if w.get("type") in SKIP_TYPES or not w.get("title"):
                    continue
                wid = w["id"].rsplit("/", 1)[-1].lower()
                aid = openalex_arxiv_id(w)
                if {wid, aid, bare_doi(w.get("doi"))} & excl:
                    if aid:
                        excl.add(aid)  # also drop the arXiv version
                    continue
                n_oa += 1
                if aid:
                    found.append(aid)
                    venue, doi = openalex_venue(w)
                    if venue:
                        published[aid] = (venue, doi)
                else:
                    p = oa_papers.setdefault(wid, {**openalex_paper(w), "members": set()})
                    p["members"].add(mid)
        except Exception as e:  # noqa: BLE001
            failed.add(mid)
            print(f"  ! {mid}: OpenAlex failed ({e}); keeping previous papers", file=sys.stderr)

        mine = set(found) - excl
        for aid in mine:
            arxiv_owners.setdefault(aid, set()).add(mid)
        if ax or oa:
            print(f"{mid}: {len(mine)} arXiv, {n_oa} OpenAlex works")

    # Members whose fetch failed keep what they had before.
    for pid, p in previous.items():
        lost = failed & set(p.get("members", []))
        if not lost or p.get("source") == "manual":
            continue
        if p.get("arxiv_id"):
            arxiv_owners.setdefault(p["arxiv_id"], set()).update(lost)
        else:
            q = oa_papers.setdefault(pid.lower(), {**p, "members": set()})
            q["members"].update(lost)

    meta = arxiv_metadata(sorted(arxiv_owners)) if arxiv_owners else {}
    papers: list[dict] = []
    by_title: dict[str, dict] = {}
    for aid, who in arxiv_owners.items():
        p = meta.get(aid) or previous.get(aid)
        if not p:
            continue
        p = {**p, "members": set(who)}
        if aid in published:
            venue, doi = published[aid]
            p["venue"] = venue
            p["doi"] = p.get("doi") or doi
        papers.append(p)
        by_title[title_key(p["title"])] = p

    # OpenAlex-only works: merge into an existing paper with the same title, if any.
    for p in sorted(oa_papers.values(), key=lambda p: (p.get("venue") is None, p["published"])):
        twin = by_title.get(title_key(p["title"]))
        if twin:
            twin["members"] |= p["members"]
            twin["venue"] = twin.get("venue") or p.get("venue")
            twin["doi"] = twin.get("doi") or p.get("doi")
        else:
            papers.append(p)
            by_title[title_key(p["title"])] = p

    for p in (yaml.safe_load(MANUAL.read_text()) if MANUAL.exists() else None) or []:
        p = {**p, "source": "manual", "published": str(p.get("published", "")),
             "members": set(p.get("members") or [])}
        twin = by_title.get(title_key(p["title"]))
        if twin:
            twin["members"] |= p["members"]
        else:
            papers.append(p)

    for p in papers:
        p["members"] = sorted(p["members"])
    papers.sort(key=lambda p: (p.get("published", ""), p["id"]), reverse=True)

    if OUT.exists() and json.loads(OUT.read_text()).get("papers") == papers:
        print("No changes.")
        return 0
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                               "papers": papers}, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(papers)} papers to {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

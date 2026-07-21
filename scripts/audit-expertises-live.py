#!/usr/bin/env python3
"""
Maintenance expertises : snapshot Markdown live + deep-check contenu.

CE N'EST PAS UNE GARDE. Il s'appelait `check-expertises-live.py`, ce que son
préfixe faisait passer pour un test : il sort **toujours 0**, même quand son
rapport compte des erreurs, et `--fix` **réécrit** `contenu/expertises/*.json`.
Il a aussi besoin du réseau (il aspire le site live). Renommé en `audit-` pour
que le nom dise ce qu'il fait. Les vraies gardes sont listées dans
`docs/guides/gardes.md` ; elles sont en lecture seule et sortent non nul.

Usage :
  python3 scripts/audit-expertises-live.py              # fetch MD + rapport
  python3 scripts/audit-expertises-live.py --fix        # nettoie junk + refresh liens
  python3 scripts/audit-expertises-live.py --slug divorce
  python3 scripts/audit-expertises-live.py --skip-fetch # check seul (MD déjà là)

Sorties :
  contenu/sources/live-md/expertises/{slug}.md
  contenu/reference/expertise-health-report.json
"""
from __future__ import annotations

import argparse
import html as htmlmod
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlparse

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[1]
EXP_DIR = ROOT / "contenu" / "expertises"
MD_DIR = ROOT / "contenu" / "sources" / "live-md" / "expertises"
ARTICLES_DIR = ROOT / "contenu" / "articles"
REPORT_PATH = ROOT / "contenu" / "reference" / "expertise-health-report.json"
BASE = "https://www.jplouton-avocat.fr"

NAV_LINK_RE = re.compile(
    r"^(DÉFENSE|INDEMNISATION|DROIT DES|Affaires|Médias|Ressources|Équipe|"
    r"Contact|Prendre|Appeler|Menu|Accueil|Notre cabinet|Mentions|"
    r"Je prends|FAQ|Nos affaires|Premiers|Je fais|Accompagn|Vos proches|"
    r"Exemples|Indemnisation par|Lire|En voir|Close|Search|RDV|"
    r"Pôle —|Horaires|Honoraires|Read More|Découvrir l)",
    re.I,
)


def fetch(url: str) -> str:
    return subprocess.check_output(
        ["curl", "-skL", "-A", "PloutonMaintenance/1.0", url],
        text=True,
        errors="ignore",
    )


def slugify(text: str) -> str:
    t = unicodedata.normalize("NFKD", text)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:80] or "section"


def normalize_space(text: str) -> str:
    text = htmlmod.unescape(text or "")
    text = text.replace("\u200b", "").replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_expertise_files(only: str | None = None) -> list[Path]:
    files = sorted(EXP_DIR.glob("*.json"))
    if only:
        files = [f for f in files if f.stem == only]
    return files


def resolve_post_href(href: str) -> str | None:
    if not href.startswith("/post/"):
        return href
    slug = unquote(href[len("/post/") :]).rstrip("/")
    if (ARTICLES_DIR / f"{slug}.json").exists():
        return f"/post/{slug}"
    hits = [p.stem for p in ARTICLES_DIR.glob("*.json") if p.stem.startswith(slug.rstrip("-"))]
    if not hits:
        parts = slug.rsplit("-", 1)[0]
        hits = [p.stem for p in ARTICLES_DIR.glob("*.json") if p.stem.startswith(parts)]
    if hits:
        hits.sort(key=lambda s: abs(len(s) - len(slug)))
        return f"/post/{hits[0]}"
    return None


def normalize_href(raw: str) -> str | None:
    href = htmlmod.unescape(raw).split("?")[0].split("#")[0]
    if href.startswith("http"):
        u = urlparse(href)
        if "jplouton-avocat.fr" not in u.netloc:
            return None
        path = unquote(u.path)
    elif href.startswith("/"):
        path = unquote(href)
    else:
        return None
    if path.startswith("/post/"):
        return resolve_post_href(path)
    return path


# ── HTML → Markdown (corps éditorial) ─────────────────────────────────────────


def inline_md(node: Tag | NavigableString) -> str:
    if isinstance(node, NavigableString):
        return str(node)
    if not isinstance(node, Tag):
        return ""
    name = node.name.lower()
    if name == "br":
        return "\n"
    if name == "a":
        href = node.get("href") or ""
        text = normalize_space(node.get_text(" ", strip=True))
        path = normalize_href(href)
        if text and path:
            return f"[{text}]({BASE}{path})"
        return text
    if name in {"strong", "b"}:
        inner = "".join(inline_md(c) for c in node.children)
        return f"**{inner}**" if inner.strip() else inner
    if name in {"em", "i"}:
        inner = "".join(inline_md(c) for c in node.children)
        return f"*{inner}*" if inner.strip() else inner
    return "".join(inline_md(c) for c in node.children)


def block_md(node: Tag) -> str:
    name = node.name.lower()
    if name in {"script", "style", "noscript", "svg", "form", "nav", "header", "footer"}:
        return ""
    if name in {"h1", "h2", "h3", "h4"}:
        level = int(name[1])
        text = normalize_space("".join(inline_md(c) for c in node.children))
        return f"{'#' * level} {text}" if text else ""
    if name == "p":
        text = normalize_space("".join(inline_md(c) for c in node.children))
        return text
    if name in {"ul", "ol"}:
        lines = []
        items = node.find_all("li", recursive=False) or node.find_all("li")
        for i, li in enumerate(items, 1):
            text = normalize_space("".join(inline_md(c) for c in li.children))
            if not text:
                continue
            prefix = f"{i}." if name == "ol" else "-"
            lines.append(f"{prefix} {text}")
        return "\n".join(lines)
    if name == "li":
        text = normalize_space("".join(inline_md(c) for c in node.children))
        return f"- {text}" if text else ""
    # generic container
    parts = []
    for child in node.children:
        if isinstance(child, Tag):
            chunk = block_md(child)
            if chunk:
                parts.append(chunk)
        elif isinstance(child, NavigableString):
            t = str(child).strip()
            if t:
                parts.append(t)
    return "\n\n".join(parts)


def html_to_markdown(html: str, page_path: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    title = normalize_space(soup.title.string) if soup.title and soup.title.string else ""
    main = soup.find("main") or soup.body
    if not main:
        return f"# {title}\n\n_(pas de contenu)_\n"

    # Drop obvious chrome inside main
    for sel in ["nav", "header", "footer", "form", "script", "style"]:
        for el in main.find_all(sel):
            el.decompose()

    body = block_md(main)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    lines = [f"# {title}" if title else f"# {page_path}", "", f"Source: {BASE}{page_path}", "", body, ""]
    return "\n".join(lines)


def extract_live_structure(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main") or soup.body
    h1 = normalize_space(main.find("h1").get_text(" ", strip=True)) if main and main.find("h1") else ""
    h2s = []
    h3s = []
    if main:
        for h in main.find_all(["h2", "h3"]):
            t = normalize_space(h.get_text(" ", strip=True))
            if not t or len(t) < 3:
                continue
            if h.name == "h2":
                h2s.append(t)
            else:
                h3s.append(t)

    links = []
    seen = set()
    for a in (main or soup).find_all("a", href=True):
        text = normalize_space(a.get_text(" ", strip=True))
        if not text or len(text) < 2 or len(text) > 100:
            continue
        if NAV_LINK_RE.match(text):
            continue
        path = normalize_href(a["href"])
        if not path:
            continue
        if not (
            path.startswith("/post/")
            or path.startswith("/defense-penale")
            or path.startswith("/indemnisation")
            or path.startswith("/droit-des-contrats")
            or path.startswith("/comprendre")
            or path.startswith("/notre-cabinet")
            or path.startswith("/honoraires")
        ):
            continue
        key = text.lower()
        if key in seen:
            continue
        # Prefer editorial phrases (lowercase start, or known keywords, or /post/)
        keep = (
            path.startswith("/post/")
            or text[:1].islower()
            or any(
                k in text.lower()
                for k in (
                    "loi",
                    "expertise",
                    "itt",
                    "pretium",
                    "badinter",
                    "constat",
                    "ordonnance",
                    "guide",
                    "en savoir",
                    "découvrez",
                    "civi",
                    "garde à vue",
                    "avocat",
                )
            )
        )
        if not keep:
            continue
        seen.add(key)
        links.append({"text": text, "href": path})

    return {"h1": h1, "h2": h2s, "h3": h3s, "links": links}


# ── Deep-check ────────────────────────────────────────────────────────────────


def is_junk_text(text: str) -> bool:
    t = normalize_space(text)
    if not t:
        return True
    if re.fullmatch(r"\d+", t):
        return True
    if t in {"​", "-", "•"}:
        return True
    return False


def md_section_body(md: str, title: str) -> str:
    """Texte sous un ## title jusqu'au prochain ## (hors junk $ / /$)."""
    if not title:
        return ""
    lines = md.splitlines()
    start = None
    needle = normalize_space(title).lower()
    for i, line in enumerate(lines):
        if line.startswith("## ") and normalize_space(line[3:]).lower() == needle:
            start = i + 1
            break
    if start is None:
        return ""
    chunk: list[str] = []
    for line in lines[start:]:
        if line.startswith("## "):
            break
        if re.fullmatch(r"[/$\\s]*", line):
            continue
        chunk.append(line)
    return "\n".join(chunk).strip()


def check_expertise(data: dict, live: dict, md: str) -> dict:
    issues: list[dict] = []
    slug = data["slug"]

    # Title
    if live.get("h1") and data.get("title"):
        live_h1 = live["h1"]
        ours = data["title"]
        if normalize_space(live_h1).lower() != normalize_space(ours).lower():
            issues.append(
                {
                    "type": "title_mismatch",
                    "severity": "warn",
                    "live": live_h1,
                    "ours": ours,
                }
            )

    # Junk digits / empty sections
    for sec in data.get("sections") or []:
        if is_junk_text(sec.get("lead") or ""):
            if (sec.get("lead") or "").strip():
                issues.append(
                    {
                        "type": "junk_lead",
                        "severity": "error",
                        "section": sec.get("id"),
                        "value": sec.get("lead"),
                    }
                )
        for i, block in enumerate(sec.get("blocks") or []):
            body = block.get("body") or ""
            if is_junk_text(body) and body.strip():
                issues.append(
                    {
                        "type": "junk_block",
                        "severity": "error",
                        "section": sec.get("id"),
                        "index": i,
                        "value": body[:40],
                    }
                )
            # truncated scrape marker
            if re.search(r"comple\s*$|ses cl\s*$|pour les\s*$", body, re.I):
                issues.append(
                    {
                        "type": "truncated_text",
                        "severity": "warn",
                        "section": sec.get("id"),
                        "index": i,
                    }
                )
        if not (sec.get("blocks") or []) and not (sec.get("lead") or "").strip():
            # Ne pas alerter si le live est aussi vide (souvent un titre décoratif Wix)
            live_body = md_section_body(md, sec.get("title") or "")
            if live_body.strip():
                issues.append(
                    {
                        "type": "empty_section",
                        "severity": "warn",
                        "section": sec.get("id"),
                        "title": sec.get("title"),
                    }
                )

    # Section count vs live H2 (exclure FAQ / affaires / RDV / simulateurs = composants à part)
    live_h2 = [
        h
        for h in live.get("h2") or []
        if not re.search(
            r"foire aux questions|questions fréquentes|nos affaires|dernières affaires|"
            r"je prends rendez-vous|rendez-vous maintenant|je simule|je calcule",
            h,
            re.I,
        )
    ]
    ours_titles = [
        s.get("title") or ""
        for s in data.get("sections") or []
        if not re.search(
            r"foire aux questions|questions fréquentes|nos affaires|dernières affaires|"
            r"je prends rendez-vous|rendez-vous maintenant|je simule|je calcule",
            s.get("title") or "",
            re.I,
        )
    ]
    if live_h2 and abs(len(live_h2) - len(ours_titles)) >= 2:
        issues.append(
            {
                "type": "section_count_drift",
                "severity": "warn",
                "live_h2_count": len(live_h2),
                "ours_count": len(ours_titles),
                "live_h2": live_h2[:12],
            }
        )

    # titleAccent weirdness (accent longer than half title, or accent not in title)
    for sec in data.get("sections") or []:
        accent = sec.get("titleAccent") or ""
        title = sec.get("title") or ""
        if accent and title and accent not in title:
            issues.append(
                {
                    "type": "bad_title_accent",
                    "severity": "warn",
                    "section": sec.get("id"),
                    "accent": accent,
                    "title": title[:80],
                }
            )

    # Internal links
    live_links = live.get("links") or []
    ours_links = {l["text"].lower(): l["href"] for l in data.get("inlineLinks") or []}
    blob = json.dumps(data, ensure_ascii=False).lower()

    missing_in_map = []
    missing_in_text = []
    for link in live_links:
        text = link["text"]
        key = text.lower()
        if key not in ours_links:
            missing_in_map.append(link)
        # phrase should appear in content to be linkifiable
        elif key not in blob and key.rstrip(".") not in blob:
            # still ok if partial
            pass
        # check phrase exists in body for linkify
        if key not in blob and key.rstrip(".").lower() not in blob:
            # only flag if it's a content phrase that should appear
            if len(text) >= 4 and text[:1].islower() or any(
                k in key for k in ("loi", "itt", "pretium", "badinter", "expertise", "civi")
            ):
                if key not in blob:
                    missing_in_text.append(link)

    for link in missing_in_map:
        issues.append(
            {
                "type": "missing_inline_link",
                "severity": "error",
                "text": link["text"],
                "href": link["href"],
            }
        )

    # Broken our links (post not found)
    for link in data.get("inlineLinks") or []:
        href = link.get("href") or ""
        if href.startswith("/post/"):
            post_slug = unquote(href[6:])
            if not (ARTICLES_DIR / f"{post_slug}.json").exists():
                issues.append(
                    {
                        "type": "broken_post_link",
                        "severity": "error",
                        "text": link.get("text"),
                        "href": href,
                    }
                )

    # MD quality
    md_links = re.findall(r"\[([^\]]+)\]\((https?://www\.jplouton-avocat\.fr[^)]+)\)", md)
    if live_links and len(md_links) < 1 and any(l["href"].startswith("/post/") for l in live_links):
        issues.append(
            {
                "type": "md_missing_links",
                "severity": "warn",
                "detail": "snapshot MD sans liens alors que le live en a",
            }
        )

    errors = sum(1 for i in issues if i["severity"] == "error")
    warns = sum(1 for i in issues if i["severity"] == "warn")
    return {
        "slug": slug,
        "path": data.get("path"),
        "errors": errors,
        "warns": warns,
        "live_h2": len(live_h2),
        "ours_sections": len(ours_titles),
        "live_links": len(live_links),
        "ours_links": len(data.get("inlineLinks") or []),
        "md_chars": len(md),
        "issues": issues,
    }


def is_legacy_scraped_block(section_id: str, title: str | None = None) -> bool:
    """Mirror site/src/lib/expertise-hygiene.ts — strip at ingest."""
    if section_id == "contact":
        return False
    key = f"{section_id} {title or ''}".lower()
    if section_id in ("faq", "affaires"):
        return True
    if re.search(
        r"foire-aux-questions|questions-frequentes|affaires-recentes|nos-affaires-recentes|"
        r"les-dernieres-affaires|actualites|je-prends-rendez-vous|rendez-vous-maintenant|rendez-vous-pour",
        section_id,
    ):
        return True
    if re.search(
        r"foire aux questions|questions fr[eé]quentes|affaires r[eé]centes|nos affaires r[eé]centes|"
        r"derni[eè]res? affaires|^actualit[eé]s|^je prends rendez-vous",
        key,
    ):
        return True
    return False


def clean_junk(data: dict) -> int:
    """Remove orphan digit leads/blocks, empty zwsp bodies, legacy scraped sections."""
    fixed = 0
    before_sec = len(data.get("sections") or [])
    data["sections"] = [
        s
        for s in (data.get("sections") or [])
        if not is_legacy_scraped_block(s.get("id") or "", s.get("title"))
    ]
    fixed += before_sec - len(data["sections"])
    before_toc = len(data.get("toc") or [])
    data["toc"] = [
        t
        for t in (data.get("toc") or [])
        if not is_legacy_scraped_block(t.get("id") or "", t.get("label"))
    ]
    fixed += before_toc - len(data["toc"])
    for sec in data.get("sections") or []:
        lead = sec.get("lead")
        if lead is not None and is_junk_text(lead):
            sec["lead"] = None if not (lead or "").strip() or is_junk_text(lead) else lead
            if is_junk_text(lead or ""):
                sec["lead"] = None
                fixed += 1
        clean_blocks = []
        for b in sec.get("blocks") or []:
            body = b.get("body") or ""
            heading = b.get("heading") or ""
            if is_junk_text(body) and not heading.strip():
                fixed += 1
                continue
            if is_junk_text(body):
                b = {**b, "body": ""}
                fixed += 1
            # dedupe: skip body that only repeats previous
            if clean_blocks and b.get("body"):
                prev = clean_blocks[-1]
                if (
                    normalize_space(prev.get("body") or "")[:120].lower()
                    == normalize_space(b.get("body") or "")[:120].lower()
                    and not (b.get("heading") or "").strip()
                ):
                    fixed += 1
                    continue
            clean_blocks.append(b)
        sec["blocks"] = clean_blocks
    return fixed


def refresh_inline_links(data: dict, live_links: list[dict]) -> int:
    before = len(data.get("inlineLinks") or [])
    # merge live + existing, prefer live
    merged = []
    seen = set()
    for src in (live_links, data.get("inlineLinks") or []):
        for link in src:
            text = normalize_space(link.get("text") or "")
            href = link.get("href") or ""
            if not text or text.lower() == "ressources":
                continue
            if href.startswith("/post/"):
                resolved = resolve_post_href(href)
                if not resolved:
                    continue
                href = resolved
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append({"text": text, "href": href})
    data["inlineLinks"] = merged
    return len(merged) - before


def main() -> None:
    ap = argparse.ArgumentParser(description="Deep-check expertises vs live (+ snapshot MD)")
    ap.add_argument("--slug", help="Une seule expertise")
    ap.add_argument("--fix", action="store_true", help="Nettoie junk + refresh inlineLinks")
    ap.add_argument("--skip-fetch", action="store_true", help="Ne pas re-télécharger le live")
    args = ap.parse_args()

    MD_DIR.mkdir(parents=True, exist_ok=True)
    files = load_expertise_files(args.slug)
    if not files:
        raise SystemExit("Aucune expertise trouvée")

    reports = []
    total_fixed = 0

    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        slug = data["slug"]
        page_path = data.get("path") or f"/{slug}"
        live_path = data.get("livePath") or page_path
        url = BASE + live_path
        md_path = MD_DIR / f"{slug}.md"

        print(f"→ {slug}")
        meta_path = MD_DIR / f"{slug}.live.json"
        if args.skip_fetch and md_path.exists() and meta_path.exists():
            md = md_path.read_text(encoding="utf-8")
            live = json.loads(meta_path.read_text(encoding="utf-8"))
            print(f"  (cache) h2={len(live.get('h2') or [])} links={len(live.get('links') or [])}")
        elif args.skip_fetch and md_path.exists():
            md = md_path.read_text(encoding="utf-8")
            live = {
                "h1": data.get("title", ""),
                "h2": re.findall(r"^## (.+)$", md, re.M),
                "h3": re.findall(r"^### (.+)$", md, re.M),
                "links": [],  # sans .live.json, pas de check liens (trop bruité)
            }
            print("  (cache MD seul — liens non vérifiés, relancer sans --skip-fetch)")
        else:
            html = fetch(url)
            md = html_to_markdown(html, live_path)
            md_path.write_text(md, encoding="utf-8")
            live = extract_live_structure(html)
            meta_path.write_text(json.dumps(live, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"  MD {len(md)} car. · live h2={len(live['h2'])} links={len(live['links'])}")

        if args.fix:
            fixed = clean_junk(data)
            delta = refresh_inline_links(data, live.get("links") or [])
            total_fixed += fixed
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"  fix junk={fixed} linksΔ={delta:+d} → {len(data.get('inlineLinks') or [])}")

        # reload after fix
        data = json.loads(path.read_text(encoding="utf-8"))
        report = check_expertise(data, live, md)
        reports.append(report)
        print(f"  check errors={report['errors']} warns={report['warns']}")

    summary = {
        "pages": len(reports),
        "errors": sum(r["errors"] for r in reports),
        "warns": sum(r["warns"] for r in reports),
        "fixed_ops": total_fixed,
        "reports": reports,
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("\n═══ Bilan ═══")
    print(f"Pages : {summary['pages']}")
    print(f"Erreurs : {summary['errors']} · Warnings : {summary['warns']}")
    print(f"Rapport : {REPORT_PATH.relative_to(ROOT)}")
    print(f"MD live : {MD_DIR.relative_to(ROOT)}/")
    for r in reports:
        if r["errors"] or r["warns"]:
            print(f"  • {r['slug']}: {r['errors']} err / {r['warns']} warn")


if __name__ == "__main__":
    main()

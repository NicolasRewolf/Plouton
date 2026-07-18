#!/usr/bin/env python3
"""Scrape live jplouton expertise and hub pages into JSON."""
from __future__ import annotations

import json
import re
import subprocess
import unicodedata
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, NavigableString, Tag

BASE = "https://www.jplouton-avocat.fr"
ROOT = Path(__file__).resolve().parents[1]
EXPERTISES_DIR = ROOT / "contenu" / "expertises"
PAGES_DIR = ROOT / "contenu" / "pages"

EXPERTISES: list[dict[str, str]] = [
    {
        "url": f"{BASE}/defense-penale/proces-criminel",
        "slug": "proces-criminel",
        "path": "/defense-penale/proces-criminel",
        "pole": "defense-penale",
        "poleLabel": "Défense pénale",
        "formObjet": "Droit Pénal",
        "blogCategories": ["Droit Pénal"],
    },
    {
        "url": f"{BASE}/defense-penale/trafic-de-stupefiant",
        "slug": "trafic-de-stupefiants",
        "path": "/defense-penale/trafic-de-stupefiants",
        "pole": "defense-penale",
        "poleLabel": "Défense pénale",
        "formObjet": "Droit Pénal",
        "blogCategories": ["Droit Pénal"],
    },
    {
        "url": f"{BASE}/defense-penale/violences-conjugales-et-feminicides",
        "slug": "violences-conjugales-et-feminicides",
        "path": "/defense-penale/violences-conjugales-et-feminicides",
        "pole": "defense-penale",
        "poleLabel": "Défense pénale",
        "formObjet": "Droit Pénal",
        "blogCategories": ["Droit Pénal"],
    },
    {
        "url": f"{BASE}/defense-penale/droit-penal-des-affaires",
        "slug": "droit-penal-des-affaires",
        "path": "/defense-penale/droit-penal-des-affaires",
        "pole": "defense-penale",
        "poleLabel": "Défense pénale",
        "formObjet": "Droit pénal des affaires",
        "blogCategories": ["Droit Pénal"],
    },
    {
        "url": f"{BASE}/defense-penale/defense-des-elus",
        "slug": "defense-des-elus",
        "path": "/defense-penale/defense-des-elus",
        "pole": "defense-penale",
        "poleLabel": "Défense pénale",
        "formObjet": "Défense des élus",
        "blogCategories": ["Défense des élus"],
    },
    {
        "url": f"{BASE}/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
        "slug": "victimes-de-delits-ou-crimes",
        "path": "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
        "pole": "indemnisation-des-victimes",
        "poleLabel": "Indemnisation des victimes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/indemnisation-des-victimes/accidents-de-la-route",
        "slug": "accidents-de-la-route",
        "path": "/indemnisation-des-victimes/accidents-de-la-route",
        "pole": "indemnisation-des-victimes",
        "poleLabel": "Indemnisation des victimes",
        "formObjet": "Accidents de la route",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/indemnisation-des-victimes/droit-et-accidents-du-travail",
        "slug": "droit-et-accidents-du-travail",
        "path": "/indemnisation-des-victimes/droit-et-accidents-du-travail",
        "pole": "indemnisation-des-victimes",
        "poleLabel": "Indemnisation des victimes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/indemnisation-des-victimes/accidents-et-erreurs-medicales",
        "slug": "accidents-et-erreurs-medicales",
        "path": "/indemnisation-des-victimes/accidents-et-erreurs-medicales",
        "pole": "indemnisation-des-victimes",
        "poleLabel": "Indemnisation des victimes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/indemnisation-des-victimes/accidents-de-la-vie-courante",
        "slug": "accidents-de-la-vie-courante",
        "path": "/indemnisation-des-victimes/accidents-de-la-vie-courante",
        "pole": "indemnisation-des-victimes",
        "poleLabel": "Indemnisation des victimes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels",
        "slug": "droit-assurances-particuliers-professionnels",
        "path": "/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels",
        "pole": "droit-des-contrats-et-des-personnes",
        "poleLabel": "Droit des contrats et des personnes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/droit-des-contrats-et-des-personnes/defense-des-consommateurs",
        "slug": "defense-des-consommateurs",
        "path": "/droit-des-contrats-et-des-personnes/defense-des-consommateurs",
        "pole": "droit-des-contrats-et-des-personnes",
        "poleLabel": "Droit des contrats et des personnes",
        "formObjet": "Autre",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/droit-des-contrats-et-des-personnes/droit-de-la-famille",
        "slug": "droit-de-la-famille",
        "path": "/droit-des-contrats-et-des-personnes/droit-de-la-famille",
        "pole": "droit-des-contrats-et-des-personnes",
        "poleLabel": "Droit des contrats et des personnes",
        "formObjet": "Droit de la famille",
        "blogCategories": [],
    },
    {
        "url": f"{BASE}/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux",
        "slug": "divorce",
        "path": "/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux",
        "pole": "droit-des-contrats-et-des-personnes",
        "poleLabel": "Droit des contrats et des personnes",
        "formObjet": "Droit de la famille",
        "blogCategories": [],
    },
]

HUB_PAGES: list[dict[str, Any]] = [
    {"url": f"{BASE}/nos-affaires", "filename": "nos-affaires.json", "slug": "nos-affaires", "mode": "full"},
    {
        "url": f"{BASE}/blog/categories/médias",
        "filename": "medias.json",
        "slug": "medias",
        "mode": "full",
        "note": "/medias returns 404; using blog category Médias",
    },
    {"url": f"{BASE}/mentions-legales", "filename": "mentions-legales.json", "slug": "mentions-legales", "mode": "full"},
    {"url": f"{BASE}/notre-cabinet", "filename": "notre-cabinet.json", "slug": "notre-cabinet", "mode": "hero"},
    {
        "url": f"{BASE}/comprendre-le-droit",
        "filename": "comprendre-le-droit.json",
        "slug": "comprendre-le-droit",
        "mode": "full",
    },
]


def normalize_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def slugify_id(label: str) -> str:
    s = unicodedata.normalize("NFKD", label)
    s = s.encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "section"


def fetch_html(url: str) -> tuple[str | None, int]:
    result = subprocess.run(
        ["curl", "-sL", "-A", "Mozilla/5.0", "-w", "\n%{http_code}", url],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        return None, 0
    body = result.stdout
    if "\n" not in body:
        return None, 0
    html, code_str = body.rsplit("\n", 1)
    try:
        code = int(code_str.strip())
    except ValueError:
        return html, 200
    if code >= 400:
        return None, code
    return html, code


def heading_text(el: Tag) -> str:
    return normalize_text(el.get_text(" ", strip=True))


def h2_accent(el: Tag) -> str | None:
    accent = el.find("span", class_=lambda c: c and "color_20" in c)
    if not accent:
        return None
    t = normalize_text(accent.get_text(" ", strip=True))
    return t or None


def is_top_level_content(el: Tag) -> bool:
    if el.find_parent(["p", "li", "h1", "h2", "h3", "figcaption"]):
        parent = el.parent
        if el.name == "p" and parent and parent.name in ("li", "p"):
            return False
    if el.name in ("p", "ul", "ol") and el.find_parent("li"):
        return False
    return True


def collect_block_body(start: Tag, stop_tags: set[str], all_nodes: list[Tag]) -> str:
    parts: list[str] = []
    try:
        start_idx = all_nodes.index(start)
    except ValueError:
        return ""
    for node in all_nodes[start_idx + 1 :]:
        if node.name in stop_tags:
            break
        if node.name == "p" and is_top_level_content(node):
            t = normalize_text(node.get_text(" ", strip=True))
            if t:
                parts.append(t)
        elif node.name in ("ul", "ol") and is_top_level_content(node):
            for li in node.find_all("li", recursive=False):
                t = normalize_text(li.get_text(" ", strip=True))
                if t:
                    parts.append(f"• {t}")
    return "\n\n".join(parts)


def ordered_main_nodes(main: Tag) -> list[Tag]:
    nodes: list[Tag] = []
    for el in main.descendants:
        if not isinstance(el, Tag):
            continue
        if el.name not in ("h1", "h2", "h3", "p", "ul", "ol"):
            continue
        if el.name in ("p", "ul", "ol") and not is_top_level_content(el):
            continue
        nodes.append(el)
    return nodes


def extract_faq_expertise(h2_labels: list[str]) -> str:
    for label in h2_labels:
        if re.search(r"foire aux questions|faq", label, re.I):
            m = re.split(r":\s*", label, maxsplit=1)
            if len(m) == 2 and m[1].strip():
                return m[1].strip()
            return label
    return ""


def parse_expertise_page(html: str, meta: dict[str, Any]) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main")
    if not main:
        raise ValueError("no main element")

    meta_title = normalize_text(soup.title.string) if soup.title and soup.title.string else ""
    desc_tag = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
    meta_description = normalize_text(desc_tag["content"]) if desc_tag and desc_tag.get("content") else ""

    nodes = ordered_main_nodes(main)
    h1_el = main.find("h1")
    title = heading_text(h1_el) if h1_el else meta.get("slug", "")

    intro_parts: list[str] = []
    if h1_el and h1_el in nodes:
        idx = nodes.index(h1_el)
        before: list[str] = []
        for node in reversed(nodes[:idx]):
            if node.name == "h2":
                break
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    before.append(t)
        intro_parts.extend(reversed(before))
        for node in nodes[idx + 1 :]:
            if node.name == "h2":
                break
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    intro_parts.append(t)
    intro = "\n\n".join(intro_parts)
    if not meta_description and intro:
        meta_description = intro[:160]

    h2_elements = [n for n in nodes if n.name == "h2"]
    h2_labels = [heading_text(h) for h in h2_elements]

    faq_from_page = extract_faq_expertise(h2_labels)
    faq_expertise = faq_from_page or meta.get("formObjet", "")

    sections: list[dict[str, Any]] = []
    toc: list[dict[str, str]] = []
    used_ids: dict[str, int] = {}

    def unique_id(label: str) -> str:
        base = slugify_id(label)
        if base not in used_ids:
            used_ids[base] = 1
            return base
        used_ids[base] += 1
        return f"{base}-{used_ids[base]}"

    stop_h2 = {"h2"}
    for i, h2 in enumerate(h2_elements):
        label = heading_text(h2)
        sec_id = unique_id(label)
        toc.append({"id": sec_id, "label": label})

        blocks: list[dict[str, str]] = []
        lead: str | None = None

        try:
            h2_idx = nodes.index(h2)
        except ValueError:
            continue

        next_h2_node = None
        for j in range(i + 1, len(h2_elements)):
            next_h2_node = h2_elements[j]
            break

        section_nodes: list[Tag] = []
        for node in nodes[h2_idx + 1 :]:
            if node is next_h2_node:
                break
            section_nodes.append(node)

        first_content = True
        k = 0
        while k < len(section_nodes):
            node = section_nodes[k]
            if node.name == "h3":
                heading = heading_text(node)
                body = collect_block_body(node, {"h2", "h3"}, section_nodes)
                blocks.append({"heading": heading, "body": body})
                k += 1
                first_content = False
                continue
            if node.name == "p" and first_content:
                t = normalize_text(node.get_text(" ", strip=True))
                if t and lead is None:
                    lead = t
                elif t:
                    blocks.append({"heading": "", "body": t})
                k += 1
                continue
            if node.name in ("ul", "ol") and first_content and not blocks:
                items = [
                    normalize_text(li.get_text(" ", strip=True))
                    for li in node.find_all("li", recursive=False)
                ]
                items = [f"• {x}" for x in items if x]
                if items:
                    if lead is None:
                        lead = "\n".join(items)
                    else:
                        blocks.append({"heading": "", "body": "\n".join(items)})
                k += 1
                continue
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    blocks.append({"heading": "", "body": t})
            k += 1

        sections.append(
            {
                "id": sec_id,
                "title": label,
                "titleAccent": h2_accent(h2),
                "lead": lead,
                "blocks": blocks,
            }
        )

    return {
        "slug": meta["slug"],
        "path": meta["path"],
        "pole": meta["pole"],
        "poleLabel": meta["poleLabel"],
        "title": title,
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "intro": intro,
        "formObjet": meta.get("formObjet", "Autre"),
        "faqExpertise": faq_expertise,
        "blogCategories": meta.get("blogCategories", []),
        "toc": toc,
        "sections": sections,
    }


def parse_hub_full(html: str, slug: str, path: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main") or soup.body
    meta_title = normalize_text(soup.title.string) if soup.title and soup.title.string else ""
    desc_tag = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
    meta_description = normalize_text(desc_tag["content"]) if desc_tag and desc_tag.get("content") else ""

    h1_el = main.find("h1") if main else None
    title = heading_text(h1_el) if h1_el else meta_title

    nodes = ordered_main_nodes(main) if main else []
    intro_parts: list[str] = []
    if h1_el and h1_el in nodes:
        idx = nodes.index(h1_el)
        for node in nodes[idx + 1 :]:
            if node.name == "h2":
                break
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    intro_parts.append(t)
    intro = "\n\n".join(intro_parts)

    sections: list[dict[str, Any]] = []
    h2_elements = [n for n in nodes if n.name == "h2"]
    if not h2_elements and nodes:
        body_parts: list[str] = []
        for node in nodes:
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    body_parts.append(t)
            elif node.name in ("ul", "ol"):
                for li in node.find_all("li", recursive=False):
                    t = normalize_text(li.get_text(" ", strip=True))
                    if t:
                        body_parts.append(f"• {t}")
        if body_parts:
            sections.append({"title": title or slug, "body": "\n\n".join(body_parts)})
    for i, h2 in enumerate(h2_elements):
        label = heading_text(h2)
        h2_idx = nodes.index(h2)
        next_h2 = h2_elements[i + 1] if i + 1 < len(h2_elements) else None
        texts: list[str] = []
        for node in nodes[h2_idx + 1 :]:
            if node is next_h2:
                break
            if node.name == "p":
                t = normalize_text(node.get_text(" ", strip=True))
                if t:
                    texts.append(t)
            elif node.name in ("ul", "ol"):
                for li in node.find_all("li", recursive=False):
                    t = normalize_text(li.get_text(" ", strip=True))
                    if t:
                        texts.append(f"• {t}")
            elif node.name == "h3":
                t = heading_text(node)
                if t:
                    texts.append(f"### {t}")
        sections.append({"title": label, "body": "\n\n".join(texts)})

    full_text_parts = [title, intro] if intro else [title]
    for s in sections:
        full_text_parts.append(s["title"])
        if s["body"]:
            full_text_parts.append(s["body"])
    full_text = "\n\n".join(p for p in full_text_parts if p)

    return {
        "slug": slug,
        "path": path,
        "title": title,
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "intro": intro,
        "sections": sections,
        "fullText": full_text,
    }


def parse_notre_cabinet_hero(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main")
    meta_title = normalize_text(soup.title.string) if soup.title and soup.title.string else ""
    desc_tag = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
    meta_description = normalize_text(desc_tag["content"]) if desc_tag and desc_tag.get("content") else ""
    h1 = main.find("h1") if main else None
    title = heading_text(h1) if h1 else ""
    intro_parts: list[str] = []
    if main and h1:
        seen_h1 = False
        for el in main.descendants:
            if isinstance(el, Tag) and el.name == "h1":
                seen_h1 = True
                continue
            if not seen_h1:
                continue
            if isinstance(el, Tag) and el.name == "h2":
                break
            if isinstance(el, Tag) and el.name == "p" and is_top_level_content(el):
                t = normalize_text(el.get_text(" ", strip=True))
                if t and "étoiles" not in t.lower():
                    intro_parts.append(t)
    intro = "\n\n".join(intro_parts)
    return {
        "slug": "notre-cabinet",
        "path": "/notre-cabinet",
        "title": title,
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "intro": intro,
    }


def write_json(path: Path, data: dict) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(text + "\n", encoding="utf-8")
    return len(text)


def main() -> None:
    report: list[str] = []
    errors: list[str] = []

    for item in EXPERTISES:
        if item["slug"] == "droit-penal":
            continue
        out = EXPERTISES_DIR / f"{item['slug']}.json"
        html, code = fetch_html(item["url"])
        if not html:
            errors.append(f"EXPERTISE FAIL {item['url']} HTTP {code}")
            continue
        try:
            data = parse_expertise_page(html, item)
            size = write_json(out, data)
            report.append(f"WROTE {out.name}: {size:,} chars")
        except Exception as e:
            errors.append(f"EXPERTISE PARSE {item['slug']}: {e}")

    for hub in HUB_PAGES:
        out = PAGES_DIR / hub["filename"]
        html, code = fetch_html(hub["url"])
        if not html:
            errors.append(f"HUB FAIL {hub['url']} HTTP {code}")
            continue
        try:
            path = "/" + hub["slug"] if hub["slug"] != "medias" else hub["url"].replace(BASE, "")
            if hub.get("mode") == "hero":
                data = parse_notre_cabinet_hero(html)
            else:
                data = parse_hub_full(html, hub["slug"], path)
            if hub.get("note"):
                data["scrapeNote"] = hub["note"]
            if hub["slug"] == "comprendre-le-droit" and not data.get("fullText"):
                data["scrapeNote"] = (
                    "Page mostly client-rendered in static HTML; no <main> content in curl response."
                )
            size = write_json(out, data)
            report.append(f"WROTE pages/{out.name}: {size:,} chars")
        except Exception as e:
            errors.append(f"HUB PARSE {hub['filename']}: {e}")

  # probe /medias 404
    _, medias_code = fetch_html(f"{BASE}/medias")
    errors.append(f"PROBE /medias HTTP {medias_code}")

    print("=== REPORT ===")
    for line in report:
        print(line)
    if errors:
        print("=== NOTES/ERRORS ===")
        for line in errors:
            print(line)


if __name__ == "__main__":
    main()

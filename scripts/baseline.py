#!/usr/bin/env python3
"""Baseline SEO du site live — la preuve que la migration ne casse rien.

  crawl            fige l'état du live (status, title, meta, H1, canonical,
                   nb de mots) pour ~470 URLs → contenu/baseline/live-baseline.json
  diff <origine>   rejoue les mêmes URLs contre une autre origine
                   (ex. http://localhost:3000 ou la préprod Vercel) et liste
                   les écarts. Code retour 1 si écart bloquant.

Usage :
  python3 scripts/baseline.py crawl
  python3 scripts/baseline.py diff http://localhost:3000
"""
import concurrent.futures as cf
import html
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

try:
    from bs4 import BeautifulSoup
except ImportError:  # fallback si bs4 absent — regex robuste attributs
    BeautifulSoup = None  # type: ignore[misc, assignment]

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "contenu" / "baseline" / "live-baseline.json"
LIVE = "https://www.jplouton-avocat.fr"

STRUCTURE = [
    "/", "/notre-cabinet", "/honoraires-rendez-vous", "/nos-affaires",
    "/mentions-legales", "/comprendre-le-droit", "/blog",
]


def urls_to_crawl() -> list[str]:
    urls = list(STRUCTURE)
    for e in json.loads((ROOT / "contenu" / "expertises-cards.json").read_text()):
        if e.get("url"):
            urls.append(e["url"])
    for c in json.loads((ROOT / "contenu" / "categories.json").read_text()):
        urls.append(c["url"])
    for a in json.loads((ROOT / "contenu" / "articles-index.json").read_text()):
        urls.append(a.get("url") or f"/post/{a['slug']}")
    # dédup en préservant l'ordre
    seen, out = set(), []
    for u in urls:
        u = unicodedata.normalize("NFC", u)
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def fetch(origin: str, path: str) -> dict:
    url = origin + quote(path, safe="/-_.~")
    try:
        r = subprocess.run(
            ["curl", "-sL", "--max-time", "60", "--retry", "2", "-w", "\\n%{http_code}",
             "-A", "Mozilla/5.0 (PloutonBaseline)", url],
            capture_output=True, text=True, check=False, timeout=90,
        )
        body, _, code = r.stdout.rpartition("\n")
        status = int(code or 0)
    except Exception:  # noqa: BLE001
        return {"path": path, "status": 0}

    def clean(s: str) -> str:
        return html.unescape(re.sub(r"\s+", " ", s)).strip()

    def first(pattern: str) -> str:
        m = re.search(pattern, body, re.I | re.S)
        return clean(m.group(1)) if m else ""

    # P0-C — meta description via BeautifulSoup (ordre attributs variable)
    meta_description = ""
    title = ""
    h1 = ""
    canonical = ""
    if BeautifulSoup is not None:
        soup = BeautifulSoup(body, "html.parser")
        title = clean(soup.title.get_text()) if soup.title else ""
        md = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
        if md and md.get("content"):
            meta_description = clean(str(md["content"]))
        h1_el = soup.find("h1")
        h1 = clean(h1_el.get_text()) if h1_el else ""
        can = soup.find("link", attrs={"rel": re.compile(r"\bcanonical\b", re.I)})
        if can and can.get("href"):
            canonical = clean(str(can["href"]))
    else:
        title = first(r"<title[^>]*>(.*?)</title>")
        meta_description = first(
            r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']'
        ) or first(
            r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']'
        )
        h1 = first(r"<h1[^>]*>(.*?)</h1>")
        canonical = first(
            r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']'
        )

    text = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", body, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    words = len(re.findall(r"\S+", text))

    return {
        "path": path,
        "status": status,
        "title": title,
        "metaDescription": meta_description,
        "h1": h1,
        "canonical": canonical,
        "words": words,
    }


def crawl_all(origin: str) -> list[dict]:
    urls = urls_to_crawl()
    print(f"{len(urls)} URLs → {origin}")
    results: list[dict] = []
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(fetch, origin, u): u for u in urls}
        for i, fut in enumerate(cf.as_completed(futs), 1):
            results.append(fut.result())
            if i % 50 == 0:
                print(f"  {i}/{len(urls)}")
    results.sort(key=lambda r: r["path"])
    return results


def cmd_crawl() -> None:
    results = crawl_all(LIVE)
    BASELINE.parent.mkdir(parents=True, exist_ok=True)
    BASELINE.write_text(json.dumps(results, ensure_ascii=False, indent=1) + "\n")
    bad = [r for r in results if r["status"] != 200]
    print(f"figé : {len(results)} URLs → {BASELINE.relative_to(ROOT)}")
    if bad:
        print(f"ATTENTION {len(bad)} URLs live non-200 :")
        for r in bad[:10]:
            print(f"  {r['status']} {r['path']}")


def text_of(s: str) -> str:
    """Texte nu — le live Wix truffe ses H1 de <span>, on compare le contenu."""
    s = re.sub(r"<[^>]+>", "", s or "")
    s = html.unescape(s)
    return unicodedata.normalize("NFC", re.sub(r"\s+", " ", s)).strip()


def cmd_diff(origin: str) -> None:
    base = {r["path"]: r for r in json.loads(BASELINE.read_text())}
    results = crawl_all(origin)
    hard, soft = [], []
    for r in results:
        b = base.get(r["path"])
        if not b:
            continue
        if b["status"] == 200 and r["status"] != 200:
            hard.append(f"{r['status']:>3} {r['path']}")
            continue
        if b["status"] != 200:
            continue
        if text_of(b["h1"]) and text_of(r["h1"]) != text_of(b["h1"]):
            soft.append(f"H1  {r['path']}\n      live: {text_of(b['h1'])[:70]}\n      new : {text_of(r['h1'])[:70]}")
        if text_of(b["title"]) and text_of(r["title"]) != text_of(b["title"]):
            soft.append(f"TIT {r['path']}\n      live: {text_of(b['title'])[:70]}\n      new : {text_of(r['title'])[:70]}")
        if b["words"] > 300 and r["words"] < b["words"] * 0.6:
            soft.append(f"TXT {r['path']} : {b['words']} mots live → {r['words']} (‑40 %+)")
    print(f"\n=== {len(hard)} écarts bloquants (200 live → erreur) ===")
    print("\n".join(hard) or "  aucun")
    print(f"\n=== {len(soft)} écarts à examiner (H1 / title / volume texte) ===")
    print("\n".join(soft[:60]) or "  aucun")
    sys.exit(1 if hard else 0)


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "crawl":
        cmd_crawl()
    elif len(sys.argv) >= 3 and sys.argv[1] == "diff":
        cmd_diff(sys.argv[2].rstrip("/"))
    else:
        print(__doc__)
        sys.exit(2)

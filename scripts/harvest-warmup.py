#!/usr/bin/env python3
"""Harvest the `wix-warmup-data` JSON embedded in every SSR page of
https://www.jplouton-avocat.fr/ and derive clean committed content artifacts.

Usage:
    python3 scripts/harvest-warmup.py crawl [--only posts|pages|all] [--limit N] [--force] [--paths /a /b]
    python3 scripts/harvest-warmup.py extract [--what ricos|faq|poles|nav|stats|affaires|all]
    python3 scripts/harvest-warmup.py inventory
    python3 scripts/harvest-warmup.py debug --path /post/xyz [--dump] [--depth N]

Cache layout (gitignored):
    .cache/warmup/index.json            path -> {file, bytes, fetchedAt, httpStatus}
    .cache/warmup/{sha1(path)}.json.gz  raw warmup JSON string (gzip)
    .cache/html/{sha1(path)}.html.gz    raw HTML, kept for /, /blog and the 3 pole hubs (nav + hub parsing)
    .cache/collections/{name}.json.gz   full CMS collection snapshots via the site's public wix-data API

DISCOVERED PAYLOAD STRUCTURE (verified 2026-07-18)
==================================================
Top-level warmup keys: platform, pages, appsWarmupData, builderComponentsWarmupData, ooi.

* pages.compIdToTypeMap                       comp-id -> viewer component type (WRichText, ImageX, ...).
* platform.ssrPropsUpdates / ssrStyleUpdates  repeater comp-id -> item UUID arrays / styles.
* appsWarmupData keys seen:
    - "dataBinding"  (CMS, the interesting one):
        .schemas                       collection-id -> field schema (Import1, Blog/Posts, Expertises,
                                       Equipes, Membres, Blog/Categories, Blog/Tags, Members/PublicData)
        .dataStore.recordsByCollectionId
            "Import1"    FAQ records   {_id, question, rponse1, expertise[], sousExpertise[], like?}
            "Blog/Posts" post records  {slug, title, excerpt, richContent (RICOS TREE!), plainContent,
                                        viewCount, likeCount, commentCount, coverImage, mainCategory,
                                        categories, publishedDate, timeToRead, ...}
            "Expertises" cards         {title, domaine, domaineFiltre, synthseHomepage, url, image}
            "Equipes"    team          {nomPrnom, titre, description, descriptionLongue, formation, ...}
            "Membres"    lawyer filter {profil}
        .dataStore.recordInfosByDatasetId  comp-id -> {itemIds, datasetSize:{total, loaded, cursor}}
          -> datasets are PAGINATED: only the first page (typically 8 FAQs / 20 posts) is embedded.
        .userFilterInitialData-comp-*  user-facing filter config (e.g. sousExpertise tag options)
    - "14bcded7-0066-7c35-14d7-466cb3f09103" (Wix Blog):
        on /blog & /blog/categories/*: 'feed-page-...' key -> JSON string, feedResponse.postFeedPage
            .posts.posts[] = post metadata only (includeContent:false, NO ricos, NO view counts)
        on /post/* pages: just {slug: post-uuid}. POST PAGES EMBED NO RICOS AND NO CMS DATA AT ALL —
            the body is SSR-rendered HTML; the warmup on a post page is ~11KB of comp maps.
    - "225dd912-7dea-4738-8688-4b8c6955ffc2" (Wix Forms): contact form definitions.
    - "675bbcef-18d8-41f5-800e-131ec9e08762" (wix-code): importedNamespaces only.

Because post pages embed no Ricos and page datasets are paginated, full coverage (422 posts'
richContent, 248 FAQs) is completed through the site's own public data API (plain requests,
same data the site frontend uses):
    GET  /_api/v1/access-tokens                       -> apps["675bbcef-..."].instance (public visitor token)
    POST /_api/cloud-data/v2/items/query              Authorization: <instance>
         {"dataCollectionId": "Blog/Posts", "query": {"cursorPaging": {"limit": N | "cursor": c}}}
The `crawl` command snapshots these collections into .cache/collections/.

Where each artifact comes from:
    contenu/ricos/{slug}.json      Blog/Posts.richContent  (warmup records where present, API snapshot for the rest)
    contenu/faq/{slug}.json        Import1 records grouped by `expertise` label; each expertise page's
                                   label is inferred from the records embedded in that page's warmup
    contenu/pages/pole-*.json      hub page HTML (headings/rich text) + warmup Expertises card records
    contenu/navigation.json        homepage HTML: nav[data-hook=menu-root] x3 (mega/site/mobile)
                                   + ul.wixui-dropdown-menu utility dropdowns (dataItem-*-submenu)
    contenu/stats-posts.json       Blog/Posts viewCount/commentCount/likeCount (API snapshot)
    contenu/affaires-recentes.json /nos-affaires warmup: Blog/Posts dataset (total 366, 20 embedded) + Membres
    contenu/reference/ricos-inventory.json  census over all contenu/ricos/*.json trees
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.parse
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

import requests

BASE = "https://www.jplouton-avocat.fr"
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
WARMUP_DIR = CACHE / "warmup"
HTML_DIR = CACHE / "html"
COLL_DIR = CACHE / "collections"
CONTENU = ROOT / "contenu"
BASELINE = CONTENU / "baseline" / "live-baseline.json"

WIX_CODE_APP = "675bbcef-18d8-41f5-800e-131ec9e08762"
BLOG_APP = "14bcded7-0066-7c35-14d7-466cb3f09103"

POLE_HUBS = [
    "/defense-penale",
    "/indemnisation-des-victimes",
    "/droit-des-contrats-et-des-personnes",
]

# Paths whose raw HTML we also keep (nav parsing + hub content).
HTML_KEEP = {"/", "/blog", *POLE_HUBS}

# CMS collections snapshotted through the public wix-data API.
COLLECTIONS = ["Import1", "Blog/Posts", "Blog/Categories", "Expertises", "Equipes", "Membres"]

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

WARMUP_RE = re.compile(r'<script[^>]*id="wix-warmup-data"[^>]*>', re.IGNORECASE)


def log(*args):
    print(*args, flush=True)


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def load_json(path: Path, default=None):
    if not path.exists():
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data, sort_keys=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=sort_keys)
        f.write("\n")


def new_session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


# ================================================================ crawl


def baseline_paths() -> list[str]:
    data = load_json(BASELINE)
    if not data:
        sys.exit(f"baseline not found: {BASELINE}")
    return [nfc(e["path"]) for e in data]


def sitemap_paths(session: requests.Session) -> list[str]:
    try:
        r = session.get(f"{BASE}/pages-sitemap.xml", timeout=30)
        r.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        log(f"  ! pages-sitemap.xml fetch failed: {exc}")
        return []
    locs = re.findall(r"<loc>(.*?)</loc>", r.text)
    paths = []
    for loc in locs:
        parsed = urllib.parse.urlparse(loc.strip())
        paths.append(nfc(urllib.parse.unquote(parsed.path) or "/"))
    return paths


def extract_warmup(html: str) -> str | None:
    m = WARMUP_RE.search(html)
    if not m:
        return None
    end = html.find("</script>", m.end())
    if end == -1:
        return None
    return html[m.end():end]


def fetch(session: requests.Session, url: str) -> requests.Response:
    last_exc = None
    for attempt in range(3):
        try:
            return session.get(url, timeout=30)
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            time.sleep(2**attempt)
    raise last_exc


def wix_instance(session: requests.Session) -> str:
    r = session.get(f"{BASE}/_api/v1/access-tokens", timeout=30)
    r.raise_for_status()
    return r.json()["apps"][WIX_CODE_APP]["instance"]


def coll_cache_path(name: str) -> Path:
    return COLL_DIR / (re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") + ".json.gz")


def snapshot_collections(session: requests.Session, force: bool = False):
    COLL_DIR.mkdir(parents=True, exist_ok=True)
    try:
        inst = wix_instance(session)
    except Exception as exc:  # noqa: BLE001
        log(f"  ! access-tokens fetch failed, skipping collection snapshots: {exc}")
        return
    headers = {"Authorization": inst, "Content-Type": "application/json"}
    for name in COLLECTIONS:
        out = coll_cache_path(name)
        if out.exists() and not force:
            log(f"  collection {name}: cached, skip")
            continue
        items, cursor, pages_fetched = [], None, 0
        try:
            while True:
                paging = {"cursor": cursor} if cursor else {"limit": 50}
                body = {"dataCollectionId": name, "query": {"cursorPaging": paging}}
                r = session.post(
                    f"{BASE}/_api/cloud-data/v2/items/query",
                    headers=headers, json=body, timeout=60,
                )
                r.raise_for_status()
                d = r.json()
                items += [it["data"] for it in d.get("dataItems", [])]
                pm = d.get("pagingMetadata", {})
                cursor = pm.get("cursors", {}).get("next")
                pages_fetched += 1
                if not pm.get("hasNext") or not cursor:
                    break
                time.sleep(0.5)
        except Exception as exc:  # noqa: BLE001
            log(f"  ! collection {name} fetch failed after {len(items)} items: {exc}")
            continue
        with gzip.open(out, "wt", encoding="utf-8") as f:
            json.dump({"collection": name, "fetchedAt": now_iso(), "count": len(items), "items": items}, f, ensure_ascii=False)
        log(f"  collection {name}: {len(items)} items ({pages_fetched} pages)")


def load_collection(name: str) -> list[dict]:
    p = coll_cache_path(name)
    if not p.exists():
        return []
    with gzip.open(p, "rt", encoding="utf-8") as f:
        return json.load(f)["items"]


def cmd_crawl(args):
    WARMUP_DIR.mkdir(parents=True, exist_ok=True)
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    index_path = WARMUP_DIR / "index.json"
    index = load_json(index_path, {})
    session = new_session()

    paths = baseline_paths()
    for p in POLE_HUBS + sitemap_paths(session):
        if p not in paths:
            paths.append(p)
    seen = set()
    paths = [p for p in paths if not (p in seen or seen.add(p))]

    if args.paths:
        paths = [nfc(p) for p in args.paths]
    if args.only == "posts":
        paths = [p for p in paths if p.startswith("/post/")]
    elif args.only == "pages":
        paths = [p for p in paths if not p.startswith("/post/")]
    if args.limit:
        paths = paths[: args.limit]

    log(f"crawl: {len(paths)} paths (index has {len(index)})")
    fetched = skipped = failed = 0
    for i, path in enumerate(paths, 1):
        if not args.force and path in index and index[path].get("httpStatus") == 200 and index[path].get("file"):
            skipped += 1
            continue
        url = BASE + urllib.parse.quote(path, safe="/-_.~")
        try:
            r = fetch(session, url)
        except Exception as exc:  # noqa: BLE001
            log(f"  ! FAIL {path}: {exc}")
            index[path] = {"file": None, "bytes": 0, "fetchedAt": now_iso(), "httpStatus": None, "error": str(exc)}
            failed += 1
            continue
        entry = {"file": None, "bytes": 0, "fetchedAt": now_iso(), "httpStatus": r.status_code}
        if r.status_code == 200:
            warmup = extract_warmup(r.text)
            if warmup is None:
                entry["error"] = "no wix-warmup-data script found"
                log(f"  ! NO-WARMUP {path}")
            else:
                fname = f"{sha1(path)}.json.gz"
                with gzip.open(WARMUP_DIR / fname, "wt", encoding="utf-8") as f:
                    f.write(warmup)
                entry["file"] = fname
                entry["bytes"] = len(warmup.encode("utf-8"))
            if path in HTML_KEEP:
                with gzip.open(HTML_DIR / f"{sha1(path)}.html.gz", "wt", encoding="utf-8") as f:
                    f.write(r.text)
        else:
            log(f"  ! HTTP {r.status_code} {path}")
            failed += 1
        index[path] = entry
        fetched += 1
        if i % 25 == 0:
            log(f"  … {i}/{len(paths)} (fetched {fetched}, skipped {skipped}, failed {failed})")
            write_json(index_path, index, sort_keys=True)
        time.sleep(0.5)  # ~2 req/s

    write_json(index_path, index, sort_keys=True)
    log(f"crawl pages done: fetched {fetched}, skipped {skipped}, failed {failed}, index {len(index)}")

    log("snapshotting CMS collections via public wix-data API…")
    snapshot_collections(session, force=args.force)
    log("crawl done")


# ================================================================ cache access


def warmup_index() -> dict:
    return load_json(WARMUP_DIR / "index.json", {})


def load_warmup(path: str):
    entry = warmup_index().get(nfc(path))
    if not entry or not entry.get("file"):
        return None
    fpath = WARMUP_DIR / entry["file"]
    if not fpath.exists():
        return None
    with gzip.open(fpath, "rt", encoding="utf-8") as f:
        return json.load(f)


def load_html(path: str) -> str | None:
    fpath = HTML_DIR / f"{sha1(nfc(path))}.html.gz"
    if not fpath.exists():
        return None
    with gzip.open(fpath, "rt", encoding="utf-8") as f:
        return f.read()


def data_store(warmup) -> dict:
    try:
        return warmup["appsWarmupData"]["dataBinding"]["dataStore"]
    except (KeyError, TypeError):
        return {}


def records(warmup, collection: str) -> dict:
    return data_store(warmup).get("recordsByCollectionId", {}).get(collection, {}) or {}


# ================================================================ tiny DOM (stdlib)


class Node:
    __slots__ = ("tag", "attrs", "children", "parent", "text")

    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []
        self.parent = parent
        self.text = ""


_VOID = {"br", "img", "meta", "link", "input", "hr", "source", "wbr", "area", "base", "col", "embed", "track", "param"}


class _DomParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in _VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        c = self.cur
        while c is not self.root and c.tag != tag:
            c = c.parent
        if c is not self.root:
            self.cur = c.parent

    def handle_data(self, data):
        self.cur.text += data


def parse_dom(html: str) -> Node:
    p = _DomParser()
    p.feed(html)
    return p.root


def walk(n: Node):
    yield n
    for c in n.children:
        yield from walk(c)


def inner_text(n: Node) -> str:
    return re.sub(r"\s+", " ", "".join(x.text for x in walk(n))).strip()


def has_class(n: Node, name: str) -> bool:
    return name in n.attrs.get("class", "").split()


def rel_href(href: str | None) -> str | None:
    if not href:
        return None
    if href.startswith(BASE):
        href = href[len(BASE):] or "/"
    return nfc(urllib.parse.unquote(href))


# ================================================================ slugs / mapping helpers


def post_slug(path: str) -> str:
    return nfc(urllib.parse.unquote(path))[len("/post/"):]


def norm_label(s: str) -> str:
    """Loose normalization for matching expertise labels."""
    s = nfc(s).lower()
    s = re.sub(r"foire aux questions\s*/\s*", "", s)
    s = re.sub(r"[^a-z0-9àâäéèêëîïôöùûüç]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def expertise_pages() -> list[dict]:
    """[{slug, path(live, cached), declaredPath}] for contenu/expertises/*.json."""
    out = []
    index = warmup_index()
    for f in sorted((CONTENU / "expertises").glob("*.json")):
        d = load_json(f)
        declared = d.get("path")
        live = None
        if declared and declared in index:
            live = declared
        else:
            # try singular/plural + suffix match against cached paths
            candidates = [p for p in index if not p.startswith("/post/")]
            slug = f.stem
            for p in candidates:
                seg = p.rsplit("/", 1)[-1]
                if seg in (slug, slug.rstrip("s"), slug + "s"):
                    live = p
                    break
        out.append({"slug": f.stem, "path": live, "declaredPath": declared, "faqExpertise": d.get("faqExpertise")})
    return out


# ================================================================ extract: ricos


def collect_warmup_posts() -> dict[str, tuple[str, dict]]:
    """slug -> (source page path, Blog/Posts record with richContent) from ALL cached warmups."""
    found: dict[str, tuple[str, dict]] = {}
    for path, entry in sorted(warmup_index().items()):
        if not entry.get("file"):
            continue
        w = load_warmup(path)
        for rec in records(w, "Blog/Posts").values():
            slug = nfc(rec.get("slug") or "")
            if slug and isinstance(rec.get("richContent"), dict) and slug not in found:
                found[slug] = (path, rec)
    return found


def extract_ricos():
    out_dir = CONTENU / "ricos"
    api_posts = {nfc(p.get("slug") or ""): p for p in load_collection("Blog/Posts")}
    warm = collect_warmup_posts()
    if not api_posts and not warm:
        log("ricos: nothing cached (run crawl first)")
        return
    slugs = sorted(set(api_posts) | set(warm))
    written = from_warm = from_api = missing = 0
    for slug in slugs:
        if slug in warm:
            _, rec = warm[slug]
            tree = rec.get("richContent")
            from_warm += 1
        else:
            tree = api_posts.get(slug, {}).get("richContent")
            from_api += 1
        if not isinstance(tree, dict) or not tree.get("nodes"):
            log(f"  ! ricos missing for {slug}")
            missing += 1
            continue
        write_json(out_dir / f"{slug}.json", {
            "slug": slug,
            "sourcePath": f"/post/{slug}",
            "capturedAt": today(),
            "ricos": tree,
        })
        written += 1
    # cross-check against existing article files
    art = {nfc(f.stem) for f in (CONTENU / "articles").glob("*.json")}
    log(f"ricos: {written} files written ({from_warm} slugs seen in warmup pages, {from_api} completed via API snapshot, {missing} missing)")
    log(f"ricos: articles/ has {len(art)} files")
    only_art = sorted(art - set(slugs))
    only_ricos = sorted(set(slugs) - art)
    if only_art:
        log(f"ricos: {len(only_art)} article files with no CMS post: {only_art[:10]}")
    if only_ricos:
        log(f"ricos: {len(only_ricos)} CMS posts with no article file: {only_ricos[:10]}")


# ================================================================ extract: faq


def faq_item(rec: dict) -> dict:
    sous = rec.get("sousExpertise") or []
    if isinstance(sous, str):
        sous = [sous]
    return {
        "question": (rec.get("question") or "").strip(),
        "answer": (rec.get("rponse1") or "").strip(),
        "sousExpertise": ", ".join(s.strip() for s in sous),
    }


def extract_faq():
    all_items = load_collection("Import1")
    if not all_items:
        log("faq: Import1 snapshot missing (run crawl first)")
        return
    by_label: dict[str, list[dict]] = defaultdict(list)
    for rec in all_items:
        for label in rec.get("expertise") or []:
            by_label[label].append(rec)
    log(f"faq: Import1 snapshot has {len(all_items)} records, labels: "
        + ", ".join(f"{k} ({len(v)})" for k, v in sorted(by_label.items())))

    used_labels = set()
    total_written = 0
    for page in expertise_pages():
        slug, live = page["slug"], page["path"]
        # Infer the page's expertise label from its warmup:
        #   a) the FAQ dataset's total item count is an exact fingerprint of the label
        #      (dataset filter = one expertise label; totals are unique or near-unique)
        #   b) the labels carried by the embedded records narrow ties
        label = None
        how = None
        if live:
            w = load_warmup(live)
            imp = records(w, "Import1")
            faq_total = None
            for info in data_store(w).get("recordInfosByDatasetId", {}).values():
                ids = info.get("itemIds") or []
                if ids and imp and all(i in imp for i in ids):
                    faq_total = (info.get("datasetSize") or {}).get("total")
                    break
            embedded_labels: set[str] | None = None
            for rec in imp.values():
                labs = set(rec.get("expertise") or [])
                if labs:
                    embedded_labels = labs if embedded_labels is None else (embedded_labels & labs)
            candidates = [lab for lab, rs in by_label.items() if faq_total is not None and len(rs) == faq_total]
            if len(candidates) == 1:
                label, how = candidates[0], f"dataset total {faq_total}"
            elif candidates and embedded_labels:
                inter = [c for c in candidates if c in embedded_labels]
                if len(inter) == 1:
                    label, how = inter[0], f"dataset total {faq_total} + embedded labels"
            if label is None and embedded_labels and len(embedded_labels) == 1:
                label, how = next(iter(embedded_labels)), "embedded record labels"
        # fallback: fuzzy-match the contenu file's faqExpertise against snapshot labels
        if label is None and page["faqExpertise"]:
            want = norm_label(page["faqExpertise"]).replace(" ", "")
            for lab in by_label:
                if norm_label(lab).replace(" ", "") == want:
                    label, how = lab, "faqExpertise fuzzy match"
                    break
        if label is None:
            log(f"  ! faq: no label resolved for {slug} (live page: {live}) — skipped")
            continue
        items = [faq_item(r) for r in by_label.get(label, [])]
        items = [i for i in items if i["question"] and i["answer"]]
        used_labels.add(label)
        out = CONTENU / "faq" / f"{slug}.json"
        if slug == "droit-penal":
            existing = load_json(out, [])
            ex_q = {re.sub(r"\s+", " ", e.get("question", "")).strip() for e in existing}
            new_q = {re.sub(r"\s+", " ", i["question"]).strip() for i in items}
            inter = ex_q & new_q
            log(f"  faq droit-penal self-test: existing file has {len(existing)} Q&As, extraction found {len(items)}; "
                f"{len(inter)}/{len(ex_q)} existing questions present in extraction "
                f"({'MATCH' if ex_q <= new_q else 'existing file is NOT a subset of CMS records'}) — file left untouched")
            continue
        write_json(out, items)
        total_written += len(items)
        log(f"  faq {slug}: {len(items)} Q&As (label: {label!r}, via {how})")
    unused = set(by_label) - used_labels
    if unused:
        log(f"faq: labels in CMS not mapped to any expertise file: "
            + ", ".join(f"{u!r} ({len(by_label[u])})" for u in sorted(unused)))
    log(f"faq: {total_written} Q&As written across files (+ droit-penal untouched)")


# ================================================================ extract: poles


def head_meta(html: str) -> tuple[str, str]:
    t = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    title = re.sub(r"\s+", " ", t.group(1)).strip() if t else ""
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    desc = m.group(1) if m else ""
    import html as h  # stdlib html unescape
    return h.unescape(title), h.unescape(desc)


def extract_poles():
    for hub in POLE_HUBS:
        slug = "pole-" + hub.strip("/")
        html = load_html(hub)
        if not html:
            log(f"  ! poles: HTML for {hub} not cached — run crawl")
            continue
        meta_title, meta_desc = head_meta(html)
        dom = parse_dom(html)
        main = next(
            (n for n in walk(dom) if n.tag == "main" or n.attrs.get("data-main-content-parent") == "true"),
            next((n for n in walk(dom) if n.attrs.get("id") == "PAGES_CONTAINER"), dom),
        )

        # expertise cards come from the hub's warmup CMS records (Expertises collection)
        cards = []
        for rec in records(load_warmup(hub), "Expertises").values():
            cards.append({
                "title": rec.get("title"),
                "domaine": rec.get("domaine"),
                "synthese": rec.get("synthseHomepage"),
                "url": rec.get("url"),
                "image": rec.get("image"),
            })
        card_titles_norm = {norm_label(c["title"] or "") for c in cards}

        # DOM order on hubs: card-title h2 repeater first, then h1, then intro paragraph(s).
        h1 = ""
        card_order: list[str] = []
        intro_parts: list[str] = []
        sections: list[dict] = []
        cur = None
        for n in walk(main):
            if n.tag in ("h1", "h2", "h3", "h4"):
                txt = inner_text(n)
                if not txt:
                    continue
                if n.tag == "h1" and not h1:
                    h1 = txt
                elif norm_label(txt) in card_titles_norm:
                    card_order.append(txt)  # repeater card title, content lives in `cards`
                else:
                    cur = {"heading": txt, "level": int(n.tag[1]), "body": ""}
                    sections.append(cur)
            elif n.tag == "p":
                txt = inner_text(n)
                if not txt:
                    continue
                if cur is None:
                    intro_parts.append(txt)
                else:
                    cur["body"] = (cur["body"] + "\n\n" + txt).strip()

        # order cards as displayed
        rank = {norm_label(t): i for i, t in enumerate(card_order)}
        cards.sort(key=lambda c: rank.get(norm_label(c["title"] or ""), 99))

        write_json(CONTENU / "pages" / f"{slug}.json", {
            "slug": slug,
            "path": hub,
            "source": BASE + hub,
            "capturedAt": today(),
            "title": h1,
            "metaTitle": meta_title,
            "metaDescription": meta_desc,
            "intro": "\n\n".join(intro_parts),
            "sections": sections,
            "cards": cards,
        })
        log(f"  poles {slug}: h1={h1!r}, intro {len(intro_parts)} para, "
            f"{len(sections)} extra sections, {len(cards)} cards (order: {card_order})")


# ================================================================ extract: nav


def menu_tree(nav: Node) -> list[dict]:
    """Top-level li[data-item-depth=0] -> {label, href, children[{label, href}]}."""
    items = []
    for li in walk(nav):
        if li.tag != "li" or li.attrs.get("data-item-depth") != "0":
            continue
        anchors = [a for a in walk(li) if a.tag == "a" and a.attrs.get("href")]
        children = []
        seen = set()
        for a in anchors:
            label = inner_text(a)
            href = rel_href(a.attrs.get("href"))
            if not label or re.fullmatch(r"\d+", label):
                continue  # numbering / icon-only anchors
            key = (label, href)
            if key in seen:
                continue
            seen.add(key)
            children.append({"label": label, "href": href})
        # top label = li text up to first child label
        full = inner_text(li)
        top_label = full
        if children:
            idx = full.find(children[0]["label"])
            # the first child label can equal the top label (plain links)
            if idx > 0:
                top_label = full[:idx].strip(" 1234567890")
        top_label = re.sub(r"\s*\d+$", "", top_label).strip()
        if len(children) == 1 and children[0]["label"] == full:
            items.append({"label": full, "href": children[0]["href"]})
        else:
            items.append({"label": top_label, "href": None if len(children) > 1 else (children[0]["href"] if children else None), "children": children})
    return items


def extract_nav():
    html = load_html("/")
    if not html:
        log("  ! nav: homepage HTML not cached — run crawl")
        return
    dom = parse_dom(html)
    navs = [n for n in walk(dom) if n.tag == "nav" and n.attrs.get("data-hook") == "menu-root"]
    mega = site = mobile = []
    for nav in navs:
        aria = (nav.attrs.get("aria-label") or "").lower()
        tree = menu_tree(nav)
        if "mobile" in aria or "déroulant" in aria:
            mobile = tree
        elif aria == "site":
            site = tree
        else:
            mega = tree

    # utility dropdowns rendered as ul.wixui-dropdown-menu inside dataItem-*-submenu / -dropdown groups
    dropdowns = []
    seen_groups = set()
    for ul in walk(dom):
        if ul.tag != "ul" or not has_class(ul, "wixui-dropdown-menu"):
            continue
        grp = ul.parent
        while grp and not (grp.attrs.get("id", "").startswith("dataItem-")):
            grp = grp.parent
        if grp is None:
            continue
        gid = re.sub(r"-(submenu|dropdown)$", "", grp.attrs.get("id", ""))
        if gid in seen_groups:
            continue
        seen_groups.add(gid)
        # aria-label lives on the -dropdown container variant
        label_node = grp
        while label_node and not label_node.attrs.get("aria-label"):
            label_node = label_node.parent
        items = [
            {"label": inner_text(a), "href": rel_href(a.attrs.get("href"))}
            for a in walk(ul) if a.tag == "a" and a.attrs.get("href")
        ]
        dropdowns.append({
            "id": gid,
            "label": (label_node.attrs.get("aria-label") if label_node else None),
            "items": items,
        })

    mega_children = sum(len(i.get("children", [])) for i in mega)
    dd_items = sum(len(d["items"]) for d in dropdowns)
    nav_doc = {
        "source": BASE + "/",
        "capturedAt": today(),
        "counts": {
            "megaMenuColumns": len(mega),
            "megaMenuItems": mega_children,
            "siteMenuItems": len(site),
            "dropdownMenus": len(dropdowns),
            "dropdownItems": dd_items,
            "mobileTopItems": len(mobile),
        },
        "megaMenu": mega,
        "siteMenu": site,
        "utilityDropdowns": dropdowns,
        "mobileMenu": mobile,
    }
    write_json(CONTENU / "navigation.json", nav_doc)
    log(f"  nav: {len(mega)} mega columns / {mega_children} items, site {len(site)}, "
        f"{len(dropdowns)} dropdown groups / {dd_items} items, mobile {len(mobile)} top items")


# ================================================================ extract: stats


def extract_stats():
    posts = load_collection("Blog/Posts")
    if not posts:
        log("stats: Blog/Posts snapshot missing (run crawl first)")
        return
    stats = {}
    for p in posts:
        slug = nfc(p.get("slug") or "")
        if not slug:
            continue
        stats[slug] = {
            "views": int(p.get("viewCount") or 0),
            "comments": int(p.get("commentCount") or 0),
            "likes": int(p.get("likeCount") or 0),
        }
    write_json(CONTENU / "stats-posts.json", stats, sort_keys=True)
    tot_v = sum(s["views"] for s in stats.values())
    log(f"  stats: {len(stats)} posts -> contenu/stats-posts.json (total views {tot_v})")


# ================================================================ extract: affaires


def extract_affaires():
    w = load_warmup("/nos-affaires")
    if not w:
        log("affaires: /nos-affaires not cached (run crawl)")
        return
    ds = data_store(w)
    posts = records(w, "Blog/Posts")
    membres = [rec.get("profil") for rec in records(w, "Membres").values() if rec.get("profil")]
    # dataset totals for the affaires repeater (the Blog/Posts dataset on this page)
    dataset_meta = None
    ordered_ids: list[str] = []
    for info in ds.get("recordInfosByDatasetId", {}).values():
        ids = info.get("itemIds") or []
        if ids and all(i in posts for i in ids):
            dataset_meta = info.get("datasetSize")
            ordered_ids = ids
            break
    items = []
    for rid in (ordered_ids or list(posts)):
        rec = posts.get(rid)
        if not rec:
            continue
        cat = rec.get("mainCategory")
        if isinstance(cat, dict):
            cat = cat.get("label")
        items.append({
            "slug": nfc(rec.get("slug") or ""),
            "title": rec.get("title"),
            "excerpt": rec.get("excerpt"),
            "publishedDate": rec.get("publishedDate"),
            "category": cat,
            "coverImage": rec.get("coverImage"),
            "postPageUrl": rec.get("postPageUrl"),
            "timeToRead": rec.get("timeToRead"),
            "viewCount": int(rec.get("viewCount") or 0),
        })
    write_json(CONTENU / "affaires-recentes.json", {
        "source": BASE + "/nos-affaires",
        "capturedAt": today(),
        "dataset": dataset_meta,  # e.g. {total: 366, loaded: 20} — repeater paginated at 20
        "membresFilter": membres,
        "items": items,
    })
    log(f"  affaires: {len(items)} embedded items (dataset {dataset_meta}), {len(membres)} membres filters")


# ================================================================ inventory


def walk_ricos(node, fn):
    fn(node)
    for c in node.get("nodes") or []:
        walk_ricos(c, fn)


def cmd_inventory(_args):
    ricos_dir = CONTENU / "ricos"
    files = sorted(ricos_dir.glob("*.json"))
    if not files:
        log("inventory: no contenu/ricos/*.json (run extract --what ricos first)")
        return
    node_types: Counter = Counter()
    deco_types: Counter = Counter()
    data_keys: Counter = Counter()
    example: dict[str, str] = {}
    per_post_tables: Counter = Counter()
    per_post_media_list: Counter = Counter()

    for f in files:
        doc = load_json(f)
        slug = doc["slug"]
        counts = Counter()

        def visit(n, slug=slug, counts=counts):
            t = n.get("type")
            if t:
                node_types[t] += 1
                counts[t] += 1
                example.setdefault(f"node:{t}", slug)
            for k in n:
                if k.endswith("Data") and k not in ("textData",):
                    data_keys[k] += 1
                    example.setdefault(f"data:{k}", slug)
            td = n.get("textData") or {}
            for d in td.get("decorations") or []:
                dt = d.get("type")
                if dt:
                    deco_types[dt] += 1
                    example.setdefault(f"deco:{dt}", slug)

        walk_ricos(doc["ricos"], visit)
        per_post_tables[slug] = counts.get("TABLE", 0)
        per_post_media_list[slug] = (
            counts.get("IMAGE", 0)
            + counts.get("ORDERED_LIST", 0)
            + counts.get("BULLETED_LIST", 0)
        )

    top_tables = per_post_tables.most_common(5)
    top_media = per_post_media_list.most_common(5)
    inv = {
        "generatedAt": today(),
        "postsScanned": len(files),
        "nodeTypes": {t: {"count": c, "exampleSlug": example.get(f"node:{t}")} for t, c in sorted(node_types.items())},
        "decorationTypes": {t: {"count": c, "exampleSlug": example.get(f"deco:{t}")} for t, c in sorted(deco_types.items())},
        "nodeDataKeys": {t: {"count": c, "exampleSlug": example.get(f"data:{t}")} for t, c in sorted(data_keys.items())},
        "visualTestRepresentatives": {
            "mostTableNodes": [{"slug": s, "tables": c} for s, c in top_tables if c],
            "mostImageAndListNodes": [{"slug": s, "imagePlusListNodes": c} for s, c in top_media],
        },
    }
    write_json(CONTENU / "reference" / "ricos-inventory.json", inv)
    log(f"inventory: {len(files)} trees scanned -> contenu/reference/ricos-inventory.json")
    log(f"  node types: {dict(node_types)}")
    log(f"  table-heaviest: {top_tables[:3]}")
    log(f"  image+list-heaviest: {top_media[:3]}")


# ================================================================ debug


def describe(obj, depth=0, max_depth=3):
    pad = "  " * depth
    if depth > max_depth:
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, dict):
                log(f"{pad}{k}: dict({len(v)})")
                describe(v, depth + 1, max_depth)
            elif isinstance(v, list):
                log(f"{pad}{k}: list({len(v)})")
                if v:
                    describe(v[0], depth + 1, max_depth)
            else:
                log(f"{pad}{k}: {type(v).__name__} = {str(v)[:80]!r}")
    elif isinstance(obj, list):
        log(f"{pad}[0..{len(obj) - 1}]")
        if obj:
            describe(obj[0], depth + 1, max_depth)
    else:
        log(f"{pad}{type(obj).__name__} = {str(obj)[:80]!r}")


def cmd_debug(args):
    data = load_warmup(args.path)
    if data is None:
        sys.exit(f"not cached: {args.path}")
    if args.dump:
        out = CACHE / "debug-dump.json"
        write_json(out, data)
        log(f"dumped to {out}")
        return
    describe(data, max_depth=args.depth)


# ================================================================ main


EXTRACTORS = {
    "ricos": extract_ricos,
    "faq": extract_faq,
    "poles": extract_poles,
    "nav": extract_nav,
    "stats": extract_stats,
    "affaires": extract_affaires,
}


def cmd_extract(args):
    names = list(EXTRACTORS) if args.what == "all" else [args.what]
    for name in names:
        log(f"== extract {name}")
        try:
            EXTRACTORS[name]()
        except Exception as exc:  # noqa: BLE001
            import traceback
            log(f"  ! extractor {name} crashed: {exc}")
            traceback.print_exc()


def main():
    ap = argparse.ArgumentParser(description="Harvest wix-warmup-data from jplouton-avocat.fr")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("crawl")
    c.add_argument("--only", choices=["posts", "pages", "all"], default="all")
    c.add_argument("--limit", type=int)
    c.add_argument("--force", action="store_true")
    c.add_argument("--paths", nargs="*", help="debug: crawl only these paths")
    c.set_defaults(func=cmd_crawl)

    e = sub.add_parser("extract")
    e.add_argument("--what", choices=[*EXTRACTORS, "all"], default="all")
    e.set_defaults(func=cmd_extract)

    i = sub.add_parser("inventory")
    i.set_defaults(func=cmd_inventory)

    d = sub.add_parser("debug")
    d.add_argument("--path", required=True)
    d.add_argument("--dump", action="store_true")
    d.add_argument("--depth", type=int, default=3)
    d.set_defaults(func=cmd_debug)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

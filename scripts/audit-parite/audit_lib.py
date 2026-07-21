#!/usr/bin/env python3
"""Outil d'audit de parité Wix ↔ Next (lecture seule).

Compare le SENS et la STRUCTURE (texte, titres H1–H4, listes, liens, SEO),
pas le markup technique. Ne modifie rien : il lit deux pages et rapporte les
écarts. Voir docs/etat/audit-parite-wix-next.md.

Usage :
    python3 scripts/audit-parite/audit_lib.py <chemin-url>   # ex: /post/mon-slug
    (compare https://www.jplouton-avocat.fr<chemin> à http://localhost:3000<chemin>)
"""
import sys
import re
import html as htmllib
import unicodedata
import difflib
import urllib.request
import urllib.parse
from html.parser import HTMLParser

WIX = "https://www.jplouton-avocat.fr"
NEXT = "http://localhost:3000"

BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p", "li", "blockquote", "td", "th",
              "figcaption"}
HEADING_TAGS = {"h1", "h2", "h3", "h4"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template"}

# Chrome (nav/footer/cookies) à ignorer : présent des deux côtés ou propre à Wix.
CHROME = {
    "accueil", "contact", "menu", "rechercher", "recherche", "fermer",
    "nous appeler", "je prends rendez-vous", "je prends rendez-vous !",
    "prendre rendez-vous", "nous contacter", "retour", "voir tout",
    "défense pénale", "indemnisation des victimes",
    "droit des contrats et des personnes", "affaires", "médias", "ressources",
    "équipe", "notre cabinet", "honoraires", "mentions légales",
    "politique de confidentialité", "cookies", "plan du site",
}


def _encode_url(url):
    parts = urllib.parse.urlsplit(url)
    path = urllib.parse.quote(parts.path, safe="/%")
    return urllib.parse.urlunsplit(
        (parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def fetch(url):
    req = urllib.request.Request(_encode_url(url),
                                 headers={"User-Agent": "Mozilla/5.0 (audit-parite)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("latin-1")


def norm(s):
    s = htmllib.unescape(s)
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u00a0", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


class Extractor(HTMLParser):
    def __init__(self, region=None):
        super().__init__(convert_charrefs=True)
        # region: ("attr", name, value) container, or ("tag", name) first match, or None
        self.region = region
        self.in_region = region is None
        self.region_done = False
        self.region_depth = None
        self.depth = 0
        self.skip_depth = 0
        self.title = None
        self._in_title = False
        self.meta_desc = None
        self.canonical = None
        self.blocks = []              # (tag, text)
        self.headings = []            # (tag, text)
        self.links = []               # (href, text)
        self._cur = None              # current block tag
        self._buf = []
        self._href = None
        self._link_buf = []

    def handle_starttag(self, tag, attrs):
        self.depth += 1
        a = dict(attrs)
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta" and a.get("name", "").lower() == "description":
            self.meta_desc = norm(a.get("content", ""))
        if tag == "link" and "canonical" in a.get("rel", "").lower():
            self.canonical = a.get("href", "")
        if self.region and not self.in_region and not self.region_done:
            r = self.region
            hit = ((r[0] == "attr" and a.get(r[1]) == r[2])
                   or (r[0] == "tag" and tag == r[1]))
            if hit:
                self.in_region = True
                self.region_depth = self.depth
        if tag == "a":
            self._href = a.get("href")
            self._link_buf = []
        if tag in BLOCK_TAGS and self.in_region and self.skip_depth == 0:
            self._flush()
            self._cur = tag
            self._buf = []

    def handle_endtag(self, tag):
        if tag in BLOCK_TAGS and self._cur == tag:
            self._flush()
        if tag == "a" and self._href is not None:
            t = norm("".join(self._link_buf))
            if self.in_region and self.skip_depth == 0:
                self.links.append((self._href, t))
            self._href = None
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
        if tag == "title":
            self._in_title = False
        if (self.region and self.in_region and self.region_depth
                and self.depth == self.region_depth):
            self.in_region = False
            self.region_done = True
            self.region_depth = None
        self.depth -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title = norm((self.title or "") + data)
        if self.skip_depth:
            return
        if self._cur is not None:
            self._buf.append(data)
        if self._href is not None:
            self._link_buf.append(data)

    def _flush(self):
        if self._cur is None:
            return
        t = norm("".join(self._buf))
        if t:
            self.blocks.append((self._cur, t))
            if self._cur in HEADING_TAGS:
                self.headings.append((self._cur, t))
        self._cur = None
        self._buf = []


def extract(url, region=None):
    p = Extractor(region=region)
    p.feed(fetch(url))
    p._flush()
    return p


def _blocks_text(p, drop_chrome=True):
    out = []
    for tag, t in p.blocks:
        if drop_chrome and t.lower() in CHROME:
            continue
        out.append(t)
    return out


def compare(path, wix_region=None, next_region=None):
    wix = extract(WIX + path, region=wix_region)
    nxt = extract(NEXT + path, region=next_region)
    report = {"path": path, "seo": {}, "headings": {}, "body": {}, "links": {}}

    # SEO
    report["seo"]["title_wix"] = wix.title
    report["seo"]["title_next"] = nxt.title
    report["seo"]["title_match"] = (wix.title == nxt.title)
    report["seo"]["desc_wix"] = wix.meta_desc
    report["seo"]["desc_next"] = nxt.meta_desc
    report["seo"]["desc_match"] = (wix.meta_desc == nxt.meta_desc)
    cw = urllib.parse.unquote(wix.canonical or "")
    cn = urllib.parse.unquote(nxt.canonical or "")
    report["seo"]["canonical_wix"] = wix.canonical
    report["seo"]["canonical_next"] = nxt.canonical
    report["seo"]["canonical_match"] = (cw == cn)

    # Headings (ordered)
    hw = [t for _, t in wix.headings if t.lower() not in CHROME]
    hn = [t for _, t in nxt.headings if t.lower() not in CHROME]
    report["headings"]["wix"] = hw
    report["headings"]["next"] = hn
    report["headings"]["wix_only"] = _missing(hw, hn)
    report["headings"]["next_only"] = _missing(hn, hw)

    # Body blocks
    bw = _blocks_text(wix)
    bn = _blocks_text(nxt)
    report["body"]["wix_count"] = len(bw)
    report["body"]["next_count"] = len(bn)
    report["body"]["wix_only"] = _missing(bw, bn)
    report["body"]["next_only"] = _missing(bn, bw)

    return report


def _missing(a, b, threshold=0.90):
    """Blocs de a sans correspondance floue dans b."""
    bset = b[:]
    out = []
    for x in a:
        best = 0.0
        for y in bset:
            r = difflib.SequenceMatcher(None, x.lower(), y.lower()).ratio()
            if r > best:
                best = r
                if best >= threshold:
                    break
        if best < threshold:
            out.append(x)
    return out


def print_report(rep):
    p = rep["path"]
    print(f"\n{'='*78}\nURL {p}\n{'='*78}")
    s = rep["seo"]
    def mk(ok): return "OK " if ok else "DIFF"
    print(f"[{mk(s['title_match'])}] <title>")
    if not s["title_match"]:
        print(f"    Wix : {s['title_wix']}")
        print(f"    Next: {s['title_next']}")
    print(f"[{mk(s['desc_match'])}] meta description")
    if not s["desc_match"]:
        print(f"    Wix : {s['desc_wix']}")
        print(f"    Next: {s['desc_next']}")
    print(f"[{mk(s['canonical_match'])}] canonical")
    if not s["canonical_match"]:
        print(f"    Wix : {s['canonical_wix']}")
        print(f"    Next: {s['canonical_next']}")
    h = rep["headings"]
    print(f"\nTitres : Wix={len(h['wix'])} Next={len(h['next'])} "
          f"| manquants(Next)={len(h['wix_only'])} en-trop(Next)={len(h['next_only'])}")
    for x in h["wix_only"]:
        print(f"    - manquant côté Next : {x[:110]}")
    for x in h["next_only"]:
        print(f"    + en trop côté Next  : {x[:110]}")
    b = rep["body"]
    print(f"\nCorps : blocs Wix={b['wix_count']} Next={b['next_count']} "
          f"| omissions={len(b['wix_only'])} ajouts={len(b['next_only'])}")
    for x in b["wix_only"]:
        print(f"    - OMISSION (Wix→absent Next) : {x[:140]}")
    for x in b["next_only"]:
        print(f"    + AJOUT (Next→absent Wix)    : {x[:140]}")


if __name__ == "__main__":
    import urllib.parse
    path = sys.argv[1] if len(sys.argv) > 1 else "/"
    if path.startswith("/post/"):
        wreg = ("attr", "data-hook", "post-description")
        nreg = ("tag", "article")
    else:
        wreg = None
        nreg = ("tag", "main")
    print_report(compare(path, wix_region=wreg, next_region=nreg))

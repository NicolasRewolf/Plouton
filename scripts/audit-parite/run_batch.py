#!/usr/bin/env python3
"""Lance l'audit de parité sur un lot d'URLs et classe chacune.

Lecture seule. Compare Wix (live) et Next (localhost:3000).
Sortie : une ligne de statut par URL + le détail des écarts réels.

Usage :
    python3 scripts/audit-parite/run_batch.py <chemin> [<chemin> ...]
    python3 scripts/audit-parite/run_batch.py --posts-top 20
    python3 scripts/audit-parite/run_batch.py --structure
"""
import sys
import json
import os

sys.path.insert(0, os.path.dirname(__file__))
from audit_lib import compare, print_report  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

STRUCTURE = [
    "/",
    "/notre-cabinet",
    "/honoraires-rendez-vous",
    "/comprendre-le-droit",
    "/nos-affaires",
    "/medias",
    "/defense-penale",
    "/indemnisation-des-victimes",
    "/droit-des-contrats-et-des-personnes",
    "/mentions-legales",
    "/politique-de-confidentialite",
    "/cookies",
]


def regions(path):
    if path.startswith("/post/"):
        return ("attr", "data-hook", "post-description"), ("tag", "article")
    return None, ("tag", "main")


def classify(rep):
    s = rep["seo"]
    seo_ok = s["title_match"] and s["desc_match"] and s["canonical_match"]
    h_missing = len(rep["headings"]["wix_only"])
    b_missing = len(rep["body"]["wix_only"])
    if seo_ok and h_missing == 0 and b_missing == 0:
        return "conforme"
    return "écart"


def ecarts_resume(rep):
    out = []
    s = rep["seo"]
    if not s["title_match"]:
        out.append("title SEO diffère")
    if not s["desc_match"]:
        out.append("meta description diffère")
    if not s["canonical_match"]:
        out.append("canonical diffère")
    if rep["headings"]["wix_only"]:
        out.append(f"{len(rep['headings']['wix_only'])} titre(s) absent(s) côté Next")
    if rep["body"]["wix_only"]:
        out.append(f"{len(rep['body']['wix_only'])} bloc(s) de texte Wix absent(s) côté Next")
    return " ; ".join(out) if out else "—"


def post_views():
    p = os.path.join(ROOT, "contenu", "sources", "wix", "stats-posts.json")
    return json.load(open(p, encoding="utf-8"))


def top_posts(n):
    stats = post_views()
    ranked = sorted(stats.items(), key=lambda kv: kv[1].get("views", 0), reverse=True)
    return [f"/post/{slug}" for slug, _ in ranked[:n]]


def main(argv):
    if not argv:
        print(__doc__)
        return
    if argv[0] == "--structure":
        paths = STRUCTURE
    elif argv[0] == "--posts-top":
        paths = top_posts(int(argv[1]))
    else:
        paths = argv

    results = []
    for path in paths:
        wreg, nreg = regions(path)
        try:
            rep = compare(path, wix_region=wreg, next_region=nreg)
            status = classify(rep)
            results.append((path, status, ecarts_resume(rep)))
            print_report(rep)
        except Exception as e:  # noqa: BLE001
            results.append((path, "bloquée", f"erreur audit : {e}"))
            print(f"\n[BLOQUÉE] {path} — {e}")

    print("\n\n" + "=" * 78)
    print("RÉSUMÉ DU LOT (à reporter dans le registre)")
    print("=" * 78)
    for path, status, resume in results:
        print(f"| `{path}` | {status} | {resume} |")


if __name__ == "__main__":
    main(sys.argv[1:])

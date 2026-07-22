#!/usr/bin/env python3
"""Classement des URLs les plus consultées depuis Cooked (lecture seule).

Source : vue `gsc_path_metrics_28d` du projet Supabase de Cooked (clics Google
Search Console, 28 jours glissants). Signal réel « pages les plus consultées »,
tous types de pages confondus.

Requiert les secrets d'environnement :
    COOKED_SUPABASE_URL, COOKED_SUPABASE_SECRET_KEY

Usage :
    python3 scripts/audit-parite/cooked_rank.py         # imprime le top 40
    (importé par build_inventaire.py pour classer l'inventaire)
"""
import os
import json
import urllib.request


def available():
    return bool(os.environ.get("COOKED_SUPABASE_URL")
                and os.environ.get("COOKED_SUPABASE_SECRET_KEY"))


def fetch_ranking(limit=600):
    """Retourne [{path, clicks, impressions, position}], clics décroissants."""
    url = os.environ["COOKED_SUPABASE_URL"].rstrip("/")
    key = os.environ["COOKED_SUPABASE_SECRET_KEY"]
    q = ("gsc_path_metrics_28d?select=path,clicks_total,impressions_total,"
         f"position_avg&order=clicks_total.desc&limit={limit}")
    req = urllib.request.Request(f"{url}/rest/v1/{q}",
                                 headers={"apikey": key,
                                          "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=45) as r:
        rows = json.load(r)
    return [{"path": x["path"], "clicks": x["clicks_total"],
             "impressions": x["impressions_total"],
             "position": x["position_avg"]} for x in rows]


if __name__ == "__main__":
    if not available():
        raise SystemExit("Cooked indisponible : secrets COOKED_SUPABASE_* absents.")
    rows = fetch_ranking()
    print(f"{len(rows)} pages avec clics GSC (28 j)\n")
    for i, r in enumerate(rows[:40], 1):
        print(f"{i:>3}. clics={r['clicks']:>4} imp={r['impressions']:>6} "
              f"pos={r['position']:.1f}  {r['path']}")

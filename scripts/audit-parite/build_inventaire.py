#!/usr/bin/env python3
"""Génère / met à jour l'inventaire d'URLs classé par consultation (lecture seule).

Sortie : docs/etat/audit-parite-inventaire.csv
Colonnes : rang;chemin;type;clics_gsc_28j;vues_wix;statut;date_controle;ecarts

Priorité :
  - si Cooked est accessible (secrets COOKED_SUPABASE_*) → rang = clics Google
    Search Console 28 j (vue `gsc_path_metrics_28d`), tous types de pages ;
  - sinon → repli sur les vues Wix (contenu/sources/wix/stats-posts.json).

Les statuts déjà saisis (statut / date_controle / ecarts) sont **préservés**
par chemin : régénérer l'inventaire ne perd aucun contrôle déjà fait.
"""
import json
import os
import csv

import cooked_rank

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "docs", "etat", "audit-parite-inventaire.csv")

STRUCTURE = [
    ("/", "cabinet"),
    ("/notre-cabinet", "cabinet"),
    ("/honoraires-rendez-vous", "cabinet"),
    ("/comprendre-le-droit", "blog-nav"),
    ("/nos-affaires", "blog-nav"),
    ("/medias", "blog-nav"),
    ("/defense-penale", "hub"),
    ("/indemnisation-des-victimes", "hub"),
    ("/droit-des-contrats-et-des-personnes", "hub"),
    ("/defense-penale/droit-penal", "expertise"),
    ("/defense-penale/proces-criminel", "expertise"),
    ("/defense-penale/trafic-de-stupefiants", "expertise"),
    ("/defense-penale/violences-conjugales-et-feminicides", "expertise"),
    ("/defense-penale/droit-penal-des-affaires", "expertise"),
    ("/defense-penale/defense-des-elus", "expertise"),
    ("/indemnisation-des-victimes/victimes-de-delits-ou-crimes", "expertise"),
    ("/indemnisation-des-victimes/accidents-de-la-route", "expertise"),
    ("/indemnisation-des-victimes/droit-et-accidents-du-travail", "expertise"),
    ("/indemnisation-des-victimes/accidents-et-erreurs-medicales", "expertise"),
    ("/indemnisation-des-victimes/accidents-de-la-vie-courante", "expertise"),
    ("/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels", "expertise"),
    ("/droit-des-contrats-et-des-personnes/defense-des-consommateurs", "expertise"),
    ("/droit-des-contrats-et-des-personnes/droit-de-la-famille", "expertise"),
    ("/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux", "expertise"),
    ("/mentions-legales", "cabinet"),
    ("/politique-de-confidentialite", "cabinet"),
    ("/cookies", "cabinet"),
]


def load_existing_status():
    status = {}
    if not os.path.exists(OUT):
        return status
    with open(OUT, encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter=";"):
            status[row["chemin"]] = (row.get("statut", "à faire"),
                                     row.get("date_controle", ""),
                                     row.get("ecarts", ""))
    return status


def main():
    stats = json.load(open(os.path.join(ROOT, "contenu", "sources", "wix",
                                         "stats-posts.json"), encoding="utf-8"))
    wix_views = {f"/post/{s}": v.get("views", 0) for s, v in stats.items()}
    types = {p: t for p, t in STRUCTURE}

    universe = [p for p, _ in STRUCTURE] + list(wix_views.keys())
    universe = list(dict.fromkeys(universe))

    clicks = {}
    src = "vues Wix (repli)"
    if cooked_rank.available():
        try:
            for r in cooked_rank.fetch_ranking():
                clicks[r["path"]] = r["clicks"]
            src = "clics GSC 28 j (Cooked)"
        except Exception as e:  # noqa: BLE001
            print(f"⚠️  Cooked injoignable ({e}) — repli sur les vues Wix.")

    def sort_key(p):
        return (-(clicks.get(p, 0)), -(wix_views.get(p, 0)), p)

    universe.sort(key=sort_key)

    status = load_existing_status()
    rows = []
    for rank, p in enumerate(universe, 1):
        typ = types.get(p, "post")
        st, dt, ec = status.get(p, ("à faire", "", ""))
        rows.append([rank, p, typ, clicks.get(p, ""), wix_views.get(p, ""),
                     st, dt, ec])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["rang", "chemin", "type", "clics_gsc_28j", "vues_wix",
                    "statut", "date_controle", "ecarts"])
        w.writerows(rows)
    print(f"écrit {len(rows)} lignes → {OUT}  (classement : {src})")


if __name__ == "__main__":
    main()

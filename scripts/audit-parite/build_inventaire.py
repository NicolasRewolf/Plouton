#!/usr/bin/env python3
"""Génère l'inventaire d'URLs classé par popularité (lecture seule).

Sortie : docs/etat/audit-parite-inventaire.csv
Colonnes : rang;chemin;type;vues_wix;statut;date_controle;ecarts

Priorité (Cooked inaccessible en cloud agent — voir le registre) :
  1. pages structure / hub / expertise (piliers SEO + points d'entrée)
  2. posts triés par vues Wix réelles (contenu/sources/wix/stats-posts.json)
"""
import json
import os
import csv

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


def main():
    stats = json.load(open(os.path.join(ROOT, "contenu", "sources", "wix",
                                         "stats-posts.json"), encoding="utf-8"))
    ranked = sorted(stats.items(), key=lambda kv: kv[1].get("views", 0), reverse=True)

    rows = []
    rank = 0
    for path, typ in STRUCTURE:
        rank += 1
        rows.append([rank, path, typ, "", "à faire", "", ""])
    for slug, v in ranked:
        rank += 1
        rows.append([rank, f"/post/{slug}", "post", v.get("views", 0),
                     "à faire", "", ""])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["rang", "chemin", "type", "vues_wix", "statut",
                    "date_controle", "ecarts"])
        w.writerows(rows)
    print(f"écrit {len(rows)} lignes → {OUT}")


if __name__ == "__main__":
    main()

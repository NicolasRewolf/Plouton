#!/usr/bin/env python3
"""Rejoue l'export 301 Wix dans Next.js.

Lit contenu/imports/Export_URL_Redirigees.csv (161 règles) et produit
contenu/redirects.json consommé par site/next.config.ts.

- Ignore les règles inactives.
- Déduplique (dernière règle gagne, comme Wix).
- Détecte les chaînes A→B→C et les aplatit en A→C (Google préfère un seul saut).
- Refuse les boucles.
"""
import csv
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "contenu" / "imports" / "Export_URL_Redirigees.csv"
OUT = ROOT / "contenu" / "redirects.json"


def norm(p: str) -> str:
    p = unicodedata.normalize("NFC", p.strip())
    if not p.startswith("/"):
        p = "/" + p
    # Wix exporte parfois avec slash final — on normalise sans (Next matche exact)
    if len(p) > 1 and p.endswith("/"):
        p = p.rstrip("/")
    return p


def main() -> None:
    rows = list(csv.DictReader(CSV.open(encoding="utf-8-sig")))
    rules: dict[str, str] = {}
    skipped = 0
    for r in rows:
        if (r.get("Statut de la redirection") or "").strip().lower() != "active":
            skipped += 1
            continue
        src = norm(r["Ancienne URL"])
        dst = norm(r["Nouvelle URL"])
        if src == dst:
            skipped += 1
            continue
        rules[src] = dst

    # Aplatir les chaînes
    flattened = 0
    for src in list(rules):
        seen = {src}
        dst = rules[src]
        while dst in rules:
            if rules[dst] in seen:
                print(f"BOUCLE détectée: {src} → … → {dst}", file=sys.stderr)
                sys.exit(1)
            seen.add(dst)
            dst = rules[dst]
            flattened += 1
        rules[src] = dst

    out = [
        {"source": src, "destination": dst, "permanent": True}
        for src, dst in sorted(rules.items())
    ]
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(out)} règles écrites ({skipped} ignorées, {flattened} sauts aplatis) → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

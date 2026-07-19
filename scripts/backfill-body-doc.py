#!/usr/bin/env python3
"""P1-C — Backfill body_doc depuis Ricos (via convertisseur Node).

Génère contenu/body-docs/{slug}.json puis optionnellement pousse en DB.

Usage :
  # Convertit les 422 Ricos → JSON ProseMirror (local)
  node --import tsx scripts/backfill-body-doc.mjs --write-files

  # Ou via python wrapper qui appelle node
  python3 scripts/backfill-body-doc.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RICOS = ROOT / "contenu" / "ricos"
OUT = ROOT / "contenu" / "body-docs"
SITE = ROOT / "site"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    files = sorted(RICOS.glob("*.json"))
    if args.limit:
        files = files[: args.limit]
    print(f"{len(files)} fichiers Ricos")

    # Délègue au runner Node (TipTap/TS dans le site)
    cmd = [
        "node",
        str(ROOT / "scripts" / "backfill-body-doc.mjs"),
        "--limit",
        str(args.limit or 0),
    ]
    if args.dry_run:
        cmd.append("--dry-run")
    else:
        cmd.append("--write-files")

    r = subprocess.run(cmd, cwd=str(ROOT), check=False)
    return r.returncode


if __name__ == "__main__":
    raise SystemExit(main())

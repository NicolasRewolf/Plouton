#!/usr/bin/env python3
"""P1-H — Régénère metaDescription articles (élision / trop courts).

Remplace metaDescription < 80 car. ou finissant en élision par un extrait propre.
Écrit aussi un rapport CI-friendly (exit 1 si encore des élisions après run).

Usage :
  python3 scripts/regen-meta-descriptions.py --dry-run
  python3 scripts/regen-meta-descriptions.py
  python3 scripts/regen-meta-descriptions.py --check   # CI : échoue si élision
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "contenu" / "articles"
ELISION = re.compile(r"\b(l|d|s|n|c|j|m|t|qu|jusqu|aujourd|lorsqu|puisqu)$", re.I)


def tidy_excerpt(ex: str) -> str:
    ex = (ex or "").strip()
    if len(ex) <= 160:
        return ex
    cut = ex[:157]
    last = max(cut.rfind(". "), cut.rfind(" "))
    return (cut[:last] if last > 80 else cut).rstrip() + "…"


def needs_fix(md: str) -> bool:
    md = (md or "").strip()
    if len(md) < 80:
        return True
    return bool(ELISION.search(md))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--check", action="store_true", help="CI : liste les metas cassées")
    args = parser.parse_args()

    bad = []
    fixed = 0
    for path in sorted(ARTICLES.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        md = data.get("metaDescription") or ""
        if not needs_fix(md):
            continue
        bad.append(data.get("slug") or path.stem)
        if args.check:
            continue
        new_md = tidy_excerpt(data.get("excerpt") or "")
        if not new_md or needs_fix(new_md):
            # Fallback titre
            new_md = tidy_excerpt(
                f"{data.get('title', '')}. {data.get('excerpt') or ''}"
            )
        if args.dry_run:
            print(f"FIX {data.get('slug')}: {md[:40]!r} → {new_md[:60]!r}")
            fixed += 1
            continue
        data["metaDescription"] = new_md
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        fixed += 1

    if args.check:
        print(f"metas fragiles : {len(bad)}")
        for s in bad[:30]:
            print(f"  {s}")
        return 1 if bad else 0

    print(f"{'would fix' if args.dry_run else 'fixed'} : {fixed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

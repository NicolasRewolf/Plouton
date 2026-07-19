#!/usr/bin/env python3
"""Réconcilie posts.view_count ← max(DB, stats-posts.json) puis archive le JSON.

Usage :
  python3 scripts/reconcile-view-counts.py --dry-run
  python3 scripts/reconcile-view-counts.py
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    import certifi
    _SSL = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL = ssl.create_default_context()

ROOT = Path(__file__).resolve().parents[1]
STATS = ROOT / "contenu" / "stats-posts.json"
ENV_CANDIDATES = [
    ROOT / "site" / ".env.local",
    ROOT / "site" / ".env",
]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for path in ENV_CANDIDATES:
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    for k in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not STATS.is_file():
        print("pas de stats-posts.json — rien à faire")
        return 0
    stats = json.loads(STATS.read_text(encoding="utf-8"))
    # accepte {slug: n} ou [{slug, views}]
    by_slug: dict[str, int] = {}
    if isinstance(stats, dict):
        for k, v in stats.items():
            if isinstance(v, (int, float)):
                by_slug[k] = int(v)
            elif isinstance(v, dict) and "views" in v:
                by_slug[k] = int(v["views"])
    elif isinstance(stats, list):
        for row in stats:
            slug = row.get("slug")
            if slug:
                by_slug[slug] = int(row.get("views") or row.get("viewCount") or 0)

    print(f"{len(by_slug)} slugs dans stats-posts.json")
    if args.dry_run:
        sample = list(by_slug.items())[:5]
        for s, n in sample:
            print(f"  {s}: {n}")
        return 0

    env = load_env()
    url, key = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        print("SUPABASE manquant — maj des JSON articles seulement")
        # Met à jour viewCount dans articles JSON
        art_dir = ROOT / "contenu" / "articles"
        n = 0
        for slug, views in by_slug.items():
            # fuzzy file match
            for p in art_dir.glob("*.json"):
                d = json.loads(p.read_text(encoding="utf-8"))
                if d.get("slug") != slug:
                    continue
                cur = int(d.get("viewCount") or 0)
                if views > cur:
                    d["viewCount"] = views
                    p.write_text(
                        json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
                    n += 1
                break
        print(f"JSON articles maj : {n}")
        return 0

    # Patch PostgREST un par un (max)
    updated = 0
    for slug, views in by_slug.items():
        endpoint = (
            f"{url.rstrip('/')}/rest/v1/posts?slug=eq.{urllib.parse.quote(slug)}"
            f"&select=view_count"
        )
        req = urllib.request.Request(
            endpoint,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
            },
        )
        try:
            with urllib.request.urlopen(req, context=_SSL) as resp:
                rows = json.loads(resp.read().decode())
        except Exception as e:  # noqa: BLE001
            print(f"skip {slug}: {e}")
            continue
        if not rows:
            continue
        cur = int(rows[0].get("view_count") or 0)
        if views <= cur:
            continue
        patch = urllib.request.Request(
            f"{url.rstrip('/')}/rest/v1/posts?slug=eq.{urllib.parse.quote(slug)}",
            data=json.dumps({"view_count": views}).encode(),
            method="PATCH",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(patch, context=_SSL):
                updated += 1
        except urllib.error.HTTPError as e:
            print(f"patch fail {slug}: {e.read()[:200]}")
    print(f"DB maj : {updated}")
    # Archive JSON (ne pas supprimer encore — note pour Nicolas)
    archive = ROOT / "contenu" / "sources" / "stats-posts.json"
    archive.parent.mkdir(parents=True, exist_ok=True)
    if not archive.exists():
        archive.write_text(STATS.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"copié → {archive.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    import urllib.parse
    raise SystemExit(main())

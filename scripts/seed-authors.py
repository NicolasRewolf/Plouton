#!/usr/bin/env python3
"""Seed authors → public.authors (P1-A). Insert/upsert depuis contenu/auteurs.json.

Usage :
  python3 scripts/seed-authors.py
  python3 scripts/seed-authors.py --dry-run
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
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CTX = ssl.create_default_context()

ROOT = Path(__file__).resolve().parents[1]
AUTHORS = ROOT / "contenu" / "auteurs.json"
ENV_CANDIDATES = [
    ROOT / "site" / ".env.local",
    ROOT / "site" / ".env",
    ROOT / ".env.local",
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
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in env:
                env[key] = val
    for key in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"):
        if os.environ.get(key):
            env[key] = os.environ[key]
    return env


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    authors = json.loads(AUTHORS.read_text(encoding="utf-8"))
    rows = []
    for i, a in enumerate(authors):
        rows.append({
            "id": a["id"],
            "wix_id": a.get("wixId"),
            "display_name": a["displayName"],
            "short_name": a.get("shortName") or a["displayName"],
            "avatar": a.get("avatar") or None,
            "bio": a.get("bio") or "",
            "role": a.get("role") or "",
            "linkedin": a.get("linkedin"),
            "position": i,
        })
    print(f"{len(rows)} auteurs (Axelle = Fesneau, pas Simonini)")
    if args.dry-run:
        for r in rows:
            print(f"  {r['id']} — {r['short_name']}")
        return 0
    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        print("SUPABASE manquant", file=sys.stderr)
        return 1
    endpoint = f"{url.rstrip('/')}/rest/v1/authors"
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        endpoint + "?on_conflict=id",
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, context=_SSL_CTX) as resp:
            print(f"OK {resp.status}")
    except urllib.error.HTTPError as e:
        print(e.read().decode()[:500], file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

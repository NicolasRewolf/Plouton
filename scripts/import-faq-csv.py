#!/usr/bin/env python3
"""
Import CSV FAQ Wix → table Supabase `faq`.

Usage :
  python3 scripts/import-faq-csv.py
  python3 scripts/import-faq-csv.py --dry-run
  python3 scripts/import-faq-csv.py --limit 10
  python3 scripts/import-faq-csv.py --csv contenu/sources/wix/FAQ.csv

Source par défaut : contenu/sources/wix/FAQ.csv
Credentials : site/.env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY)

Idempotent : upsert sur (wix_id, expertise_slug).
Multi-expertise CSV → une ligne par slug mappé.
Lignes sans label mappé → skip + log.
"""

from __future__ import annotations

import argparse
import csv
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
DEFAULT_CSV = ROOT / "contenu" / "sources" / "wix" / "FAQ.csv"
MAP_PATH = ROOT / "scripts" / "faq-expertise-map.json"
ENV_CANDIDATES = [
    ROOT / "site" / ".env.local",
    ROOT / "site" / ".env",
    ROOT / ".env.local",
]
BATCH = 50


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


def load_map() -> dict[str, str]:
    raw = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if not k.startswith("_") and isinstance(v, str)}


def parse_json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    s = raw.strip()
    if not s:
        return []
    if s.startswith("["):
        try:
            data = json.loads(s)
            if isinstance(data, list):
                return [str(x).strip() for x in data if str(x).strip()]
        except json.JSONDecodeError:
            pass
    return [s]


def first_or_none(items: list[str]) -> str | None:
    return items[0] if items else None


def normalize_header(name: str) -> str:
    return name.lstrip("\ufeff").strip().strip('"')


def row_get(row: dict[str, str], *keys: str) -> str:
    for k in keys:
        if k in row and row[k] is not None:
            return str(row[k])
    # BOM / quotes variants
    for key, val in row.items():
        nk = normalize_header(key)
        if nk in keys and val is not None:
            return str(val)
    return ""


def build_rows(csv_path: Path, label_map: dict[str, str], limit: int | None):
    rows: list[dict] = []
    skipped: list[str] = []
    unknown_labels: dict[str, int] = {}
    sort_order = 0

    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for i, raw in enumerate(reader):
            if limit is not None and i >= limit:
                break
            question = row_get(raw, "Question").strip()
            answer = row_get(raw, "Réponse", "Reponse").strip()
            wix_id = row_get(raw, "ID", "Id", "id").strip() or None
            likes_raw = row_get(raw, "Like", "Likes").strip()
            try:
                likes = int(float(likes_raw)) if likes_raw else 0
            except ValueError:
                likes = 0

            if not question or not answer:
                skipped.append(f"ligne {i + 2}: question/réponse vide")
                continue

            expertise_labels = parse_json_list(row_get(raw, "Expertise"))
            sous_labels = parse_json_list(
                row_get(raw, "Sous - expertise", "Sous-expertise", "Sous expertise")
            )
            sous = first_or_none(sous_labels)

            slugs: list[str] = []
            for label in expertise_labels:
                slug = label_map.get(label)
                if slug:
                    if slug not in slugs:
                        slugs.append(slug)
                else:
                    unknown_labels[label] = unknown_labels.get(label, 0) + 1

            if not slugs:
                skipped.append(
                    f"ligne {i + 2}: aucun slug pour {expertise_labels!r} — {question[:60]}"
                )
                continue

            for slug in slugs:
                sort_order += 1
                rows.append(
                    {
                        "wix_id": wix_id,
                        "question": question,
                        "answer": answer,
                        "expertise_slug": slug,
                        "sous_expertise": sous,
                        "likes": likes,
                        "status": "published",
                        "sort_order": sort_order,
                    }
                )

    return rows, skipped, unknown_labels


def upsert_batch(url: str, key: str, batch: list[dict]) -> None:
    endpoint = (
        f"{url.rstrip('/')}/rest/v1/faq"
        "?on_conflict=wix_id,expertise_slug"
    )
    # PostgREST needs a unique constraint name or columns — we use the unique index.
    # Prefer Prefer: resolution=merge-duplicates with unique columns.
    body = json.dumps(batch).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
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
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=120) as resp:
            if resp.status not in (200, 201, 204):
                raise RuntimeError(f"HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e


def main() -> int:
    parser = argparse.ArgumentParser(description="Import FAQ CSV → Supabase")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    if not args.csv.is_file():
        print(f"CSV introuvable : {args.csv}", file=sys.stderr)
        return 1

    label_map = load_map()
    rows, skipped, unknown = build_rows(args.csv, label_map, args.limit)

    print(f"CSV : {args.csv}")
    print(f"Lignes à upsert : {len(rows)}")
    print(f"Skips : {len(skipped)}")
    if unknown:
        print("Labels non mappés :")
        for label, n in sorted(unknown.items(), key=lambda x: -x[1]):
            print(f"  · {label!r} × {n}")
    if skipped and len(skipped) <= 20:
        for s in skipped:
            print(f"  skip: {s}")
    elif skipped:
        for s in skipped[:10]:
            print(f"  skip: {s}")
        print(f"  … +{len(skipped) - 10} skips")

    if args.dry_run:
        print("Dry-run — rien écrit.")
        by_slug: dict[str, int] = {}
        for r in rows:
            by_slug[r["expertise_slug"]] = by_slug.get(r["expertise_slug"], 0) + 1
        for slug, n in sorted(by_slug.items(), key=lambda x: -x[1]):
            print(f"  {slug}: {n}")
        return 0

    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        print(
            "Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY "
            "(site/.env.local).",
            file=sys.stderr,
        )
        return 1

    # Upsert needs a UNIQUE constraint PostgREST can resolve.
    # Our index is UNIQUE (wix_id, expertise_slug) WHERE wix_id IS NOT NULL —
    # PostgREST on_conflict may need a named constraint. Use a two-step approach
    # if merge fails: try with Prefer header first.
    total = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i : i + BATCH]
        # Rows without wix_id: plain insert (no conflict target)
        with_id = [r for r in batch if r.get("wix_id")]
        without_id = [r for r in batch if not r.get("wix_id")]
        if with_id:
            upsert_batch(url, key, with_id)
            total += len(with_id)
        if without_id:
            insert_plain(url, key, without_id)
            total += len(without_id)
        print(f"  … {total}/{len(rows)}")

    print(f"OK — {total} lignes upsertées.")

    # Divorce absent du CSV Wix → archive JSON
    archive = ROOT / "contenu" / "sources" / "faq-json-archive" / "divorce.json"
    if archive.is_file() and args.limit is None:
        divorce_rows = load_divorce_archive(archive)
        if divorce_rows:
            # Évite doublons si re-run : on ne seed que si 0 ligne divorce
            if count_expertise(url, key, "divorce") == 0:
                insert_plain(url, key, divorce_rows)
                print(f"OK — {len(divorce_rows)} questions Divorce (archive JSON).")
            else:
                print("Divorce déjà en base — archive JSON ignorée.")

    return 0


def insert_plain(url: str, key: str, batch: list[dict]) -> None:
    endpoint = f"{url.rstrip('/')}/rest/v1/faq"
    body = json.dumps(batch).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=120) as resp:
            if resp.status not in (200, 201, 204):
                raise RuntimeError(f"HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e


def load_divorce_archive(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        return []
    rows: list[dict] = []
    for i, item in enumerate(data, 1):
        if not isinstance(item, dict):
            continue
        q = str(item.get("question") or "").strip()
        a = str(item.get("answer") or "").strip()
        if not q or not a:
            continue
        sous = item.get("sousExpertise")
        rows.append(
            {
                "wix_id": None,
                "question": q,
                "answer": a,
                "expertise_slug": "divorce",
                "sous_expertise": str(sous).strip() if sous else None,
                "likes": 0,
                "status": "published",
                "sort_order": 9000 + i,
            }
        )
    return rows


def count_expertise(url: str, key: str, slug: str) -> int:
    endpoint = (
        f"{url.rstrip('/')}/rest/v1/faq"
        f"?expertise_slug=eq.{slug}&select=id"
    )
    req = urllib.request.Request(
        endpoint,
        method="GET",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "count=exact",
            "Range": "0-0",
        },
    )
    try:
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=60) as resp:
            cr = resp.headers.get("content-range") or ""
            # Content-Range: 0-0/21
            if "/" in cr:
                return int(cr.split("/")[-1])
    except Exception:
        return -1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

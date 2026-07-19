#!/usr/bin/env python3
"""
Seed one-shot des articles JSON → table Supabase `posts` (C4).

Usage :
  python3 scripts/seed-posts.py              # insert-only (n'écrase pas)
  python3 scripts/seed-posts.py --force      # upsert (écrase les lignes existantes)
  python3 scripts/seed-posts.py --dry-run
  python3 scripts/seed-posts.py --limit 5

Source : contenu/articles/*.json (422 slugs — jamais renommés).
Credentials : site/.env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY).

Par défaut : insert-only (Prefer: resolution=ignore-duplicates) — ne touche
pas aux articles déjà édités en admin. Utiliser --force uniquement à
connaissance de cause (réécrit title/body/status…).
"""

from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    import certifi

    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL_CTX = ssl.create_default_context()

ROOT = Path(__file__).resolve().parents[1]
ARTICLES_DIR = ROOT / "contenu" / "articles"
ENV_CANDIDATES = [
    ROOT / "site" / ".env.local",
    ROOT / "site" / ".env",
    ROOT / ".env.local",
]
BATCH = 25  # body_html peut être gros — lots modestes


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


def as_date(value: object) -> str | None:
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    # "2016-09-06" or ISO datetime → date only
    return s[:10]


def article_to_row(data: dict) -> dict:
    slug = str(data.get("slug") or "").strip()
    if not slug:
        raise ValueError("article sans slug")
    body = data.get("body")
    if not isinstance(body, list):
        body = [str(body)] if body else []
    status = data.get("status")
    # Conserver le statut JSON s'il est connu ; sinon draft (jamais forcer published)
    if status not in ("draft", "published", "scheduled", "archived"):
        status = "draft"
    author = data.get("author") or ""
    author_id = data.get("authorId")
    # Les imports Wix mettent souvent le GUID Wix dans `author`
    if not author_id and isinstance(author, str) and len(author) == 36 and "-" in author:
        author_id = author
    categories = data.get("categories") or []
    if not isinstance(categories, list):
        categories = [str(categories)]
    tags = data.get("tags") or []
    if not isinstance(tags, list):
        tags = []
    category_ids = data.get("categoryIds") or []
    if not isinstance(category_ids, list):
        category_ids = []
    cover = data.get("coverImage")
    if cover is None and data.get("coverImageWix"):
        cover = data.get("coverImageWix")
    return {
        "slug": slug,
        "title": str(data.get("title") or slug),
        "excerpt": str(data.get("excerpt") or ""),
        "published_at": as_date(data.get("publishedAt")),
        "updated_at": as_date(data.get("updatedAt")),
        "status": status,
        "author": str(author),
        "author_id": author_id,
        "categories": [str(c) for c in categories],
        "tags": [str(t) for t in tags],
        "category_ids": [str(c) for c in category_ids],
        "cover_image": cover,
        "minutes_to_read": data.get("minutesToRead"),
        "view_count": int(data.get("viewCount") or 0),
        "url": data.get("url") or f"/post/{slug}",
        "wix_id": data.get("wixId"),
        "meta_title": data.get("metaTitle"),
        "meta_description": data.get("metaDescription"),
        "body_html": data.get("bodyHtml"),
        "body": body,
    }


class SupabaseRest:
    def __init__(self, url: str, key: str):
        self.base = url.rstrip("/") + "/rest/v1"
        self.key = key

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        body: object | None = None,
        prefer: str | None = None,
    ) -> object:
        qs = f"?{urllib.parse.urlencode(params, doseq=True)}" if params else ""
        req = urllib.request.Request(
            f"{self.base}{path}{qs}",
            method=method,
            data=None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8"),
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                **({"Prefer": prefer} if prefer else {}),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120, context=_SSL_CTX) as resp:
                raw = resp.read()
                if not raw:
                    return None
                return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            raise SystemExit(f"Supabase HTTP {e.code} {path}: {detail}") from e

    def count_posts(self) -> int:
        req = urllib.request.Request(
            f"{self.base}/posts?select=slug",
            method="HEAD",
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Prefer": "count=exact",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as resp:
                # content-range: 0-0/422
                cr = resp.headers.get("content-range") or resp.headers.get("Content-Range") or ""
                if "/" in cr:
                    return int(cr.split("/")[-1])
        except urllib.error.HTTPError as e:
            # Fallback GET with limit 0 + Prefer count
            if e.code != 405:
                detail = e.read().decode("utf-8", errors="replace")
                raise SystemExit(f"Supabase HTTP {e.code} count: {detail}") from e
        rows = self._request(
            "GET",
            "/posts",
            params={"select": "slug", "limit": "1"},
            prefer="count=exact",
        )
        # Without header we can't know — return 0 and rely on upsert
        return 0 if not isinstance(rows, list) else -1

    def upsert_many(self, rows: list[dict], *, force: bool) -> int:
        if not rows:
            return 0
        prefer = (
            "resolution=merge-duplicates,return=minimal"
            if force
            else "resolution=ignore-duplicates,return=minimal"
        )
        done = 0
        for i in range(0, len(rows), BATCH):
            chunk = rows[i : i + BATCH]
            self._request(
                "POST",
                "/posts",
                params={"on_conflict": "slug"},
                body=chunk,
                prefer=prefer,
            )
            done += len(chunk)
            print(f"  … {done}/{len(rows)}", flush=True)
        return done

    def sample_slugs(self, n: int = 3) -> list[str]:
        rows = self._request(
            "GET",
            "/posts",
            params={
                "select": "slug",
                "order": "slug.asc",
                "limit": str(n),
            },
        )
        if not isinstance(rows, list):
            return []
        return [str(r["slug"]) for r in rows if r.get("slug")]


def load_articles(*, limit: int | None) -> list[dict]:
    files = sorted(ARTICLES_DIR.glob("*.json"))
    if limit is not None:
        files = files[:limit]
    rows: list[dict] = []
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        rows.append(article_to_row(data))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed posts depuis contenu/articles/")
    parser.add_argument("--dry-run", action="store_true", help="Charge les JSON sans écrire")
    parser.add_argument("--limit", type=int, default=None, help="Limiter le nombre d'articles")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Upsert (écrase les lignes existantes). Sans ce flag : insert-only.",
    )
    args = parser.parse_args()

    if not ARTICLES_DIR.is_dir():
        raise SystemExit(f"Dossier introuvable : {ARTICLES_DIR}")

    rows = load_articles(limit=args.limit)
    slugs = [r["slug"] for r in rows]
    print(f"Articles JSON : {len(rows)}")
    if len(slugs) != len(set(slugs)):
        raise SystemExit("Doublons de slug dans contenu/articles/ — abort")
    print(f"Sample slugs : {slugs[:3]}")
    print(f"Mode : {'FORCE upsert' if args.force else 'insert-only (ignore duplicates)'}")

    if args.dry_run:
        print("Dry-run : aucune écriture.")
        return

    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise SystemExit(
            "Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY "
            "(site/.env.local ou variables d'environnement)."
        )

    client = SupabaseRest(url, key)
    print("Écriture vers public.posts …")
    client.upsert_many(rows, force=args.force)

    # Vérif count via select
    check = client._request(
        "GET",
        "/posts",
        params={"select": "slug", "limit": "1"},
        prefer="count=exact",
    )
    sample = client.sample_slugs(5)
    print(f"Seed OK — sample DB : {sample}")
    print(f"Attendu ≈ {len(rows)} posts (slugs inchangés).")
    if isinstance(check, list):
        print("(Vérifier count exact via MCP / SQL : select count(*) from posts)")


if __name__ == "__main__":
    main()

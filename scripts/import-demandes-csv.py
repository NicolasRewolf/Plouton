#!/usr/bin/env python3
"""
Import one-shot des demandes Wix → table Supabase `demandes` (C3).

Usage :
  python3 scripts/import-demandes-csv.py "/chemin/vers/Prise de contact site-web .csv"
  python3 scripts/import-demandes-csv.py --dry-run "/chemin/vers/export.csv"

Le chemin CSV est passé en argument (jamais hardcodé dans le repo).
Ne jamais committer le CSV (PII) — voir `.gitignore`.

Credentials : lit `site/.env.local` (ou variables d'environnement) :
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SECRET_KEY

Statut importé : « Archivé » + notes « Import Wix C3 »
(ne pollue pas la boîte « Nouveau »).

Idempotence : skip si même email + date d'envoi + message déjà présents.
"""

from __future__ import annotations

import argparse
import csv
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
ENV_CANDIDATES = [
    ROOT / "site" / ".env.local",
    ROOT / "site" / ".env",
    ROOT / ".env.local",
]

NOTE_IMPORT = "Import Wix C3"
STATUT_IMPORT = "Archivé"
PAGE_SIZE = 1000


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


def cell(row: dict[str, str], *names: str) -> str:
    for name in names:
        if name in row and row[name] is not None:
            return str(row[name]).strip()
    return ""


def build_utm(row: dict[str, str]) -> dict[str, str] | None:
    utm = {}
    for key in ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"):
        val = cell(row, key)
        if val:
            utm[key.removeprefix("utm_")] = val
    return utm or None


def build_cooked(row: dict[str, str]) -> dict[str, str] | None:
    cooked = {}
    aid = cell(row, "cooked_aid")
    sid = cell(row, "cooked_sid")
    if aid:
        cooked["aid"] = aid
    if sid:
        cooked["sid"] = sid
    return cooked or None


def row_to_payload(row: dict[str, str]) -> dict:
    objet = cell(row, "Objet de ma demande")
    return {
        "received_at": cell(row, "Date d'envoi") or None,
        "prenom": cell(row, "Prénom") or None,
        "nom": cell(row, "Nom") or None,
        "entreprise": cell(row, "Nom de l'entreprise (si concernée)") or None,
        "email": cell(row, "Email") or None,
        "telephone": cell(row, "Téléphone") or None,
        "objet": objet or None,
        "message": cell(row, "Message") or None,
        "page_source": cell(row, "page_source") or None,
        "utm": build_utm(row),
        "cooked": build_cooked(row),
        "candidature": objet == "Nous rejoindre",
        "statut": STATUT_IMPORT,
        "notes": NOTE_IMPORT,
        # PJ Wix = URLs externes ; on ne les importe pas dans Storage.
        "fichiers": [],
    }


def normalize_ts(value: str | None) -> str:
    """Normalise timestamptz pour comparer CSV (…Z) et Postgres (…+00:00)."""
    if not value:
        return ""
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    # Truncate sub-second noise inconsistently returned
    if "." in s and "+" in s:
        head, rest = s.split(".", 1)
        frac, tz = rest.split("+", 1)
        frac = (frac + "000000")[:6]
        s = f"{head}.{frac}+{tz}"
    return s


def fingerprint(email: str | None, received_at: str | None, message: str | None) -> tuple:
    return (
        (email or "").strip().lower(),
        normalize_ts(received_at),
        (message or "").strip(),
    )


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
            data=None if body is None else json.dumps(body).encode("utf-8"),
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                **({"Prefer": prefer} if prefer else {}),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as resp:
                raw = resp.read()
                if not raw:
                    return None
                return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            raise SystemExit(f"Supabase HTTP {e.code} {path}: {detail}") from e

    def existing_fingerprints(self) -> set[tuple]:
        """Charge email+received_at+message déjà en base (pour skip)."""
        out: set[tuple] = set()
        offset = 0
        while True:
            rows = self._request(
                "GET",
                "/demandes",
                params={
                    "select": "email,received_at,message",
                    "order": "received_at.asc",
                    "limit": str(PAGE_SIZE),
                    "offset": str(offset),
                },
            )
            if not isinstance(rows, list) or not rows:
                break
            for r in rows:
                out.add(
                    fingerprint(
                        r.get("email"),
                        r.get("received_at"),
                        r.get("message"),
                    )
                )
            if len(rows) < PAGE_SIZE:
                break
            offset += PAGE_SIZE
        return out

    def insert_many(self, rows: list[dict]) -> int:
        if not rows:
            return 0
        # Insert par lots pour rester sous les limites PostgREST.
        batch = 100
        inserted = 0
        for i in range(0, len(rows), batch):
            chunk = rows[i : i + batch]
            self._request(
                "POST",
                "/demandes",
                body=chunk,
                prefer="return=minimal",
            )
            inserted += len(chunk)
        return inserted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", help="Chemin du CSV Wix (utf-8-sig, virgules)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse + compte sans écrire en base",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv_path).expanduser().resolve()
    if not csv_path.is_file():
        print(f"Fichier introuvable : {csv_path}", file=sys.stderr)
        return 1

    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    key = env.get("SUPABASE_SECRET_KEY", "").strip()
    if not args.dry_run and (not url or not key):
        print(
            "Credentials manquants. Posez NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY\n"
            "dans site/.env.local (ex. `npx vercel env pull .env.local` depuis site/)\n"
            "ou passez --dry-run pour tester le parsing seul.",
            file=sys.stderr,
        )
        return 2

    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        raw_rows = list(reader)

    payloads = [row_to_payload(r) for r in raw_rows]
    print(f"CSV : {len(payloads)} lignes lues depuis {csv_path.name}")

    if args.dry_run:
        sample = payloads[0] if payloads else {}
        print("--dry-run : aucune écriture")
        print(
            "Exemple :",
            {
                "email": sample.get("email"),
                "received_at": sample.get("received_at"),
                "objet": sample.get("objet"),
                "statut": sample.get("statut"),
            },
        )
        return 0

    sb = SupabaseRest(url, key)
    print("Chargement des empreintes existantes…")
    existing = sb.existing_fingerprints()
    print(f"Déjà en base : {len(existing)} empreintes")

    to_insert: list[dict] = []
    skipped = 0
    for p in payloads:
        fp = fingerprint(p.get("email"), p.get("received_at"), p.get("message"))
        if fp in existing:
            skipped += 1
            continue
        # received_at null → laisser le default SQL
        if not p.get("received_at"):
            p.pop("received_at", None)
        to_insert.append(p)
        existing.add(fp)

    print(f"À importer : {len(to_insert)} · skip (déjà là) : {skipped}")
    n = sb.insert_many(to_insert)
    print(f"OK — {n} demandes importées (statut « {STATUT_IMPORT} », notes « {NOTE_IMPORT} »).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

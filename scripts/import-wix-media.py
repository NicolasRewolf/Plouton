#!/usr/bin/env python3
"""Rapatrie les médias Wix en local — le jour où Wix s'éteint, rien ne casse.

- Covers d'articles  → site/public/media/blog-covers/{slug-ascii}.jpg (1200w)
- Images inline (bodyHtml) → site/public/media/blog-inline/{hash}.jpg (1200w)
- Photos équipe      → site/public/brand/equipe/{prenom-ascii}.jpg (900w)

Idempotent : un fichier déjà présent n'est pas retéléchargé ; les JSON déjà
réécrits (chemin local + champ *Wix de provenance) ne sont pas retouchés.
Relançable autant de fois que nécessaire avant le jour J.
"""
import concurrent.futures as cf
import hashlib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "contenu" / "articles"
EQUIPE = ROOT / "contenu" / "equipe.json"
COVERS = ROOT / "site" / "public" / "media" / "blog-covers"
INLINE = ROOT / "site" / "public" / "media" / "blog-inline"
TEAM = ROOT / "site" / "public" / "brand" / "equipe"

WIX_RE = re.compile(r"https://static\.wixstatic\.com/media/[^\"\s)]+")


def ascii_slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9-]+", "-", s.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:80] or "media"


def download(url: str, dest: Path, width: int) -> bool:
    if dest.exists():
        return True
    tmp = dest.with_suffix(".tmp")
    try:
        subprocess.run(
            ["curl", "-fsSL", "--max-time", "60", "--retry", "2",
             "-A", "Mozilla/5.0 (PloutonMigration)", "-o", str(tmp), url],
            check=True, capture_output=True,
        )
        subprocess.run(
            ["sips", "-Z", str(width), "-s", "format", "jpeg", "-s", "formatOptions", "78",
             str(tmp), "--out", str(dest)],
            check=True, capture_output=True,
        )
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  ÉCHEC {url[:80]} : {e}", file=sys.stderr)
        return False
    finally:
        tmp.unlink(missing_ok=True)


def main() -> None:
    for d in (COVERS, INLINE, TEAM):
        d.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[str, Path, int]] = []
    plans: list[dict] = []  # réécritures à faire si téléchargement OK

    # --- Covers + inline des articles
    for f in sorted(ARTICLES.glob("*.json")):
        d = json.loads(f.read_text())
        plan = {"file": f, "cover": None, "inline": {}}
        cover = d.get("coverImage") or ""
        if "wixstatic" in cover:
            dest = COVERS / f"{ascii_slug(d['slug'])}.jpg"
            jobs.append((cover, dest, 1200))
            plan["cover"] = (cover, f"/media/blog-covers/{dest.name}")
        for url in sorted(set(WIX_RE.findall(d.get("bodyHtml") or ""))):
            h = hashlib.sha1(url.encode()).hexdigest()[:16]
            dest = INLINE / f"{h}.jpg"
            jobs.append((url, dest, 1200))
            plan["inline"][url] = f"/media/blog-inline/{dest.name}"
        if plan["cover"] or plan["inline"]:
            plans.append(plan)

    # --- Équipe
    equipe = json.loads(EQUIPE.read_text())
    for m in equipe:
        img = m.get("image") or ""
        if "wixstatic" in img:
            dest = TEAM / f"{ascii_slug(m['name'])}.jpg"
            jobs.append((img, dest, 900))
            m["imageWix"] = img
            m["image"] = f"/brand/equipe/{dest.name}"

    # Dédupliquer les jobs (même URL/dest)
    jobs = list({(u, d): (u, d, w) for u, d, w in jobs}.values())
    print(f"{len(jobs)} fichiers à télécharger…")
    ok: dict[str, bool] = {}
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(download, u, d, w): u for u, d, w in jobs}
        for fut in cf.as_completed(futs):
            ok[futs[fut]] = fut.result()

    # --- Réécrire les JSON (seulement ce qui a réussi)
    rewritten = failures = 0
    for plan in plans:
        d = json.loads(plan["file"].read_text())
        changed = False
        if plan["cover"]:
            src, local = plan["cover"]
            if ok.get(src):
                d["coverImageWix"] = src
                d["coverImage"] = local
                changed = True
            else:
                failures += 1
        for src, local in plan["inline"].items():
            if ok.get(src):
                d["bodyHtml"] = d["bodyHtml"].replace(src, local)
                changed = True
            else:
                failures += 1
        if changed:
            plan["file"].write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
            rewritten += 1
    if all(ok.get(m.get("imageWix", ""), True) for m in equipe):
        EQUIPE.write_text(json.dumps(equipe, ensure_ascii=False, indent=2) + "\n")

    total_ok = sum(1 for v in ok.values() if v)
    print(f"{total_ok}/{len(jobs)} téléchargés · {rewritten} JSON réécrits · {failures} échecs à rejouer")


if __name__ == "__main__":
    main()

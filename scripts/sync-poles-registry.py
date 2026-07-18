#!/usr/bin/env python3
"""Sync poles-registry.json → site/src/data/ (miroir client)."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "contenu" / "reference" / "poles-registry.json"
dst = ROOT / "site" / "src" / "data" / "poles-registry.json"
dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(src, dst)
print(f"OK {src.relative_to(ROOT)} → {dst.relative_to(ROOT)}")

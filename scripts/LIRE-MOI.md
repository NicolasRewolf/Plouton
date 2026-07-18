# scripts/

Outils de **migration / import** (pas le runtime du site).

| Script | Rôle |
|--------|------|
| `import-wix-blog.py` | CSV Wix → articles JSON + index + équipe + catégories |
| `scrape-expertises-live.py` | Pages live → `contenu/expertises/` + `pages/` |
| `scrape-faq-live.py` | FAQ live → `contenu/faq/` (Playwright) |
| `check-expertises-live.py` | Snapshot MD live + deep-check titres / textes / liens |

```bash
# Blog
python3 scripts/import-wix-blog.py

# Expertises (nécessite bs4)
python3 scripts/scrape-expertises-live.py

# FAQ (nécessite playwright)
python3 scripts/scrape-faq-live.py

# Maintenance expertises (MD + rapport + option --fix)
python3 scripts/check-expertises-live.py
python3 scripts/check-expertises-live.py --fix
```

Les chemins sont relatifs au repo (pas de chemins absolus machine).

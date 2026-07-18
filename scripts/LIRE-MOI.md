# scripts/

Outils de **migration / import** (pas le runtime du site).

| Script | Rôle |
|--------|------|
| `import-wix-blog.py` | CSV Wix → articles JSON + index + équipe + catégories |
| `import-demandes-csv.py` | CSV « Prise de contact » Wix → table Supabase `demandes` (C3, hors git) |
| `scrape-expertises-live.py` | Pages live → `contenu/expertises/` + `pages/` |
| `scrape-faq-live.py` | FAQ live → `contenu/faq/` (Playwright) |
| `check-expertises-live.py` | Snapshot MD live + deep-check titres / textes / liens |
| `sync-poles-registry.py` | Miroir registry → `site/src/data/` (après edit contenu) |

**Source de vérité taxonomie :** `contenu/reference/poles-registry.json`  
(mirroir client : `site/src/data/poles-registry.json` — `python3 scripts/sync-poles-registry.py`).

```bash
# Blog
python3 scripts/import-wix-blog.py

# Demandes historiques Wix (PII — CSV hors git, chemin en argument)
python3 scripts/import-demandes-csv.py --dry-run "/chemin/vers/Prise de contact site-web .csv"
python3 scripts/import-demandes-csv.py "/chemin/vers/Prise de contact site-web .csv"
# Prérequis : site/.env.local avec NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY

# Expertises (nécessite bs4)
python3 scripts/scrape-expertises-live.py

# FAQ (nécessite playwright)
python3 scripts/scrape-faq-live.py

# Maintenance expertises (MD + rapport + option --fix)
python3 scripts/check-expertises-live.py
python3 scripts/check-expertises-live.py --fix
```

Les chemins sont relatifs au repo (pas de chemins absolus machine).
Le CSV contacts **ne doit jamais** être ajouté au git.

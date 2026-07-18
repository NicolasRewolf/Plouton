# base/

Mémoire technique : schémas SQL, migrations Supabase, seed.

| | |
|--|--|
| **État** | Migrations actives plutôt dans `supabase/migrations/` |
| **Doc** | `docs/04-donnees.md` + `docs/11-stack-technique.md` + `docs/14-etat.md` |

V1 en place :
- **`demandes`** — `0001_demandes.sql` + accès avocats `0002_acces_avocats.sql`
- **`posts`** — `0003_posts.sql` (C4) · seed `scripts/seed-posts.py`

**Dual-run C4** : admin écrit en DB ; le site public lit encore `contenu/articles/` (JSON git) jusqu’à C5.

**Seed blog (C4)** :

```bash
python3 scripts/seed-posts.py
python3 scripts/seed-posts.py --dry-run
```

Idempotent (upsert sur `slug`). 422 slugs intouchables.

**Import historique demandes (C3)** — CSV Wix hors git :

```bash
python3 scripts/import-demandes-csv.py "/chemin/vers/export.csv"
```

Statut posé : `Archivé` + notes `Import Wix C3`. Idempotent (skip si email+date+message déjà là).

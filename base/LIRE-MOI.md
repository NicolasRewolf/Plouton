# base/

Mémoire technique : schémas SQL, migrations Supabase, seed.

| | |
|--|--|
| **État** | Migrations actives plutôt dans `supabase/migrations/` |
| **Doc** | `docs/04-donnees.md` + `docs/11-stack-technique.md` + `docs/14-etat.md` |

V1 en place : table **`demandes`** (`supabase/migrations/0001_demandes.sql`) + accès avocats (`0002_acces_avocats.sql`).  
Articles / expertises / FAQ restent des fichiers `contenu/` jusqu’à décision contraire.

**Import historique (C3)** — CSV Wix hors git :

```bash
python3 scripts/import-demandes-csv.py "/chemin/vers/export.csv"
```

Statut posé : `Archivé` + notes `Import Wix C3`. Idempotent (skip si email+date+message déjà là).

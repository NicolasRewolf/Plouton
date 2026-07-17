# sources/wix/

Exports bruts depuis Wix. **Ne pas éditer à la main** — servir de matière première aux scripts.

| Fichier | Usage |
|---------|--------|
| `Posts.csv` | → `scripts/import-wix-blog.py` → `contenu/articles/*.json` |
| `Categories.csv` | → catégories blog |
| `Equipe.csv` | → `contenu/equipe.json` |

Après un nouvel export Wix : remplacer ces fichiers, puis relancer le script d’import.

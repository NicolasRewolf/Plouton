# contenu/

Source de vérité du site (fichiers lisibles).

```
contenu/
├── articles/           ← 422 posts (JSON) + Posts.csv / Categories.csv
├── articles-index.json ← index léger pour listes / ticker / sitemap
├── categories.json     ← 17 catégories blog
├── equipe.json         ← 6 membres (bios complètes)
├── Équipe.csv          ← export Wix équipe
├── pages/              ← textes pages (accueil.json…)
├── expertises/         ← pages expertise
├── faq/
├── medias/
├── imports/            ← 301, formulaires…
└── identite/           ← Drive logos / typos
```

## Ré-importer le blog Wix

```bash
python3 scripts/import-wix-blog.py
```

Lit `articles/Posts.csv`, `articles/Categories.csv`, `Équipe.csv`  
→ régénère les JSON **sans résumer** les textes (Plain Content → body).

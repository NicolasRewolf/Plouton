# contenu/

**Source de vérité du contenu** (POC fichiers → demain Supabase).

Rien d’autre que du **contenu produit** + sources d’import. Pas de code.

```
contenu/
├── site.json              ← NAP, téléphone, SEO cabinet
├── articles/              ← 422 posts JSON (produit)
├── articles-index.json    ← index léger (listes, ticker, sitemap)
├── categories.json        ← 17 catégories blog
├── equipe.json            ← équipe
├── expertises/            ← pages expertise (1 JSON = 1 page)
├── reference/             ← registry pôles, rapports santé, deviations
├── expertises-cards.json  ← cartes homepage
├── expertises-heroes.json ← mapping images hero
├── faq/                   ← FAQ unifiée (1 fichier / expertise pour l’instant)
├── pages/                 ← pages structure (accueil, honoraires…)
├── medias/                ← réservé (médias / presse)
├── sources/wix/           ← exports bruts Wix (ré-import)
├── imports/               ← 301, exports divers (PII gitignorés)
└── identite/              ← lien Drive logos / typos
```

## Règles

| Zone | Rôle | Commit ? |
|------|------|----------|
| `articles/`, `expertises/`, `pages/`, `faq/`, `*.json` | Contenu **produit** | Oui |
| `sources/wix/` | Export brut pour scripts | Oui (sauf PII) |
| `imports/*contact*` | Données perso | **Non** (gitignore) |

## Ré-importer le blog Wix

```bash
python3 scripts/import-wix-blog.py
```

Lit `sources/wix/Posts.csv` + `Categories.csv` + `Equipe.csv`  
→ régénère les JSON **avec HTML structuré** (titres, listes, liens).

## Plus tard (Supabase)

Ces dossiers deviennent des **tables** + Storage. Les chemins JSON restent le modèle mental.

# Cabinet Plouton — site

Migration du site du cabinet (avocats pénalistes, Bordeaux) de Wix vers Next.js.
422 articles, 15 pages d'expertise, backoffice de rédaction.

## Démarrer

```bash
cp site/.env.example site/.env.local
cd site && npm install && npm run dev
```

⚠️ Sans `SUPABASE_SECRET_KEY`, le site démarre **sans avertissement** en servant
l'instantané JSON figé. Détail : [`docs/guides/demarrer.md`](docs/guides/demarrer.md).

## Avant de livrer

```bash
cd site && npm run check
```

Ce sont les seuls tests du projet — [`docs/guides/gardes.md`](docs/guides/gardes.md).
Douze gardes, trois issues : **0** conforme · **1** un défaut est prouvé ·
**2** tout n'a pas pu être vérifié.

## Par où lire

| | |
|---|---|
| **Un agent IA** | [`AGENTS.md`](AGENTS.md) |
| **Un humain qui arrive** | [`LIRE-MOI.md`](LIRE-MOI.md) — le plan de la maison |
| **Toute la doc** | [`docs/00-INDEX.md`](docs/00-INDEX.md) |
| **Ce qui a changé** | [`CHANGELOG.md`](CHANGELOG.md) |
| **La question centrale** | [`docs/socle/architecture-contenu.md`](docs/socle/architecture-contenu.md) — d'où vient un article |

## À savoir tout de suite

Le **vrai backoffice** est `site/src/app/admin/`. Le dossier `admin/` à la racine
n'est qu'un placeholder.

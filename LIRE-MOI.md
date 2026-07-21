# Plan de la maison

Le site du Cabinet Plouton, en migration de Wix vers Next.js.
Pour l'état d'avancement : [`docs/etat/etat.md`](docs/etat/etat.md) — c'est le
**seul** document qui porte une date.

## Les dossiers

| Dossier | Ce qu'il contient | À savoir |
|---|---|---|
| **`site/`** | Toute l'application Next.js | Le site public **et** le backoffice |
| **`contenu/`** | Instantané JSON du contenu | ⚠️ **Ce n'est pas la source de vérité** — c'est le relais de panne (voir plus bas) |
| **`supabase/migrations/`** | Les 12 migrations SQL | Convention `000N_nom.sql`, appliquées par `supabase db push` |
| **`scripts/`** | Imports de migration **et gardes exécutables** | Les deux cohabitent : `check-body-docs.mjs` et `check-meta-descriptions.mjs` sont des gardes, pas des imports |
| **`docs/`** | La documentation, classée par durée de vie | Entrée : [`docs/00-INDEX.md`](docs/00-INDEX.md) |
| **`admin/`** | Rien qu'un placeholder | ⚠️ **Le vrai backoffice est `site/src/app/admin/`** |

## Les trois pièges

**1. `admin/` n'est pas le backoffice.** C'est un dossier réservé pour un
éventuel futur sous-domaine. Le code de l'admin est dans `site/src/app/admin/`.

**2. `contenu/` n'est pas la source de vérité.** Depuis la bascule C5, le site
lit **Supabase**, et ne retombe sur `contenu/` que si la base ne répond pas.
C'est expliqué en un document :
[`docs/socle/architecture-contenu.md`](docs/socle/architecture-contenu.md).

**3. Il n'y a pas de `noindex`.** Le code déclare `index: true` et `robots.ts`
autorise tout. La seule protection actuelle de la préproduction est le **login
Vercel**. À décider consciemment au moment du cutover.

## Démarrer

```bash
cp site/.env.example site/.env.local
cd site && npm install && npm run dev
```

⚠️ Sans `SUPABASE_SECRET_KEY`, le site démarre **sans avertissement** en servant
l'instantané figé — [`docs/guides/demarrer.md`](docs/guides/demarrer.md).

## Avant de livrer

Cinq gardes, à lancer depuis `site/`. Ce sont les seuls tests du projet :
[`docs/guides/gardes.md`](docs/guides/gardes.md).

## Par où lire

1. [`docs/socle/vocabulaire.md`](docs/socle/vocabulaire.md) — « C5 » désigne deux chantiers différents
2. [`docs/socle/architecture-contenu.md`](docs/socle/architecture-contenu.md) — d'où vient un article
3. [`docs/etat/etat.md`](docs/etat/etat.md) — où on en est
4. [`docs/00-INDEX.md`](docs/00-INDEX.md) — tout le reste
5. [`CHANGELOG.md`](CHANGELOG.md) — ce qui a changé, PR par PR

## Où vit quoi

- **Taxonomie des pôles / menu / objets de formulaire** →
  `contenu/reference/poles-registry.json` (miroir dans `site/src/data/`, synchro
  par `scripts/sync-poles-registry.py`)
- **Contenu des 15 pages d'expertise** → `contenu/expertises/*.json`
- **Corps des articles** → `body_doc` en base ; `contenu/body-html/` est un cache

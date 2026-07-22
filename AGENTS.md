# AGENTS.md — règles pour construire Plouton

Tu construis le site + backoffice du Cabinet Plouton.  
Nicolas n'est pas développeur : livrer clair, et **noter chaque livraison dans
[`CHANGELOG.md`](CHANGELOG.md)** — une entrée par PR, rubrique « Docs périmés »
comprise. C'est ce qui empêche la documentation de repourrir.

## Lire d'abord

1. `docs/socle/vocabulaire.md` ← ⚠️ **« C5 » désigne deux chantiers différents**
2. `docs/socle/architecture-contenu.md` ← **d'où vient un article** (le doc central)
3. `docs/socle/modules-canoniques.md` ← ce qui existe, et **ce qu'il ne faut pas ressusciter**
4. `docs/etat/etat.md` ← où on en est
5. `LIRE-MOI.md` ← le plan de la maison, et les trois pièges
6. `docs/guides/gardes.md` ← **avant toute livraison**
7. `docs/socle/architecture-site.md` ← gabarits + routes (**obligatoire**)
8. `docs/socle/composants-ui.md` ← composants canoniques
9. `docs/socle/ne-pas-perdre.md` · `docs/decisions/journal-decisions.md`
10. `docs/guides/migrations-supabase.md` si tu touches à la base
11. `contenu/LIRE-MOI.md` si tu touches au contenu

## Avant de livrer — non négociable

```bash
cd site && npm install && npm run check
```

Ce sont les **seuls** tests du projet ; aucune CI ne les lance. `npm run check`
enchaîne les douze gardes et s'arrête à la première qui bronche.

Trois issues, à ne pas confondre : **0** conforme · **1** un défaut est prouvé ·
**2** rien n'a échoué mais tout n'a pas pu être vérifié (typiquement : pas de
`SUPABASE_SECRET_KEY` en local). En local on peut assumer le trou avec
`GARDES_TOLERE_SKIP=1` — **jamais avant une livraison.**

Détail et signification de chaque échec : `docs/guides/gardes.md`.

⚠️ Une garde **importe** la règle qu'elle vérifie depuis `site/src/lib`. Ne
jamais y recopier une expression régulière, un seuil ou une table : une garde
qui teste sa propre copie ne teste plus le site — c'est exactement comme ça que
`check-meta-descriptions` a passé des mois à valider une règle inexistante.

## Structure (ne pas mélanger)

| Zone | Contient | Ne contient pas |
|------|----------|-----------------|
| `site/` | Code Next.js public | Exports CSV, docs métier |
| `contenu/` | JSON produit + `sources/wix/` | `node_modules`, secrets |
| `scripts/` | Imports one-shot **et gardes exécutables** | Runtime site |
| `site/scripts/` | Gardes qui importent le TypeScript réel (via `tsx`) | — |
| `docs/` | Doc classée par durée de vie (`etat/` `socle/` `guides/` `decisions/` `archive/`) | Code |
| `admin/` | Placeholder (vrai admin = `site/src/app/admin/`) | Contenu |
| `supabase/migrations/` | Migrations SQL, convention `000N_nom.sql` | Contenu |

## Base de données

`supabase db push` (CLI installée et liée). **Ne pas proposer le MCP Supabase :
son OAuth est cassé.** Pièges détaillés dans `docs/guides/migrations-supabase.md`.

## Principes non négociables

### Économie de code
- **Peu de gabarits**, beaucoup de données.
- Expertise = `ExpertisePageView` + `expertise-loader` + JSON, pas une page React unique par URL.
- Taxonomie pôles / menu / objets form = `contenu/reference/poles-registry.json` (miroirer via `scripts/sync-poles-registry.py`).
- Réutiliser Header, Footer, FAQ, ContactForm, **AffaireCard**, **SiteCta** / `.btn-pill`.

### UI — composants canoniques

Uniformité **dure**. L’agent est **garant** des composants partagés. Pas de cartes ni de boutons inventés page par page.

| Besoin | Canonique | Interdit |
|--------|-----------|----------|
| Carte article | **`AffaireCard`** uniquement | 4ᵉ carte, markup carte inline, `PostCard` « maison » |
| CTA public | **`.btn-pill` / `.btn-pill-primary`** (+ `.btn-pill-icon`) dans `globals.css`, ou composant **`SiteCta`** | Nouveaux styles de boutons « au feeling » |

**Où `AffaireCard` s’applique :** blog, médias, ressources, nos-affaires, carrousels expertise, posts similaires.

**Exceptions documentées seulement** (voir `docs/16-composants-ui.md`) :
- **Header** figé (bouton Contact nav) — ne pas y toucher
- **Admin** (`/admin/*`)
- Submit / actions de formulaires complexes (`ContactForm`)
- Pastilles TOC (`ExpertiseToc`, `LegalToc`) et chips de filtre locaux

**Propagation :** quand on change un composant canonique → **propager partout dans la même PR**.

Détail : `docs/16-composants-ui.md`.

### Données
- **Une** FAQ unifiée (pas 3 collections Wix).
- Blog : **slugs intouchables** ; catégories = liste fermée.
- Formulaires : pièces jointes + UTM + Cooked + `page_source`.
- Sources Wix brutes → `contenu/sources/wix/` uniquement.
- **Expertises — fidélité MD Wix (non négociable) :**  
  `contenu/sources/live-md/expertises/{slug}.md` = source rédactionnelle.  
  H2 → `section` · H3 → bloc (`headingLevel: 3`) · H4 → `headingLevel: 4` / `children` (pas aplatir).  
  Listes et liens : conserver. Interdit : fusionner, inventer, simplifier en prose.  
  Voir `docs/05-decisions.md` + `contenu/sources/live-md/LIRE-MOI.md`.

### Perf
- LCP / INP mobiles d’abord.
- Below-fold en lazy.
- Pas de JS Wix / tags inutiles.

### Backoffice (`site/src/app/admin/` ; `admin/` = placeholder)
- Cible domaine : `admin.jplouton-avocat.fr`
- V1 : **Demandes** + **Blog**
- Publish libre (avocats + Nicolas)
- Mail : `accueil@jplouton-avocat.fr`

### Docs
- Décision métier → `docs/05-decisions.md`
- Livraison → `JOURNAL.md`

## Interdit

- Renommer des URLs `/post/...` “pour faire plus joli”
- Réécrire les 422 articles à la main / à l’IA
- Inventer un type de page sans mettre à jour `09-architecture-site.md`
- Inventer une carte article ou un style de CTA public hors canon
- Aplatir H4 au niveau H3, fusionner des sections expertise, inventer du texte, « simplifier » des listes Wix en prose
- Committer CSV formulaires (PII) ou secrets `.env`
- Mettre des chemins absolus machine dans les scripts
- Mélanger exports bruts dans `articles/` (produit)

## Cursor Cloud specific instructions

- Toutes les commandes vivent dans `site/` (Next.js 16, React 19, Node 22). Les
  dépendances sont réinstallées automatiquement au démarrage (`npm install --prefix site`).
- Lancer le site : `cd site && npm run dev` → http://localhost:3000. Build/lint/typecheck :
  `npm run build`, `npx eslint .`, `npx tsc --noEmit` (tous depuis `site/`).
- Gardes (seuls tests, en lecture seule) : voir `docs/guides/gardes.md`. Elles ont
  besoin des dépendances installées (elles passent par `tsx`).
- ⚠️ Sans `SUPABASE_SECRET_KEY`, le site démarre **sans avertissement** en mode
  instantané JSON (422 articles servis, compteurs de vues à zéro, écritures base
  invisibles). C'est le mode par défaut ici, suffisant pour naviguer/tester le
  contenu. Détail : `docs/guides/demarrer.md`. Pour Supabase/Resend réels,
  renseigner les secrets dans `site/.env.local`.

# AGENTS.md — règles pour construire Plouton

Tu construis le site + backoffice du Cabinet Plouton.  
Nicolas n’est pas développeur : livrer clair, noter dans `JOURNAL.md`.

## Lire d’abord

1. `LIRE-MOI.md`
2. `docs/14-etat.md` ← **où on en est**
3. `docs/PASSATION-2026-07-18.md` si reprise après un autre agent
4. `docs/00-INDEX.md`
5. `docs/09-architecture-site.md` ← gabarits + CMS (**obligatoire**)
6. `docs/16-composants-ui.md` ← **composants UI canoniques**
7. `docs/06-ne-pas-perdre.md`
8. `docs/05-decisions.md`
9. `docs/11-stack-technique.md` si infra / déploiement
10. `contenu/LIRE-MOI.md` si tu touches au contenu

## Structure (ne pas mélanger)

| Zone | Contient | Ne contient pas |
|------|----------|-----------------|
| `site/` | Code Next.js public | Exports CSV, docs métier |
| `contenu/` | JSON produit + `sources/wix/` | `node_modules`, secrets |
| `scripts/` | Imports one-shot | Runtime site |
| `docs/` | Décisions | Code |
| `admin/` | Futur backoffice | Contenu |
| `base/` / `supabase/` | Migrations SQL | Contenu |

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

### Perf
- LCP / INP mobiles d’abord.
- Below-fold en lazy.
- Pas de JS Wix / tags inutiles.

### Backoffice (`admin/`)
- Cible : `admin.jplouton-avocat.fr`
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
- Committer CSV formulaires (PII) ou secrets `.env`
- Mettre des chemins absolus machine dans les scripts
- Mélanger exports bruts dans `articles/` (produit)

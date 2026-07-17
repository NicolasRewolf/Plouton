# AGENTS.md — règles pour construire Plouton

Tu construis le site + backoffice du Cabinet Plouton.  
Nicolas n’est pas développeur : livrer clair, noter dans `JOURNAL.md`.

## Lire d’abord

1. `LIRE-MOI.md`
2. `docs/00-INDEX.md`
3. `docs/09-architecture-site.md` ← gabarits + CMS (**obligatoire**)
4. `docs/06-ne-pas-perdre.md`
5. `docs/05-decisions.md`
6. `docs/11-stack-technique.md` si infra / déploiement
7. `contenu/LIRE-MOI.md` si tu touches au contenu

## Structure (ne pas mélanger)

| Zone | Contient | Ne contient pas |
|------|----------|-----------------|
| `site/` | Code Next.js public | Exports CSV, docs métier |
| `contenu/` | JSON produit + `sources/wix/` | `node_modules`, secrets |
| `scripts/` | Imports one-shot | Runtime site |
| `docs/` | Décisions | Code |
| `admin/` | Futur backoffice | Contenu |
| `base/` | Futur Supabase | Contenu |

## Principes non négociables

### Économie de code
- **Peu de gabarits**, beaucoup de données.
- Expertise = `ExpertisePageView` + JSON, pas une page React unique par URL.
- Réutiliser Header, Footer, FAQ, ContactForm, PostCard.

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
- Committer CSV formulaires (PII) ou secrets `.env`
- Mettre des chemins absolus machine dans les scripts
- Mélanger exports bruts dans `articles/` (produit)

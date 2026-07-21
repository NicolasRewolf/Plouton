# Backoffice

## Où ça vit (soir 18/07)

| Zone | Rôle |
|------|------|
| **`site/src/app/admin/`** | **Admin réel** (POC prod) — magic link Supabase, Demandes + Blog |
| **`admin/`** (racine) | Placeholder docs — future app dédiée `admin.jplouton-avocat.fr` |

## Pour qui

Le cabinet (secrétariat / avocats) — et Nicolas pour le suivi.

## Deux modules

### Blog
- Écrire / éditer un article (écrit en table `posts`)
- Mettre en brouillon ou publier (publish live public = **C5**)
- Choisir une catégorie
- Voir la liste des articles

### Demandes (formulaires)
- Voir toutes les prises de contact
- Ouvrir une demande (détail + PJ)
- Marquer : nouveau → en cours → traité (+ notes)
- Alerte mail → `accueil@jplouton-avocat.fr` (Resend)

## Ce que le client n’a pas à gérer

- La technique du site
- Cooked / les stats avancées
- Les redirections SEO (c’est notre job)

## État

**Construit dans `site/`** (C0–C4). Auth magic link.  
Public encore dual-run JSON → bascule lecture = **C5**.  
App monorepo `admin/` = pas encore d’app Next dédiée.

# Composants UI canoniques

Uniformité dure sur le site public. Une carte article, un style de CTA.  
Changer un canonique → **propager partout dans la même PR**.

## Canoniques

| Composant / classe | Rôle | Où |
|--------------------|------|-----|
| `AffaireCard` | Carte article (image, catégorie, titre, extrait, vues) | Blog, médias, ressources, nos-affaires, carrousels expertise, posts similaires |
| `SiteCta` | CTA public (`primary` \| `secondary`, flèche optionnelle, `tel:` OK) | Heroes, sticky, footer, bannières équipe, liens RDV |
| `.btn-pill` / `.btn-pill-primary` / `.btn-pill-icon` | Styles CTA dans `site/src/app/globals.css` (mix X) | Utilisés via `SiteCta` ou classes directes si besoin ponctuel |

`PostCard` = **déprécié** : thin wrapper → `AffaireCard`. Ne plus l’étendre.

## Exceptions (documentées)

| Zone | Pourquoi |
|------|----------|
| `Header` (bouton Contact nav + drawer) | Header **figé** (décision produit) — ne pas aligner sur `SiteCta` |
| `/admin/*` | Backoffice, autre langage UI |
| `ContactForm` (submit, modes RDV) | Formulaire complexe, parcours dédié |
| Pastilles TOC (`ExpertiseToc`, `LegalToc`) | Navigation d’ancres, pas des CTA marketing |
| Chips filtre (ex. nos-affaires, FAQ) | Filtres locaux, pas des CTA |

## Hors scope carte article

Les cartes **expertise** des hubs pôles (`PoleHub`) ne sont pas des articles blog — autre objet, autre composant.

## Références

- Règles agents : `AGENTS.md` § UI
- Décision : `docs/05-decisions.md` (2026-07-18 — Uniformité UI)
- Déviations pixel : `contenu/reference/deviations.json`

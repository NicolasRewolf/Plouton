# Taxonomie blog (Wix actuel)

À reproduire dans le backoffice. Un article peut avoir **plusieurs catégories** + **plusieurs tags**.

## Workflow publication
Comme Wix : **brouillon → publier**.

## 17 catégories

Alignées sur les expertises + 3 “vitrines” (Ressources, Médias, Divorce).

| Label | Slug URL | ~articles |
|-------|----------|-----------|
| Droit Pénal | `droit-pénal` | 121 |
| Procès criminels | `droit-criminel` ⚠️ label ≠ slug | 101 |
| Victimes de délits ou crimes | `indemnisation-des-victimes-pénale` ⚠️ | 109 |
| Médias | `médias` | 84 |
| Ressources et notions juridiques | `ressources-et-notions-juridiques` | 56 |
| Trafic de stupéfiants | `trafic-de-stupéfiants` | 49 |
| Violences conjugales et féminicides | `violences-conjugales-féminicides` | 44 |
| Défense des consommateurs | `défense-des-consommateurs` | 43 |
| Droit pénal des affaires | `droit-pénal-des-affaires` | 39 |
| Accidents de la route | `accidents-de-la-route` | 36 |
| Droit et accidents du travail | `droit-et-accidents-du-travail` | 18 |
| Accidents et erreurs médicales | `accidents-erreurs-médicales` | 14 |
| Droit de la famille | `droit-de-la-famille` | 13 |
| Accidents de la vie courante | `accidents-de-la-vie-courante` | 12 |
| Droit des assurances | `droit-des-assurances` | 9 |
| Divorce | `divorce` | 5 |
| Défense des élus | `défense-des-élus` | 0 |

**Attention migration :** garder les **slugs exacts** (même s’ils ne matchent pas le label) — sinon on casse les URLs catégories + Cooked.

## Tags (~377)
Mots-clés libres + tags techniques `rj-*` (ex. `rj-droit-pénal`, `rj-accident-route`) — semblent servir au rangement / SEO interne.

**Ma reco produit :**
- Catégories = **obligatoire** (au moins 1), liste fermée comme ci-dessus  
- Tags = **optionnels**, on importe tout, on nettoie plus tard (doublons / typos du type `avcoat pénaliste`)

## Lien nav site
- **Affaires / Médias / Ressources** dans le menu = surtout des **filtres de catégories blog**, pas des pages séparées magiques.

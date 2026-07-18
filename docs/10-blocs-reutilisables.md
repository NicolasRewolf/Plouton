# Blocs UI réutilisables (inventaire cible)

Chaque bloc = **un composant**, branché sur des données.  
Pas de copie-colle entre pages.

**Canon UI (soir 18/07) :** voir [`16-composants-ui.md`](16-composants-ui.md) — `AffaireCard` + `SiteCta` / `.btn-pill`.

| Bloc | Données | Où |
|------|---------|-----|
| `SiteHeader` | nav pôles + liens | partout (figé) |
| `SiteFooter` | idem + tel | partout (convergé PR #6) |
| `SiteCta` / `.btn-pill` | tel, lien honoraires, RDV | heroes, sticky, footer, bannières |
| `ExpertiseCard` | CMS Expertises | homepage, hubs |
| `TeamGrid` | CMS Équipe | home, notre-cabinet |
| `AffaireCard` | Blog / affaires | listings, carrousels, posts similaires |
| `PostCard` | — | **déprécié** (wrapper → `AffaireCard`) |
| `BlogListing` | Blog + filtres | nos-affaires, catégories, médias, ressources |
| `FaqAccordion` | FAQ unifiée filtrée | pages expertise (+ divorce) |
| `FaqSubfilters` | sous-expertises distinctes | pages expertise riches |
| `CaseStudyCards` | page_blocks ou CMS legacy | accidents route, etc. |
| `ContactForm` | schema unique | expertise, honoraires, divorce |
| `TableOfContents` | titres du corps | expertise longues |
| `SimulatorPension` / `SimulatorPrestation` | — | **seulement** divorce, lazy |
| `CookedTracker` | — | layout site |
| `Search` | index pages+posts | header |

> Anciens noms `PhoneCta` / `RdvCta` → remplacés par **`SiteCta`** (même style pill).

## Mapping expertise → filtres (à compléter en build)

Chaque `expertise_slug` doit déclarer :

```ts
{
  slug: 'accidents-de-la-route',
  pole: 'indemnisation-des-victimes',
  blogCategories: ['accidents-de-la-route'],
  faqExpertise: 'Accidents de la route', // libellé historique Wix ou slug normalisé
  formObjet: 'Accidents de la route',
  blocks: ['case-studies-route'], // optionnel
}
```

Ce fichier de config = le **cerveau** : une ligne nouvelle = page nouvelle presque gratis.

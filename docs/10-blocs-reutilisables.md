# Blocs UI réutilisables (inventaire cible)

Chaque bloc = **un composant**, branché sur des données.  
Pas de copie-colle entre pages.

| Bloc | Données | Où |
|------|---------|-----|
| `SiteHeader` | nav pôles + liens | partout |
| `SiteFooter` | idem + tel | partout |
| `PhoneCta` / `RdvCta` | tel fixe, lien honoraires | hero, sticky, footer |
| `ExpertiseCard` | CMS Expertises | homepage, hubs |
| `TeamGrid` | CMS Équipe | home, notre-cabinet |
| `PostCard` | Blog | home, listings, related |
| `BlogListing` | Blog + filtres | nos-affaires, catégories, médias, ressources |
| `FaqAccordion` | FAQ unifiée filtrée | pages expertise (+ divorce) |
| `FaqSubfilters` | sous-expertises distinctes | pages expertise riches |
| `CaseStudyCards` | page_blocks ou CMS legacy | accidents route, etc. |
| `ContactForm` | schema unique | expertise, honoraires, divorce |
| `TableOfContents` | titres du corps | expertise longues |
| `SimulatorPension` / `SimulatorPrestation` | — | **seulement** divorce, lazy |
| `CookedTracker` | — | layout site |
| `Search` | index pages+posts | header |

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

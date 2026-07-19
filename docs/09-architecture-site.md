# Architecture du site — comprendre avant de construire

Ce document est la **carte mentale** pour l’IA (et Nicolas).  
But : construire **peu de modèles de pages**, brancher les **mêmes briques** partout — pas 25 pages inventées une par une.

---

## 1. Idée centrale (à ne jamais oublier)

Le site n’est **pas** 470 pages indépendantes.

C’est :

1. **Peu de types de pages** (gabarits)  
2. **Des collections de contenu** (blog, FAQ, équipe, expertises…)  
3. **Des filtres** qui branchent une collection sur le bon endroit  

```
COLLECTION ──filtre──► BLOC UI ──► apparaît sur 1..N pages
```

Exemple : **une FAQ** écrite une fois → filtrée `domaine = Accidents de la route` + `sous-domaine = Grands blessés` → s’affiche sur la page expertise accidents de la route (et nulle part ailleurs, sauf si d’autres filtres matchent).

Exemple : **un article blog** → catégories Médias + Pénal des affaires → apparaît dans `/nos-affaires`, dans Médias, dans le fil d’actu homepage, et en “liés” sur la page expertise.

---

## 2. Carte des types de pages (sitemap logique)

Taxonomie déjà utilisée par **Cooked** (`cooked_page_type`) — on la reprend telle quelle.

| Type | URLs typiques | Rôle |
|------|---------------|------|
| **cabinet** | `/`, `/notre-cabinet`, `/honoraires-rendez-vous`, `/mentions-legales`, `/politique-de-confidentialite`, `/cookies`, `/comprendre-le-droit` | Institutionnel / conversion / légal |
| **hub** | `/defense-penale`, `/indemnisation-des-victimes`, `/droit-des-contrats-et-des-personnes` | Entrée d’un pôle (3) |
| **expertise** | `/…/accidents-de-la-route`, `/…/avocat-divorce-bordeaux`, etc. | Page SEO longue + FAQ + form + preuves |
| **post** | `/post/{slug}` | Article |
| **blog-nav** | `/nos-affaires`, `/medias`, `/comprendre-le-droit` | Listes / filtres d’articles (3 hubs) |

**~25 URLs “structure”** + **422 posts** + **16–17 catégories**.

### Arborescence des 3 pôles

```
Défense pénale
  ├─ droit-penal
  ├─ proces-criminel
  ├─ trafic-de-stupefiant
  ├─ violences-conjugales-et-feminicides
  ├─ droit-penal-des-affaires
  └─ defense-des-elus

Indemnisation des victimes
  ├─ victimes-de-delits-ou-crimes
  ├─ accidents-de-la-route
  ├─ droit-et-accidents-du-travail
  ├─ accidents-et-erreurs-medicales
  └─ accidents-de-la-vie-courante

Droit des contrats et des personnes
  ├─ droit-assurances-…
  ├─ defense-des-consommateurs
  ├─ droit-de-la-famille
  └─ droit-de-la-famille/avocat-divorce-bordeaux   ← page Ads critique
```

Nav secondaire **Affaires / Médias / Ressources** = **vues filtrées du blog**, pas des CMS séparés.

---

## 3. Collections → où elles s’affichent

### Blog (422 posts + catégories + tags)

| Surface | Comment |
|---------|---------|
| Homepage | Fil d’actu + cartes “dernières affaires” |
| `/nos-affaires` | Liste + **filtres catégories** (`AffairesGallery`) |
| `/medias` | Articles Médias + **chips** (thèmes présents) |
| `/comprendre-le-droit` | Hub éditorial + grille **Toutes les ressources** filtrable |
| Nav Médias | `/medias` |
| Nav Ressources | `/comprendre-le-droit` |
| Page expertise | Articles liés (même thème / catégorie) |
| Page post | Corps + tags + related posts |

**Règle smart :** un seul composant `AffaireCard` + `AffairesGallery` paramétré (hub). CTA public = `SiteCta` / `.btn-pill` ([`16-composants-ui.md`](16-composants-ui.md)). `/blog` et `/blog/categories/…` = **301** vers les hubs (plus de surface publique).

### FAQ (plusieurs collections Wix aujourd’hui — à unifier demain)

| Collection Wix | Volume | Usage observé |
|----------------|--------|----------------|
| `FAQ` | ~238 | Pages expertise : filtre `domaine1` + `sousdomaine1` (ex. Accidents de la route → Grands blessés, Loi Badinter…) |
| `Import1` (FAQ V2) | ~248 | Pages plus récentes (ex. Défense des élus) : `expertise` + `sousExpertise` |
| `FAQDivorce` | ~7 | Page divorce uniquement |

Sur la page accidents de la route : **filtres UI** (cases) = les **sous-domaines** FAQ, pas du contenu en dur.

**Règle smart V1 data :** **une seule table `faq`** avec `expertise_slug` + `sous_expertise` + question/réponse. Migrer FAQ + FAQ V2 + FAQDivorce dedans. **Validé Nicolas 17/07/2026.** Plus de 3 collections.

### Expertises (CMS `Expertises`, 14)

- Homepage : cartes des 3 pôles (titre, image, `synthseHomepage`, lien `url`, `domaineFiltre`)
- Pas le corps long de la page expertise (celui-ci est du contenu de page)

### Équipe (`Equipes`, 6)

- Homepage + `/notre-cabinet` (+ éventuellement footer / page contact)

### Études de cas / blocs page-spécifiques

| Collection | Où |
|------------|-----|
| `Exemplesaffairesaccidentdelarou` | Page accidents de la route (défis / action / résultat) |
| `Accidentsdelaviecourante` | Blocs illustrés sur cette expertise |
| `Competencescabaccidentsdelavie` | Idem, compétences affichées |

**Règle smart :** soit ces petits CMS deviennent des **sections MDX / JSON** de la page expertise, soit une table `page_blocks` générique `{ page_slug, type, payload }`. Éviter une collection Wix par page.

### Formulaires

- Même schéma partout (expertise + honoraires + parfois divorce)
- Champs + UTM + `page_source` + Cooked
- Objet de demande aligné sur les expertises (+ « Nous rejoindre »)

### Simulateurs (divorce)

- Composants isolés montés **seulement** sur la page divorce (lazy) — pas dans le bundle global
- Déclenchement via le JSON expertise : champ optionnel `section.simulator`
  - `"pension-alimentaire"` → `SimulatorPension` (barème justice.fr)
  - `"prestation-compensatoire"` → `SimulatorPrestation` (méthodes doctrinales indicatives)
- Formules dans `site/src/lib/simulators/` ; UI dans `site/src/components/simulators/`
- Disclaimer obligatoire : estimation indicative, sans valeur juridique + CTA `#contact`

---

## 4. Architecture “économique & ultra smart” (cible Next)

### Moins de pages code, plus de données

```
site/
  app/
    (cabinet)/          ← peu de routes
    (hub)/[pole]/
    (expertise)/[...slug]/page.tsx   ← UN gabarit
    post/[slug]/
    blog/...
    nos-affaires/
  components/blocks/    ← FAQ, Form, AffaireCard, SiteCta, Team, CaseStudy, TOC, Simulators
  content/ ou base/     ← pages expertise en MDX/CMS + clés de filtre
```

### Gabarit `ExpertisePage` (le plus important)

Slots ordonnés (tous optionnels sauf hero + form) :

1. Hero (H1, preuve sociale, CTA tel / RDV)  
2. TOC (ancres)  
3. Corps éditorial (MDX ou rich text CMS)  
4. Blocs spéciaux (case studies, simulateurs…)  
5. **FAQ** filtrée par `expertise_slug` (+ sous-filtres UI)  
6. **Articles liés** (blog, même catégorie / thème)  
7. **Formulaire** (même composant, `page_source` = path)

Une nouvelle expertise = **données + contenu**, presque **zéro nouveau composant**.

#### Fidélité structurelle (non négociable)

Source rédactionnelle : `contenu/sources/live-md/expertises/{slug}.md` (= Wix).

| MD Wix | JSON `sections` / `blocks` |
|--------|----------------------------|
| **H2** | `section.title` (1 section = 1 H2) |
| **H3** | `blocks[].heading` + `headingLevel: 3` (défaut) |
| **H4** | `headingLevel: 4` ou `blocks[].children[]` — **pas** le même niveau que H3 |
| Listes | `body` avec `- ` **ou** `bullets: string[]` |

Rendu : `ExpertiseBody` (H3 ≠ H4, listes en `<ul>`).  
Décision : `docs/05-decisions.md`. **Interdit** de fusionner / inventer / aplatir.

### Gabarit `LegalPageView` (pages légales)

Un seul gabarit pour :
- `/mentions-legales`
- `/politique-de-confidentialite`
- `/cookies`

Contenu JSON dans `contenu/pages/{slug}.json` (sections + `id` pour TOC).  
UI : `LegalPageView` + `LegalToc` (sticky — pastilles mobile, rail desktop).  
Pas de page React unique par URL au-delà de la route fine.

### Gabarit `BlogListing`

Props : `categories[]`, `title`, `tri`, `exclude?`  
Sert : catégories blog, (anciennement stub médias).

### Gabarit `RessourcesHub` (cabinet)

Page `/comprendre-le-droit` — **pas** un listing blog plat.

- Données : `contenu/pages/comprendre-le-droit.json` (intro + sections + slugs)
- UI : `RessourcesHub` + `AffaireCard`
- « Articles les plus consultés » = tri `viewCount` (`stats-posts.json`), filtre catégorie Ressources
- Sections thématiques = **slugs hardcodés** (les Tags Wix dans `Posts.csv` ne sont que des UUID, pas de libellés dans le produit)
- Grille **Toutes les ressources** = `AffairesGallery` (chips) ; « Voir tout » → ancre `#toutes-les-ressources`
- Nav **Médias** → `/medias` (`AffairesGallery`) ; anciennes URLs `/blog/categories/…` → 301

### Gabarit `PoleHub` (3 pôles)

Pages :
- `/defense-penale`
- `/indemnisation-des-victimes`
- `/droit-des-contrats-et-des-personnes`

- Données : `contenu/pages/pole-*.json` (titre, intro, cards) + **registry** (`poles-registry.json`) pour liens / heroes
- UI : `PoleHub` + `pole-hub.ts` / `pole-hub-route.tsx`
- Une nouvelle expertise enfant = JSON expertise + entrée registry (+ card optionnelle sur le hub) — **pas** de page React dédiée au hub

### Shell global

Header (3 pôles + Affaires/Médias/Ressources/Équipe + recherche + RDV)  
Footer (mêmes liens + tel)  
Cooked tracker  
Conversion Ads (Nomad) sur submit form

---

## 5. Ce que Wix fait mal (et qu’on ne reproduit pas)

- Une collection CMS **par page** (ex. Accidents vie courante) → on **généralise**
- FAQ dupliquée (FAQ / FAQ V2 / FAQDivorce) → on **unifie**
- Répéteurs Wix hydratés partout → on **SSR** le nécessaire, lazy le reste (simulateurs, below-fold)
- Tags blog sales / doublons → on importe, on nettoie après

---

## 6. Checklist pour l’IA qui construit

Avant d’ajouter un fichier page :

1. Est-ce un **nouveau gabarit** ou une **instance** d’un gabarit existant ?  
2. Le contenu vient-il d’une **collection déjà mappée** ?  
3. Peut-on **réutiliser** `FaqAccordion` / `AffaireCard` / `SiteCta` / `ContactForm` ?  
4. Est-ce **above-the-fold** critique perf (LCP) ou below-fold lazy ?  
5. L’URL est-elle dans le **plan de redirections** ?

Si tu crées un 4ᵉ type de FAQ “parce que Wix l’avait” → **non**. Tu étends le modèle unique.

---

## 7. Liens

- Ne pas perdre : `06-ne-pas-perdre.md`  
- Taxonomie blog : `07-taxonomie-blog.md`  
- Migration posts : `08-migration-blog.md`  
- Décisions produit : `05-decisions.md`

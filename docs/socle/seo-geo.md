# SEO / GEO — exigence maximale

Validé Nicolas 17/07/2026 : **pratique SEO/GEO sans précédent, parfaite**, dès le POC — pas un chantier “plus tard”.

---

## SEO (moteurs)

Sur **chaque** type de page, dès la V1 POC :

| Type | Title / meta | JSON-LD | Autres |
|------|--------------|---------|--------|
| Accueil | Marque + ville + pôles | `Organization` + `LegalService` + `WebSite` (+ SearchAction si recherche) | canonique `/` |
| Expertise | Requête + Bordeaux | `LegalService` ou `Service` + `BreadcrumbList` + `FAQPage` si FAQ | TOC, Hn propres |
| Article | Titre article | `BlogPosting` + `BreadcrumbList` + `Person` auteur | dates, image OG |
| Listing blog | Catégorie | `CollectionPage` + `BreadcrumbList` | pagination si besoin |
| Contact | Honoraires / RDV | `LegalService` + `ContactPage` | NAP cohérent |
| Admin | **noindex** | — | jamais indexé |

### NAP (cohérence partout)
- Cabinet Plouton  
- 15 Pl. Sainte-Eulalie, 33000 Bordeaux  
- 05 56 44 35 96  
- Même texte footer / schema / contact  

### Technique
- `sitemap.xml` + `robots.txt`  
- Canoniques absolues  
- OG / Twitter cards  
- Images : alt, dimensions, formats modernes  
- Pas de contenu fantôme / duplicate Wix+nouveau (préprod noindex)  
- Redirections 301 (fichier imports) respectées au cutover  

---

## GEO (réponses IA / citations)

Rendre le cabinet **citable** par ChatGPT, Perplexity, etc. :

1. **Entité claire** — nom, adresse, téléphone, zones, pôles, dans schema + texte  
2. **Faits datés** — affaires / articles avec dates visibles  
3. **Questions/réponses** — FAQ structurée (`FAQPage`)  
4. **Titres qui répondent** — H2 = questions réelles des gens  
5. **Pas de blabla** — une idée par section (aligné archi)  
6. **Auteur humain** — avocat nommé sur les posts  

---

## Interdit
- Schema décoratif faux (avis inventés, AggregateRating fantaisiste)  
- Title keyword stuffing  
- Pages orphelines sans lien interne  
- Admin / préprod indexables  

---

## Référence implémentation POC
Les pages `site/` doivent embarquer les JSON-LD dans le `<head>` (ou via composant `JsonLd`).  
Toute nouvelle page = cocher ce doc avant merge.

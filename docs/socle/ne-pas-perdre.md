# Ce qu’il ne faut pas perdre

Étude du site actuel (Wix) — 16 juillet 2026.  
Sources : navigation du site, API Wix (blog + CMS + formulaires), audit Cooked perf divorce (03/06/2026).

**But de la migration :** sortir du plafond Wix pour gagner en **Core Web Vitals** (surtout LCP / INP mobiles), **sans casser** l’acquisition (SEO + Ads) ni le travail de l’équipe.

---

## 1. Ce qui rapporte — intouchable sans plan

### Les URLs (le capital Google)
- **~25 pages** de site + **422 articles** + **16 catégories blog** ≈ **~470 URLs**
- Format articles : `/post/...` (souvent longs, avec accents)
- Catégories : `/blog/categories/...`
- Expertises en arborescence (ex. `/indemnisation-des-victimes/accidents-de-la-route`)

**Ne pas perdre :** chaque URL qui ranke doit **rediriger** (301) vers la nouvelle. Une migration sans plan de redirections = perte de trafic.

### Le contenu qui fait ranker
- Pages expertises **très longues** (ex. accidents de la route, divorce) : TOC, FAQ, exemples chiffrés, jargon cliquable (Badinter, ITT, etc.)
- Audit divorce : **ne pas sacrifier le volume de texte** (~3 400 mots sur cette page) — c’est ce qui ranke
- Blog : titres, extraits, images, catégories, tags, articles liés, auteurs

### La mesure & la pub
- **Cooked** (visiteurs, formulaires, téléphone, CWV) — déjà en place
- Champs cachés sur les formulaires : `cooked_aid`, `cooked_sid`, UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`…)
- **Google Ads** : une part importante du trafic mobile est payante ; les conversions formulaire / appel **ne doivent pas casser** le jour du basculement

---

## 2. Ce que l’équipe utilise — backoffice critique

### Aujourd’hui (côté Wix, douloureux)
| Besoin | Où c’est | Volume |
|--------|----------|--------|
| Publier / modifier le blog | Wix Blog | **422** articles |
| Lire les demandes de contact | Wix Forms | **~752** soumissions (formulaire principal) |
| FAQ par expertise | CMS FAQ (+ FAQ V2) | **~238–248** entrées |
| Équipe | CMS Équipe | **6** personnes |
| Cartes expertises (homepage) | CMS Expertises | **14** |

### Formulaire principal — champs à conserver
Ce que le cabinet reçoit vraiment :
- Prénom, Nom  
- Entreprise (optionnel)  
- Email, Téléphone  
- **Objet de la demande** (liste : ex. Droit de la famille…)  
- Message  
- **Pièces jointes** (« Je joins des fichiers à mon dossier »)  
- + UTM + page d’origine + ids Cooked (pour toi / la mesure)

**Deuxième formulaire :** Divorce (peu de volume, mais page stratégique Ads/SEO).

### Ce que le nouveau backoffice doit faire *mieux* que Wix
1. **Blog** : écrire, brouillon, publier, catégories, image, sans galère Wix  
2. **Demandes** : boîte de réception claire, statut (nouveau → traité), notes, **fichiers joints accessibles**  
3. (Ensuite) FAQ / équipe / expertises dans le même outil  

Sans ça, on change de site mais l’équipe reste bloquée.

---

## 3. Ce que le visiteur attend — parcours

### Navigation (structure métier)
- 3 pôles : Défense pénale · Indemnisation · Contrats & personnes  
- Raccourcis : Affaires · Médias · Ressources · Équipe  
- CTA partout : **Appeler** + **Prendre rendez-vous**  
- Recherche sur le site  
- Preuve sociale : avis Google (ex. 4,6/5 — 193 avis)

### Pages “machines à convertir”
- Accueil (fil d’actu + expertises + équipe)  
- Chaque page expertise (long contenu + FAQ + form en bas)  
- `/honoraires-rendez-vous` (form + honoraires + accès)  
- `/…/avocat-divorce-bordeaux` (page Ads/SEO critique)  
- Blog / catégories Ressources & Médias  

### Fonctions spéciales à ne pas “oublier dans un coin”
- **FAQ filtrées** par expertise / sous-expertise sur les pages métier  
- **Simulateurs** (page divorce : prestation compensatoire, pension…) — lourds pour la perf, utiles pour le lead  
- Articles “outils” (ex. échelle de Glasgow)  
- Mentions légales / médiateur / honoraires (obligations pro)

---

## 4. Perf — pourquoi migrer (et la baseline)

Mesures Cooked / lab sur la page divorce (archive 03/06/2026) :

| Métrique | Terrain (vrais mobiles) | Cible |
|----------|-------------------------|--------|
| LCP p75 | **~4,6 s** | **&lt; 2,5 s** |
| INP | ~256 ms | **&lt; 200 ms** |
| CLS | déjà bon (~0,01) | garder |
| TTI lab mobile | **~28 s** | casser le plafond Wix |

**Diagnostic déjà posé :** ce n’est pas “le serveur Wix seul” — c’est le **JS Wix + tags tiers** (GTM, Ads, Cookiebot, etc.) qui saturent le téléphone.  
Sur Wix, même optimisé, on plafonne. **Next.js sert à dépasser ce plafond**, pas juste à “refaire joli”.

---

## 5. Ce qu’on peut laisser / simplifier (pas sacré)

À trancher avec Nicolas — candidats à alléger :
- Doublon FAQ / FAQ V2 (deux collections qui se marchent dessus)  
- Apps Wix inutiles (Stores, Members, UTM ClickApps si Cooked suffit)  
- Recherche site si peu utilisée  
- Commentaires blog si jamais utilisés  
- Historique des 752 formulaires : **archiver** vs tout importer dans le nouvel outil  

---

## 6. Ordre de priorité “ne pas perdre”

1. **Redirections URLs** + titres / meta  
2. **Formulaire** (champs + fichiers + UTM + Cooked) → backoffice Demandes  
3. **Blog** (422) + catégories → backoffice Blog  
4. **Pages expertises** (contenu long + FAQ)  
5. **Cooked + pixels Ads** le jour J  
6. **Équipe / honoraires / légal**  
7. Simulateurs & extras  

---

## 7. Décisions verrouillées (réponses Nicolas — 16/07/2026)

| Question | Réponse |
|----------|---------|
| Qui publie / lit les demandes ? | **Tous les avocats** ou Nicolas |
| Alerte nouvelle demande ? | E-mail **`accueil@…`** (Alexia) + **notif backoffice** |
| Statuts Demandes ? | **Mêmes libellés Outlook** (liste provisoire → valider avec Alexia) |
| Blog — qui publie ? | **Tous les avocats + Nicolas**, brouillon *et* publish libres |
| Candidatures ? | **Onglet séparé** ; e-mail **toujours `accueil@`** (seule boîte) |
| Secib ? | **V1 à la main** (API Secib existe sur devis — plus tard si besoin) |
| Ads / Nomad ? | **Cooked** = mesure maison ; **tag Ads** = pour Nomad (les 2, jobs différents) |
| URL admin ? | **`admin.jplouton-avocat.fr`** |
| Pièces jointes ? | **Oui — indispensables** (usage quotidien) |
| Simulateurs divorce ? | **Oui — on garde** |
| Google Ads ? | Agence **Nomad Marketing** (coordonner le cutover) |
| Historique ~752 demandes ? | **On transfère** (export CSV possible) |
| Recherche site ? | **On garde** |

Détail → `docs/05-decisions.md`.

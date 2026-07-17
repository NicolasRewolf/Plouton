# Journal des livraisons

Chaque entrée = ce qui a changé, en français, pour Nicolas.  
Pas de jargon. 5 lignes max par livraison.

---

## 2026-07-17 — Page article complète (copie du live)

Gabarit `/post/[slug]` refait section par section d'après le site Wix live :

- Feuille blanche sur fond gris, auteur avec photo (Drive, compressées), étoiles, encadrés « chiffres »
- Barre CTA sticky (Nous appeler / Je prends rendez-vous), bio auteur, tags, catégories cliquables, partage, vues/likes, Posts similaires, Commentaires, bandeau équipe + avis Google
- Données : articles enrichis (`authorId`, `tags`, `updatedAt`, `stats`) + `contenu/auteurs.json` — les compteurs seront remplis par l'import Wix puis Cooked/Supabase

Lancer : `cd site && npm run dev` → http://localhost:3000/post/garde-a-vue-droits-avocat

---

## 2026-07-17 — Visuel = site live (pas Outremer)

Direction corrigée : **copie proche du site Wix actuel**, pas une nouvelle charte.

- Accueil : hero centré, 3 barres photo, ticker ACTUALITÉS, menu burger
- Expertise droit pénal : marteau en barres, titre corail, sommaire gauche, boutons mail/tél
- Couleurs live (navy + corail #fe4338), logos Drive

Lancer : `cd site && npm run dev` → http://localhost:3000

---

## 2026-07-17 — POC local (preuve)

Pages livrées **sans cloud payant** (fichiers `contenu/`) :

- `/` homepage  
- `/defense-penale/droit-penal` expertise (gabarit + FAQ + form)  
- `/post/indemnisation-passager-accident-route` article  
- `/contact` formulaire  
- `/admin` backoffice blog (brouillon / publier)

SEO/GEO : JSON-LD Organization/LegalService, BlogPosting, FAQPage, BreadcrumbList, ContactPage · admin noindex.

Lancer : `cd site && npm run dev` → http://localhost:3000

---

## 2026-07-17 — Stack + FAQ unique + Sandbox

- **FAQ :** une seule (fusion des 3 Wix à l’import) — validé Nicolas
- **Sandbox Wix :** ne pas activer (inutile pour notre migration)
- Stack balisée : `docs/11-stack-technique.md` (Supabase + Vercel + Cooked + DNS)

---

## 2026-07-17 — Architecture site (bases approfondies)

- Carte types de pages (cabinet / hub / expertise / post / blog-nav) alignée Cooked
- Mapping CMS → surfaces (FAQ filtrée, blog multi-vues, Expertises, Équipe, blocs page)
- Cible “économique” : peu de gabarits, `ExpertisePage` + blocs réutilisables
- Docs : `09-architecture-site.md`, `10-blocs-reutilisables.md`, `AGENTS.md`

**Prochaine livraison attendue :** grill archi (unifier FAQ, config expertises) puis code.

---

## 2026-07-16 — Grill métier (suite)

- Admin URL : **`admin.jplouton-avocat.fr`**
- Ads : Cooked ≠ tag Nomad (les 2) ; UTM Catcher Wix remplacé par Cooked
- Secib V1 à la main ; candidatures onglet séparé, mail `accueil@` uniquement
- Blog : tous publient librement

**Prochaine livraison attendue :** fin du grill critique → squelette backoffice.

---

## 2026-07-16 — Exports + taxonomie blog + identité

- Blog : **brouillon → publier** (comme Wix) ; taxonomie documentée (`docs/07-taxonomie-blog.md`) — 17 cat. + ~377 tags
- Rangé : 301 (**161**), formulaires (**752**, hors git), identité Drive (symlink)
- Voir `contenu/imports/LIRE-MOI.md`

**Prochaine livraison attendue :** suite du grill + squelette backoffice.

---

## 2026-07-16 — Référence UI (jakubkrehel)

- Gardée sous le coude pour la **duplication du site public** : https://www.ui-skills.com/skills/jakubkrehel  
  (better-colors, better-typography, better-ui)
- Noté dans `docs/05-decisions.md` — **pas** pour le squelette backoffice immédiat

**Prochaine livraison attendue :** grill métier → puis squelette backoffice.

---

## 2026-07-16 — Réponses métier verrouillées

- Backoffice : **tous les avocats** (+ Nicolas)
- Formulaires : **pièces jointes obligatoires** ; historique **à importer** (CSV OK)
- Site : **simulateurs divorce** + **recherche** conservés
- Ads : coordination **Nomad Marketing** avant bascule
- Noté dans `docs/05-decisions.md` et `06-ne-pas-perdre.md`

**Prochaine livraison attendue :** squelette backoffice (Blog + Demandes multi-users).

---

## 2026-07-16 — Étude « ne pas perdre »

- Site parcouru (accueil, expertise accidents route, honoraires, divorce)
- API Wix : blog 422, FAQ, équipe, expertises, formulaires (~752 + divorce)
- Baseline perf rappelée (LCP mobile ~4,6 s sur divorce — plafond Wix)
- Synthèse écrite : `docs/06-ne-pas-perdre.md`

**Prochaine livraison attendue :** réponses aux questions + squelette backoffice.

---

## 2026-07-16 — Fondation du repo

- Repo GitHub branché sur le Mac (`Desktop/Plouton`)
- Plan de maison posé : `LIRE-MOI.md` + dossiers `docs/`, `admin/`, `site/`, `contenu/`, `base/`
- Objectif rappelé : backoffice blog + formulaires, puis site public hors Wix
- Rien de visible en ligne pour l’instant — c’est le chantier vide, propre

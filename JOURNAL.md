# Journal des livraisons

Chaque entrée = ce qui a changé, en français, pour Nicolas.  
Pas de jargon. 5 lignes max par livraison.

---

## 2026-07-18 — Illustrations hero pages expertise

- 13 visuels fournis branchés dans `site/public/brand/expertises/` (noms = slugs)
- Manque encore : **divorce** (ancienne image conservée)
- À voir sur n’importe quelle page expertise (photo en haut à droite)

## 2026-07-18 — Home : section « À vos côtés » avec photo équipe

- Sous le hero : photo de groupe à gauche, texte à droite (comme le site actuel)
- Titre en deux couleurs (rouge + bleu) + citation en petit
- Photo ajoutée dans `site/public/brand/equipe-home.webp`
- À voir : http://localhost:3000/

## 2026-07-18 — Maintenance globale expertises (check live)

- Script `scripts/check-expertises-live.py` : snapshot MD de chaque page + contrôle titres / textes / liens
- MD live → `contenu/sources/live-md/expertises/` · rapport → `contenu/reference/expertise-health-report.json`
- Relance `--fix` : **0 erreur** sur 14 pages (junk nettoyé, liens rafraîchis)
- Trafic : URL live en singulier (`livePath`) sans casser notre URL avec s

## 2026-07-18 — Page « Nos affaires » refaite (style éditorial)

- Liste illisible remplacée par une **grande grille de cards** (image, catégorie, extrait, vues)
- **Filtres par catégorie** en haut + bouton « Voir plus »
- Écart volontaire noté dans `contenu/reference/deviations.json` (pas une copie pixel Wix)
- À voir : http://localhost:3000/nos-affaires

## 2026-07-18 — Carrousel affaires sur les pages expertise

- Même style de cards en **bandeau horizontal** en bas de chaque expertise
- Catégorie branchée correctement (ex. accidents de la route → articles « Accidents de la route »)
- À tester : `/defense-penale/droit-penal` et `/indemnisation-des-victimes/accidents-de-la-route`

## 2026-07-18 — FAQ expertise (composant commun)

- FAQ déjà dans `contenu/faq/` (1 fichier par expertise, avec sous-catégories)
- Accordéon + **filtres par sous-sujet** (même style que Nos affaires)
- Branché sur les ~15 pages expertise — le contenu change, le composant reste le même

## 2026-07-18 — Méga-menu header (v2)

- Survol des pôles → panneau avec liens + petites flèches animées
- Menu mobile en tiroir, accordéons fluides
- Micro-détails : chevrons, soulignement accent, fond flou, press scale

## 2026-07-18 — Formulaire RDV refait

- Plus qu’un bloc gris : titre, promesses, mode cabinet/visio/tél, urgence, objets complets
- Zone fichiers glisser-déposer, consentement, succès soigné
- Champs alignés API (`prenom`/`nom`) + UTM / Cooked captés dans l’URL

## 2026-07-18 — Expertise : vieilles FAQ / actualités retirées

- Blocs scrapés « Foire aux questions » et « Affaires récentes » enlevés des JSON (14 pages)
- On garde les vrais composants : accordéon FAQ + carrousel affaires
- Plus de doublons en bas de page

## 2026-07-18 — Expertise : RDV scrapé + sommaire intelligent

- Sections « Je prends rendez-vous maintenant » retirées (le vrai formulaire suffit)
- Sommaire sticky sous le header : pastille active selon le scroll + barre rouge de progression

## 2026-07-18 — Expertise hero + sommaire (v2)

- Ancres **courtes** (comme le live : « Premiers réflexes », etc.)
- Bandeau sommaire en **verre flou**, sans barre rouge ni ombre bizarre
- Nouveau hero : pôle + H1 + intro à gauche, photo slash + picto à droite

## 2026-07-18 — Corps expertise mis en page

- Plus de mur H2/texte : **étapes numérotées**, **cartes exemples €**, **grille de définitions**
- Nettoyage auto du scrape (doublons, numéros orphelins)
- Sections en bandes alternées, plus large, rythme de lecture

## 2026-07-18 — Liens internes expertise restaurés

- Le scrape avait perdu les `<a>` → textes nus
- Liens harvestés du live (`inlineLinks`) et réinjectés dans le corps (Badinter, ITT, pretium, articles…)

## 2026-07-18 — Accidents de la route : textes nettoyés (MD live)

- JSON reconstruit depuis l’export markdown du live (titres, leads, étapes)
- Fini les « 1 / 2 / 3 » orphelins, doublons, accents cassés (« On constate »)
- Liens internes (Badinter, ITT, pretium, affaires…) branchés dans le corps

## 2026-07-18 — Formulaire RDV v3 (envie + clarté)

- Bandeau confiance : **avis Google 4,6/5** + prix 1er RDV (180 € / 30 min)
- Parcours en 3 étapes visibles (écrire → rappel → RDV sous 7 jours)
- Modes cabinet / visio / tél en cartes avec icônes ; urgence mise en avant
- Champs plus lisibles (bordures nettes, indicatif +33), CTA + numéro d’appel
- À voir : `/honoraires-rendez-vous`

---

## 2026-07-17 — Audit santé du site (repo au clair)

- Site public **sain** : archi propre (9 composants, 5 modules), **422 articles** OK, SEO préservé
- Câblage Supabase **correct** (clé serveur, clés en prod) — test bout-en-bout à faire
- **Limites connues** notées : backoffice Demandes à construire, auth admin absente, pièces jointes + email pas branchés
- Détail complet : `docs/15-audit-sante.md`

---

## 2026-07-17 — 🟢 EN LIGNE : Supabase + prod Vercel

- **Base** : migration appliquée → table `demandes` créée (RLS + index), vérifiée
- **Prod** : PR #2 fusionnée dans `main` → déploiement Vercel **au vert** (512 pages) ; l'ancien build en erreur (Root Directory mal réglé) est corrigé
- **Clés Supabase** : vérifiées présentes sur **Production** → le formulaire est prêt à enregistrer
- Site en ligne mais **protégé par login + `noindex`** (public/Google ne voient rien tant que le domaine n'est pas branché)
- 👉 État complet et à jour : `docs/14-etat.md`

---

## 2026-07-17 — Vraie migration : bombes désamorcées + cloud branché

- **Déployable** : `contenu/` embarqué dans le build Vercel ; écritures via un
  `ContentStore` (fs local / Supabase en ligne) — plus aucune demande perdable
- **/blog + 17 pages catégories** créées (les liens des 422 articles marchent)
- **161 redirections 301** rejouées depuis l'export Wix
- **474 médias rapatriés** (covers, images d'articles, équipe) — zéro dépendance Wix
- **Supabase** : buckets créés, formulaire branché (il manque 1 SQL à coller — voir PR)
- **Vercel** : projet lié, variables posées, root `site/`, préprod protégée

## 2026-07-17 — Page article complète (copie du live)

Gabarit `/post/[slug]` refait section par section d'après le site Wix live :

- Feuille blanche sur fond gris, auteur avec photo (Drive, compressées), étoiles, encadrés « chiffres »
- Barre CTA sticky (Nous appeler / Je prends rendez-vous), bio auteur, tags, catégories cliquables, partage, vues/likes, Posts similaires, Commentaires, bandeau équipe + avis Google
- Données : articles enrichis (`authorId`, `tags`, `updatedAt`, `stats`) + `contenu/auteurs.json` — les compteurs seront remplis par l'import Wix puis Cooked/Supabase

Lancer : `cd site && npm run dev` → http://localhost:3000

---

## 2026-07-17 — Grand ménage repo (pré-migration)

- Sources Wix isolées dans `contenu/sources/wix/`
- `.gitignore` racine solide (node_modules, .next, PII, .claude…)
- Docs indexées (`docs/00-INDEX.md`), LIRE-MOI partout
- Brand sans doublons ; scripts sans chemins machine
- Prêt pour Supabase / Vercel / GitHub propre

---

## 2026-07-17 — Expertises pixel-close

- Gabarit unique aligné live : hero 3 barres, TOC pastilles, colonne 680px
- Heroes Wix téléchargés pour les 14 expertises
- À peaufiner : FAQ live complète, liens dans les textes, micro-espacements

## 2026-07-17 — Site structure presque complet

- Honoraires & RDV : `/honoraires-rendez-vous` (textes live)
- Équipe : `/notre-cabinet` (bios + photos)
- **14** pages expertises branchées (3 pôles)
- Affaires / Médias / Ressources / Mentions légales
- Menu + footer mis à jour — site local : http://127.0.0.1:3000

---

## 2026-07-17 — Import blog + équipe Wix

- **422** articles (`Posts.csv` → `contenu/articles/*.json`)
- **17** catégories (`Categories.csv` → `categories.json`)
- **6** membres (`Équipe.csv` → `equipe.json` bios complètes)
- Script : `scripts/import-wix-blog.py`
- Accueil / admin / sitemap branchés sur l’index

---

## 2026-07-17 — Workflow pixel-perfect (accueil)

Méthode validée sur l’accueil :

1. Capture + mesures live  
2. Textes **complets** → `contenu/pages/accueil.json`  
3. Reconstruction (hero split, nav, ticker « Lire »)  
4. Comparaison screenshot

Doc : `docs/13-workflow-pixel-perfect.md`  
À peaufiner encore : espacements fins, import blog ticker, photos équipe.

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

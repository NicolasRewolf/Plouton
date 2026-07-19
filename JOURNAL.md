# Journal des livraisons

Chaque entrée = ce qui a changé, en français, pour Nicolas.  
Pas de jargon. 5 lignes max par livraison.

---

## 2026-07-19 — Expertises : Accidents et erreurs médicales (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 5 sections H2, 14 blocs H3, 0 H4 ; 29 puces
- H3 vides « faute médicale » / « infection nosocomiale » conservés (contenu sous le H3 suivant, comme MD) ; listes et liens cabinet
- FAQ / formulaire / carrousel hors sections
- Tests : `/indemnisation-des-victimes/accidents-et-erreurs-medicales` — build OK

---

## 2026-07-19 — Expertises : Accidents de la vie courante (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 4 sections H2, 16 blocs H3, 0 H4 ; 26 puces
- Listes imbriquées « Que faire » + Cadre légal / Conséquence conservées ; liens Legifrance, GAV, route/travail, cabinet
- FAQ / formulaire / carrousel hors sections
- Tests : `/indemnisation-des-victimes/accidents-de-la-vie-courante` — build OK

---

## 2026-07-19 — Expertises : Accidents de la route (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 7 sections H2, 16 blocs H3, 2 sous-blocs H4 ; 48 puces
- H4 Dintilhac (extra-patrimoniaux / patrimoniaux) sous le H3 nomenclature ; H2 Piétons vide (comme MD)
- Listes et liens conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/indemnisation-des-victimes/accidents-de-la-route` — build OK

---

## 2026-07-19 — Expertises : Divorce (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 7 sections H2, 23 blocs H3, 5 sous-blocs H4 ; 12 puces
- Simulateurs prestation compensatoire + pension alimentaire conservés (branchés sur leurs H2)
- H3 « garde » rattachés au H2 Garde (dans le MD scrape : sous Partage, colonnes Wix) ; lead Garde = doublon patrimoine (comme MD)
- Listes et liens conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux` — build OK

---

## 2026-07-19 — Expertises : Défense des élus (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD scrapé (pas d’export frais) : 6 sections H2, 13 blocs H3, 0 H4 ; 7 puces
- Listes « Réagir à l’urgence » + « prise illégale d’intérêts » conservées ; FAQ / formulaire hors sections
- Note : corps « E-réputation » = doublon de « Diffamation… » (comme sur le MD / Wix) ; source MD bruitée (`/$`, XML)
- Tests : `/defense-penale/defense-des-elus` — build OK

---

## 2026-07-19 — Expertises : Droit pénal des affaires (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 4 sections H2, 7 blocs H3, 0 H4 ; 37 puces (dont 3 dossiers exemples imbriqués)
- Listes et liens /post conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/defense-penale/droit-penal-des-affaires` — build OK

---

## 2026-07-19 — Expertises : Violences conjugales (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 7 sections H2, 16 blocs H3, 0 H4 ; 22 puces
- Listes, liens tel:/post et externes conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/defense-penale/violences-conjugales-et-feminicides` — build OK

---

## 2026-07-19 — Expertises : Trafic de stupéfiants (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 5 sections H2, 12 blocs H3, 2 sous-blocs H4 ; 41 puces
- Listes et lien Air Cocaïne conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/defense-penale/trafic-de-stupefiants` — build OK

---

## 2026-07-19 — Expertises : Procès criminel (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 5 sections H2, 4 blocs H3, 0 H4 ; 13 puces
- Listes et lien indemnisation conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/defense-penale/proces-criminel` — build OK

---

## 2026-07-19 — Expertises : Droit pénal (texte MD fidèle H2/H3/H4)

- JSON réécrit depuis le MD Wix : 5 sections H2, 15 blocs H3, 13 sous-blocs H4 (plus d’aplatissement)
- Listes en puces ; liens conservés ; FAQ / formulaire / carrousel hors sections
- Tests : `/defense-penale/droit-penal` — build OK

---

## 2026-07-19 — Sources MD expertises : exports Wix frais

- 14 MD rafraîchis depuis Downloads (8 vraiment différents ; 6 déjà à jour)
- Doublon ignoré : `page-…-14.md` = Accident du travail
- Manque encore : **défense des élus** (pas d’export frais)

---

## 2026-07-19 — Expertises : règle H2/H3 + sources MD Wix

- 15 MD Wix synchronisés dans `contenu/sources/live-md/expertises/` (dont `defense-des-elus` ajouté)
- Règle non négociable hardcodée : H2→section, H3→bloc, H4→sous-bloc, listes conservées
- Renderer `ExpertiseBody` capable de H3 vs H4 + listes à puces
- **Pas** encore les 15 réécritures JSON complètes — fondation seulement

## 2026-07-19 — Expertises : accidents et erreurs médicales (fidélité Wix)

- Intro 3 paragraphes déjà OK (rien à recréer)
- Liens « Notre cabinet » / « Notre cabinet d’avocats » rétablis
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Tests : `/indemnisation-des-victimes/accidents-et-erreurs-medicales`

## 2026-07-19 — Expertises : droit et accidents du travail (fidélité Wix)

- Bug « civi le » déjà corrigé (lien CIVI borné au mot)
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Corps + FAQ déjà fidèles ; 2 affaires 2012 déjà en catégorie (carrousel OK côté données)
- Tests : `/indemnisation-des-victimes/droit-et-accidents-du-travail`

## 2026-07-19 — Expertises : accidents de la vie courante (fidélité Wix)

- Méthodologie 7 étapes déjà complète (rien à recréer)
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Tests : `/indemnisation-des-victimes/accidents-de-la-vie-courante`

## 2026-07-19 — Expertises : droit de la famille (fidélité Wix)

- Sous-titres protection rétablis : ordonnance de protection + accompagnement pénal
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Lien « représentation en cas de féminicide » lisible (plus de « r » orphelin)
- Tests : `/droit-des-contrats-et-des-personnes/droit-de-la-famille`

## 2026-07-19 — Expertises : droit des assurances (fidélité Wix)

- Sous-titres sinistres rétablis : Incendies / Inondations-Sécheresse-Tempêtes / Vols
- Texte RDV Wix rétabli
- Droit de la famille : déjà OK sur le fond (intro complète) — trous restants mineurs (2 H4 protection + RDV), reportés
- Tests : `/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels`

## 2026-07-19 — Expertises : accidents de la route (fidélité Wix)

- Nomenclature Dintilhac : 3 puces d’intro visibles + sous-titres extra/patrimoniaux structurés
- Déjà OK : 3ᵉ paragraphe d’intro, texte RDV, titres #### (lot 1), section Piétons vide (= Wix)
- Skip : SEO/réseaux ; doublons FAQ proches (2 formulations, réponses différentes — non fusionnés)
- Tests : `/indemnisation-des-victimes/accidents-de-la-route`

## 2026-07-19 — Expertises : trafic de stupéfiants (fidélité Wix)

- Sous-titres « Faire annuler… » / « Mettre en doute… » rétablis ; section défense dédoublonnée
- Puce « Plaider la peine et le contexte » de nouveau visible ; texte RDV Wix
- Skip : SEO/réseaux ; carrousel = 20 plus récentes (4 dossiers 2022 hors fenêtre, normal)
- Tests : `/defense-penale/trafic-de-stupefiants`

## 2026-07-19 — Expertises : violences conjugales et féminicides (fidélité Wix)

- Liens intro/corps : « Notre cabinet » + article Billon (imprescriptibilité)
- Texte RDV Wix rétabli ; typo « r etrouver » + espaces avant ponctuation corrigés
- Blocs orphelins de scrape retirés
- Skip : SEO/réseaux (lots 1–2) ; tél. urgences déjà lot 1
- Tests : `/defense-penale/violences-conjugales-et-feminicides`

## 2026-07-19 — Expertises : droit pénal des affaires (fidélité Wix)

- Lien intro « mise en cause pénale » → page Droit pénal
- Texte RDV Wix rétabli ; exemples d’affaires mieux structurés
- Déjà OK : corps des 4 sections, FAQ, carrousel, SEO/réseaux
- Tests : `/defense-penale/droit-penal-des-affaires`

## 2026-07-19 — Expertises : défense des consommateurs (fidélité Wix)

- Doublons de scrape retirés ; typo « rapports technique s » corrigée
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Déjà OK : corps éditorial, FAQ enrichie (17 Q), carrousel (limite 20), SEO/réseaux
- Tests : `/droit-des-contrats-et-des-personnes/defense-des-consommateurs`

## 2026-07-19 — Expertises : victimes de délits ou crimes (fidélité Wix)

- Doublons de scrape retirés ; typo « : : » corrigée
- Puces « Actions civiles » : titres visibles (comme sur Wix)
- Texte RDV Wix rétabli (« hors des horaires habituels »)
- Déjà OK : corps éditorial, FAQ 4 questions, carrousel (étiquette + limite 20), SEO/réseaux
- Tests : `/indemnisation-des-victimes/victimes-de-delits-ou-crimes`

## 2026-07-19 — Expertises : Divorce Bordeaux (fidélité Wix)

- Procédure contentieuse : titres d’étapes rétablis (assignation, mesures provisoires, jugement, finalisation, mise en état) + puces
- FAQ Wix (7 questions) restaurée en tête ; les 14 questions déjà présentes sont gardées
- CTA « Obtenir un premier avis » dans le hero ; texte RDV Wix ; section Garde de nouveau remplie
- Doublons de scrape nettoyés ; simulateurs / SEO / réseaux déjà OK (lots précédents)
- Tests : `/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux`

## 2026-07-19 — Expertises : droit pénal (fidélité Wix)

- Titres complets rétablis (Atteintes personnes / biens, Délinquance organisée, Cybercriminalité, JIRS, Préparation intensive, Travail de personnalisation, Outils concrets)
- Meta description remise comme sur Wix (garde à vue / 20 ans / 24h/24)
- Déjà OK post-lots : FAQ 8 questions, SEO canonical/OG, liste d’affaires (20)
- Tests : `/defense-penale/droit-penal` → sections Complexes / Équipe / Méthodes → titres longs visibles

## 2026-07-19 — Expertises : défense des élus (fidélité Wix)

- Titre « E-réputation et cyberharcèlement » de nouveau visible (le gabarit le faisait disparaître car le texte était un doublon)
- Doublons inutiles nettoyés dans le JSON (paragraphes répétés sans titre)
- Note : sur le site Wix live, le texte sous ce titre est **aussi** une copie de « Diffamation… » — on n’a rien inventé ; à réécrire plus tard côté contenu si voulu
- Déjà OK : 4 blocs « Réagir à l’urgence », FAQ
- Tests : `/defense-penale/defense-des-elus` → section Presse → voir le titre E-réputation

## 2026-07-19 — Expertises : procès criminel (fidélité Wix)

- Phrase cassée « Et donc également devant : » : liste Charente (Angoulême) + Dordogne (Périgueux) rétablie depuis la source live
- Audit expertises archivé dans `docs/scratch/audit-expertises.html` (référence pour la suite)
- Déjà OK post-lots : puces procédure, FAQ, lien indemnisation, SEO canonical/OG
- Tests : page `/defense-penale/proces-criminel` → section Compétences → liste des deux cours d’assises

## 2026-07-19 — Lot 6 audit : demandes + nav RDV

- **Demandes admin** : recherche (nom, e-mail, objet…) + pages Suivant/Précédent (plus de plafond 200 sans suite)
- **Même client** : sur une demande, liste des autres soumissions du même e-mail
- **Menu** : entrée « RDV & accès » (prise de RDV / horaires / honoraires) → page `/honoraires-rendez-vous`
- **Accès admin** : option `ADMIN_EMAILS` (liste d’e-mails autorisés) — à remplir sur Vercel si besoin ; sinon inchangé
- Images cartes / hero : texte alternatif = titre (plus de `alt` vide)
- Skip (volontaire) : kanban 6 étapes, inbox réponse, commentaires blog, rôles fins (éditeur vs admin)

## 2026-07-19 — Lot 5 audit : admin blog + anti-spam formulaires

- Formulaire contact : honeypot + limite anti-spam + **e-mail de confirmation** au client
- Admin blog : recherche / filtre statut / pagination (plus de liste à 422 d’un coup)
- Édition : couverture (URL ou upload), SEO, date, catégorie, archiver, programmer
- TipTap : boutons image + YouTube
- Tests : envoyer une demande (mail reçu) ; Admin → filtrer → éditer cover/SEO → publier

## 2026-07-19 — Lot 4 audit : contenu pages expertise / hubs

- FAQ droit pénal restaurée (8 questions + filtres) ; 3ᵉ paragraphe d’intro expertise de nouveau visible
- Défense des élus : 4 blocs « Réagir à l’urgence » ; procès criminel : puces procédure remises
- Comprendre le droit : sections thématiques élargies (56 ressources) ; Nos affaires sans les guides
- Reste : section « Piétons… » accidents de la route vide aussi côté Wix (rien à recopier)

## 2026-07-19 — Simulateurs divorce (lot audit 3)

- Deux calculateurs de retour sur la page Divorce : **pension alimentaire** + **prestation compensatoire**
- Pension = barème officiel Ministère de la Justice (pas de formule Wix trouvée dans les exports)
- Prestation = estimation indicative (méthodes courantes des avocats) — pas de barème légal
- Chaque outil rappelle : estimation indicative, sans valeur juridique + bouton pour contacter
- Tests : page Divorce → ancres « Je simule… » / « Je calcule… » → remplir → voir le montant

## 2026-07-19 — Audit Wix→Next lot 2 (contenu / SEO / front)

- Réseaux FB / IG / LinkedIn dans le footer (URLs du site live)
- Loupe → page Recherche (titres / extraits) ; flux RSS `/rss.xml`
- Fix « civile » cassé par le lien CIVI ; carrousel expertises 20 affaires
- Articles : date avec année, 3 similaires, contact honnête (plus de faux commentaires)
- Nos affaires : tri + récentes / + consultées ; canonical / partage social pages clés
- Tests : loupe Header ; `/recherche?q=civi` ; `/rss.xml` ; page violences conjugales ; `/nos-affaires`

## 2026-07-19 — Audit Wix→Next lot 1 (urgents)

- Mentions légales : note interne « À confirmer / Kbis » retirée du site public
- Violences conjugales : 17, 3919, 119 cliquables (appel téléphone)
- Accueil : photos équipe + cartes affaires avec images ; Nos affaires : vues réelles
- Titres `####` propres ; page 404 Plouton ; SEO canonical / partage social
- Tests : Mentions légales ; `/defense-penale/violences-conjugales-et-feminicides` ; Accueil ; `/nos-affaires` ; page inventée → 404


## 2026-07-19 — Médias & Ressources filtrables (plus de blog fourre-tout)

- **Médias** = vraie page `/medias` avec filtres (comme Nos affaires)
- **Ressources** = grille filtrable en bas de « Comprendre le droit »
- Plus de page Blog publique : l’ancien `/blog` renvoie vers Affaires
- Sitemap nettoyé : Affaires / Médias / Ressources (+ articles individuels)
- Tests : menu → Médias ; Ressources → descendre à « Toutes les ressources » ; chips

## 2026-07-19 — Page équipe : mur blanc (grille ciné)

- Hero conservé (note Google, texte intro, **photo de groupe**)
- Grille portraits « mur blanc » : hover « Lire le parcours » → bio complète
- Preview d’arbitrage : `/notre-cabinet/preview` (non indexé)

## 2026-07-18 — TipTap (barre fixe façon Wix)

- Editor.js retiré — remplacé par **TipTap**
- Barre de formatage **fixe en haut** : paragraphe, gras, italique, listes, lien… (comme Wix)
- Tests : Admin → Nouvel article → utiliser la barre → Publier

## 2026-07-18 — Fix Editor.js (toolbar visible)

- L’éditeur coupait le bouton **+** et les menus (overflow) — corrigé
- Init alignée sur le guide Editor.js ; titres / listes / citations en français
- Tests : Admin → Nouvel article → survoler un bloc → **+** doit ouvrir le menu

## 2026-07-18 — Admin : vrai éditeur + dashboard

- Les avocats rédigent le blog avec un **vrai éditeur** (titres, listes, citations) — fini les grandes zones de texte
- Dashboard admin refait : menu latéral, compteurs publiés/brouillons, liste soignée
- Un article publié depuis l’admin s’affiche correctement sur le site (`/post/…`)
- Les 422 articles d’origine gardent leur mise en page tant qu’on ne les réécrit pas
- Tests : Admin → Nouvel article → blocs → Publier → ouvrir `/post/…`

## 2026-07-18 — C5 : publish live (DB → site)

- Le site public lit les articles **dans la base** (plus seulement les fichiers)
- Tu publies dans l’admin → la page se met à jour **sans redéployer**
- Les 422 articles d’origine gardent leur belle mise en page (Ricos) tant qu’on ne les réécrit pas
- Images de couverture (covers) → reporté en **C5.1**
- Tests : ouvrir un `/post/...` seedé ; admin → modifier titre/corps → publier → recharger la page

## 2026-07-18 — C5 démarré (plan)

- Objectif : **je publie dans l’admin → visible sur le site sans redéployer**
- Lecture publique via clé secrète serveur (pas d’ouverture anonyme) + filet de sécurité JSON
- Les 422 articles seed gardent leur mise en page Ricos tant qu’on ne les réécrit pas
- Covers (images) → suite **C5.1** si pas livré ici · branche `feat/canalisations-c5`

## 2026-07-18 — Clean repo pré-C5

- Worktrees Claude + branches mortes (déjà mergées) retirés — repo allégé
- **Tous les docs** alignés : C0–C4 faits, next **C5**, pixel en pause, UI = AffaireCard + SiteCta
- Passation soir à jour ; photo matin « 0 row » archivée
- Prêt pour le plan **C5** (pas démarré ici)

## 2026-07-18 — Uniformité UI (cartes + boutons)

- **Même carte** partout pour les articles (blog, ressources, posts similaires…)
- **Même style de bouton** (CTA) : accueil, sticky, footer, équipe
- Règles écrites pour les agents — plus de boutons inventés page par page
- Exceptions : menu Contact (Header figé), formulaires, admin

## 2026-07-18 — Hubs pôles + Défense des élus + redirects

- Les **3 portes d’entrée** des pôles marchent (plus de page blanche)
- **Défense des élus** : vraie page expertise (contenu live) + FAQ + menu
- Anciennes URLs « actualités » pointent vers le **bon blog** (plus de cul-de-sac)
- Suite : **C5** (site qui lit la base) — gros chantier, pas encore démarré

## 2026-07-18 — Médias + hub Ressources

- **Médias** dans le menu → vraie grille blog ; `/medias` redirige dessus (plus de liste pauvre)
- **Ressources** (`/comprendre-le-droit`) : hub par thèmes + articles les plus lus
- Contenu éditable dans un JSON (pas une nouvelle usine à pages)
- Suite backlog : hubs pôles, Défense des élus, redirects cassés

## 2026-07-18 — C4 MVP : canal blog (écriture CMS)

- Table **`posts`** en base + **422** articles seedés (slugs inchangés)
- L’admin peut **enregistrer** un article en DB (plus d’erreur « à venir »)
- Le **site public** lit encore les fichiers JSON — bascule lecture = **C5**
- Script : `python3 scripts/seed-posts.py` · branche `feat/canalisations-c4`

## 2026-07-18 — Canalisations C0–C3 (PR #7)

- **C0–C2** : demandes en base, pièces jointes, login magic link, boîte `/admin/demandes`
- **C3** : alerte mail Resend → `accueil@…` (clé à ajouter) + **752** contacts Wix importés (Archivé)
- Script : `python3 scripts/import-demandes-csv.py "/chemin/vers/export.csv"` (CSV hors git)
- À faire : URL Auth Supabase + `NEXT_PUBLIC_SITE_ORIGIN` + clé Resend + merge PR

## 2026-07-18 — CTA accueil : mix X

- Fini les pilules + pastille flèche
- Radius 6, fond soft, texte regular, flèche légère, hover lift
- Aussi sur « Notre cabinet »

## 2026-07-18 — Liens internes : corail + pointillés

- Style unique articles / prose / expertises (plus de double soulignement Wix)
- Corail cabinet + trait en pointillés ; hover un peu plus marqué
- Déviation notée dans `deviations.json`

## 2026-07-18 — Pivot : Supabase d’abord, pixel en pause

- Stop Phases 4–6 pixel ; **garde** socle 0–3 (Ricos, fonts, harnais)
- Priorité **C0–C5** : Demandes E2E → PJ → auth → mail → posts DB → publish
- Contenu public = encore 100 % JSON git ; `demandes` = 0 row prouvée
- Message technique Fable dans `docs/PASSATION-2026-07-18.md`

## 2026-07-18 — Pages légales (mentions, confidentialité, cookies)

- Mentions légales refaites proprement + **politique de confidentialité** + page **Cookies**
- Mise en page moderne avec **sommaire collant** (facile à parcourir)
- Infos société croisées (site live + registre officiel) — capital social laissé en « à confirmer »
- Branche `feat/pages-legales` (ne touche pas au Footer / chantier Fable)

## 2026-07-18 — Header figé (décision)

- Le menu du haut (Header) sur `main` est **validé et gelé** — on ne le refait plus « comme Wix »
- Écarts volontaires notés dans `deviations.json` ; décision dans `docs/05-decisions.md`
- Passation / état : Fable reprend la fidélité **sans toucher au Header** (Footer, boutons, FAQ…)

## 2026-07-18 — Passation vers Fable

- Docs pilotes à jour (`14-etat`, `LIRE-MOI`, index, passation)
- Message de reprise dans `docs/PASSATION-2026-07-18.md` : **rail fidélité** (Phases 0–3 + WIP Header) **vs** session UX/archi sur `main`
- Point clé : ne pas écraser le Header de la nuit ; réconcilier avec `deviations.json`
- Supabase « gros bang contenu » **reporté** — focus Demandes + polish reste ouvert

## 2026-07-18 — Perf React (Vercel best practices)

- Cache lecture articles / site / FAQ (moins de relectures disque)
- Formulaire, FAQ, carrousel affaires : chargés après le hero (pages expertise)
- Grille « Nos affaires » en lazy + `content-visibility` sur les cards
- Sommaire expertise : scroll allégé (requestAnimationFrame)

## 2026-07-18 — Architecture : un seul cerveau contenu

- **Queries** : articles publiés, FAQ, related — une seule boîte (`queries.ts`)
- **Loader expertise** : page prête avant affichage (FAQ, hero, TOC, schema)
- **Registry** : menu + objets formulaire + photos dans `poles-registry.json`
- **Formulaire** : le serveur valide avant d’enregistrer
- Affaires / médias / related : mêmes règles de filtre
- Nettoyage scrape aussi au check `--fix` (plus seulement à l’affichage)

## 2026-07-18 — Fin de soirée (balai)

- Dossier doublon `illustrations pages expertise/` supprimé (déjà dans `brand/expertises/`)
- `.mcp.json` ignoré (config locale)
- Repo propre, `main` à jour
- À reprendre demain : illustration **divorce** manquante

## 2026-07-18 — Home intro : vraie photo découpée

- Bonne photo PNG (portrait) à la place du mauvais paysage
- Fond **blanc** = même couleur que le fond de la photo → plus de carré visible
- À voir : http://localhost:3000/ (sous le hero)

## 2026-07-18 — Hero expertise : logos en trop retirés

- Plus de grand logo rouge en filigrane
- Plus de logo dans un cercle sur la photo
- Reste juste le petit picto à côté de « Cabinet Plouton »

## 2026-07-18 — Home expertises : flèches rondes

- Même section 3 pôles (titre coloré, listes à traits)
- Flèches fines remplacées par les **cercles →** déjà utilisés sur le site (boutons hero, etc.)
- À voir : http://localhost:3000/#expertises

## 2026-07-18 — Home : section « À vos côtés » avec photo équipe

- Sous le hero : photo de groupe à gauche, texte à droite (comme le site actuel)
- Titre en deux couleurs (rouge + bleu) + citation en petit
- Photo : `site/public/brand/equipe-home.png`
- À voir : http://localhost:3000/

## 2026-07-18 — Illustrations hero pages expertise

- 13 visuels fournis branchés dans `site/public/brand/expertises/` (noms = slugs)
- Manque encore : **divorce** (ancienne image conservée)
- À voir sur n’importe quelle page expertise (photo en haut à droite)

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

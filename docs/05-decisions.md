# Décisions

On note ici les choix importants, pour ne pas les rejouer à chaque fois.

---

## 2026-07-18 — Uniformité UI (cartes + CTA)

**Décision :** une seule carte article (`AffaireCard`) et un seul style de CTA public (`SiteCta` / `.btn-pill`).  
**Pourquoi :** éviter les boutons et cartes « au feeling » selon les pages. L’agent propage tout changement de composant canonique dans la même PR.  
**Exceptions :** Header figé, admin, submit `ContactForm`, pastilles TOC.  
**Doc :** `docs/16-composants-ui.md`.

---

## 2026-07-16 — Un repo, deux apps (site + admin)

**Décision :** `site/` pour les visiteurs, `admin/` pour le backoffice, dans le même repo.  
**Pourquoi :** une seule maison à comprendre ; le contenu et les règles restent alignés.  
**Alternative écartée :** deux repos séparés (plus de confusion pour suivre les livraisons).

---

## 2026-07-16 — Cooked reste dehors

**Décision :** Cooked ne devient pas le backoffice blog/demandes.  
**Pourquoi :** Cooked = mesure. Ici = production. Mélanger les deux rendrait le tout illisible.  
**Lien :** le tracker Cooked pourra être branché sur le nouveau site, comme sur Outremer.

---

## 2026-07-16 — Docs en français pour Nicolas

**Décision :** `LIRE-MOI.md`, `JOURNAL.md`, `docs/` en français, orientés métier.  
**Pourquoi :** éviter la boîte noire Next.js. Le code est pour l’agent ; le plan est pour le chef d’orchestre.

---

## 2026-07-16 — Référence UI pour la duplication du site

**Décision :** quand on dupliquera / reconstruira le site public, s’appuyer sur  
https://www.ui-skills.com/skills/jakubkrehel  
**Pourquoi :** garde-fou qualité UI (pas de redesign au feeling).  
**Quand :** phase site public — **pas** prioritaire pour le squelette backoffice.

### Qui utilise le backoffice
**Décision :** tous les avocats du cabinet **ou** Nicolas.  
**Conséquence :** comptes multi-utilisateurs, simple, pas d’outil “réservé tech”.

### Alertes nouvelles demandes
**Décision :**
- E-mail immédiat → **`accueil@jplouton-avocat.fr`** (Alexia Simonini, assistante de direction)
- **+ notification dans le backoffice** (badge / liste “non lues”)
**Conséquence :** pas d’alerte e-mail à tous les avocats ; Alexia filtre ; les avocats voient aussi l’état dans Demandes.

### Candidatures vs prospects
**Décision :** même module Demandes, mais **onglet / filtre séparé « Candidatures »** (objet « Nous rejoindre »).  
**E-mail :** **tout** (prospects + candidatures) → **`accueil@jplouton-avocat.fr`** — le cabinet n’a pas d’autres boîtes.  
**Conséquence :** Alexia reçoit tout ; le tri se fait dans le backoffice (onglets), pas par boîte mail.

### Google Ads / Nomad Marketing
**Décision de principe :**
- **Cooked** = la vérité pour toi (d’où viennent les contacts, UTM, parcours) — **déjà** le job de l’UTM Catcher Wix
- **Tag Google Ads** = ce dont **Nomad** a besoin pour que Google optimise les campagnes (autre job)
**V1 :** brancher Cooked sur le nouveau site **+** un événement de conversion Ads sur envoi de formulaire (et appel si besoin), avec Nomad.  
**Pas besoin** de remonter l’app Wix « UTM Catcher » si Cooked + champs UTM du formulaire sont en place.

### URL backoffice
**Décision :** **`admin.jplouton-avocat.fr`**  
**Conséquence :** app admin séparée du site public ; DNS + auth à prévoir au déploiement.
**Décision V1 :** **pas d’intégration auto**. L’équipe continue de ranger dans Secib **à la main** (comme avec Outlook).  
**Contexte :** Secib propose « Secib Connect / API » **sur devis**, pas de catalogue public — possible plus tard, pas bloquant pour migrer.  
**Conséquence :** Demandes = boîte claire + statuts ; Secib reste le dossier officiel.

### Statuts Demandes (= catégories Outlook actuelles)
**Décision :** reprendre **les mêmes libellés** que dans Outlook (pas inventer un autre vocabulaire).  
**Liste provisoire** (lue sur la boîte Julien — à faire valider par Alexia) :

| Statut (provisoire) | Note |
|---------------------|------|
| Nouveau | à l’arrivée (remplace le mail Wix “non catégorisé”) |
| Message laissé | vu Outlook |
| E-mail rattaché | vu Outlook |
| E-mail rattaché dans Sec… | libellé tronqué — à compléter |
| Mail envoyé… | libellé tronqué — à compléter |
| Client renseigné | vu Outlook |
| Client pas intéressé | vu Outlook (“Client pas intér…”) |
| Géré | vu Outlook |
| RDV pris… | libellé tronqué (“RDV pris agenc…”) — à compléter |

**À faire :** demander à Alexia l’export / la liste exacte des catégories Outlook.  
**Conséquence :** le backoffice = le même “CRM mail”, en mieux (pièces jointes + historique + multi-users).

### Pièces jointes des formulaires
**Décision :** **on conserve** — l’équipe s’en sert tout le temps.  
**Conséquence :** upload fiable, stockage accessible depuis Demandes, pas de perte au transfert.

### Blog — brouillon puis publier
**Décision :** comme Wix — **brouillon → publier**.  
**Droits :** **tous les avocats + Nicolas** au même niveau — chacun peut créer un brouillon **et publier librement** (pas de validateur unique).  
**Taxonomie :** 17 catégories + ~377 tags (détail `docs/07-taxonomie-blog.md`).  
**Conséquence :** multi-catégories possible ; slugs catégories **intouchables** à la migration ; pas de rôle “éditeur / auteur” séparé.

### FAQ — une seule collection
**Décision :** **un seul FAQ** dans le nouveau système.  
À l’import : fusionner Wix `FAQ` + `Import1` (FAQ V2) + `FAQDivorce` → table unique avec étiquettes expertise / sous-sujet.  
**Conséquence :** un composant `FaqAccordion`, un écran admin FAQ plus tard, plus de triple maintenance.

### Wix Sandbox
**Décision :** **ne pas activer**. Inutile pour migrer vers Next/Supabase (on lit le Live via API).  
Sandbox = outil de test **interne Wix**, pas un accélérateur d’export.

### Stack déploiement
**Décision :** **Supabase** (données + fichiers) + **Vercel** (site + admin) + **Cooked** à part (mesure).  
**Forfaits prod :** Vercel **Pro** + Supabase **Pro** — pas Enterprise / Team.  
Détail balisé → `docs/11-stack-technique.md`.

### Phase preuve (avant de payer)
**Décision :** d’abord un **POC local gratuit** — homepage + 1 page article + contact + backoffice blog — **sans** nouveaux forfaits cloud.  
Données en fichiers (`contenu/`). Supabase/Vercel Pro seulement quand Nicolas valide la qualité.

### SEO / GEO
**Décision :** exigence **maximale** dès le POC — balises, JSON-LD aux bons endroits (Organization, LegalService, BlogPosting, FAQPage, BreadcrumbList, etc.), titles/meta, maillage, pas de “SEO après”.  
GEO = lisibilité pour les IA / citations (structure claire, entitité cabinet, faits datés).  
Détail → `docs/12-seo-geo.md`.

### Sources déjà sous la main
- Export 301 Wix : `contenu/imports/Export_URL_Redirigees.csv` (**161** règles)
- Export formulaires : `contenu/imports/Prise_de_contact_site-web.csv` (**752** — hors git, données perso)
- Identité : lien Drive `contenu/identite/Drive-LIVRABLES-Identite`  
  (Source Sans 3, Instrument Sans, logos, guide)

### Simulateurs divorce
**Décision :** **on garde** (prestation compensatoire, pension alimentaire).  
**Conséquence :** à prévoir dès le périmètre site (pas un “plus tard” abandonné).

### Google Ads
**Décision :** géré par l’agence tierce **Nomad Marketing**.  
**Conséquence :** coordination cutover avec eux (pixels / conversions) avant bascule ; on ne coupe pas Wix sans leur feu vert tracking.

### Historique des demandes
**Décision :** **on transfère** le stock (export CSV possible côté Nicolas).  
**Conséquence :** import dans Demandes + archivage propre ; pas de repartir à zéro.

### Recherche sur le site
**Décision :** **on garde**.  
**Conséquence :** recherche pages + blog dans le site public.

### Registry pôles / expertises (2026-07-18)
**Décision :** une seule liste officielle `contenu/reference/poles-registry.json` (menu, objets formulaire, heroes).  
**Miroir client :** `site/src/data/poles-registry.json` (à resync si on édite).  
**Conséquence :** ajouter / renommer une expertise = d’abord le registry, puis le JSON page.

### Header figé (2026-07-18)
**Décision :** le Header actuel sur `main` est **parfait et figé** — plus de reconvergence pixel vers Wix, pas d’écrasement par le chantier Fable.  
**Pourquoi :** UX validée par Nicolas ; les écarts vs live sont des déviations assumées (`contenu/reference/deviations.json` → `header-frozen-main`).  
**Conséquence :** plus de retouche Header côté Fable (voir aussi pivot matin ci-dessous).

### Pivot stratégie — Supabase d’abord (2026-07-18 matin)

**Décision :** arrêt de la priorité « copie fidèle / pixel-perfect » (Phases 4–6). On **garde** le socle 0–3 dans `main`. Priorité = canalisations **C0–C5** (Demandes → PJ → auth/UI → mail/CSV → posts DB → publish live). UI au fil de l’eau (Nicolas + Cursor).  
**Pourquoi (photo matin, obsolète) :** le contenu public était encore **100 % JSON git** ; Supabase n’avait qu’une table `demandes` à **0 row**. *(Soir 18/07 : C0–C4 livrés — demandes + posts seedés ; public encore dual-run JSON → C5.)* Le plan pixel listait déjà « persistance admin / écritures Supabase » en *hors périmètre* — ce trou est devenu le périmètre.  
**Conséquence :** stop `diff.mjs` / templates Wix prioritaires ; Footer **mergé** PR #6 (plus « en attente ») ; ne pas migrer les 422 posts avant C0–C3 *(fait)*. Détail : `docs/PASSATION-2026-07-18.md`.

### Pages légales (2026-07-18)
**Décision :** un gabarit `LegalPageView` + TOC sticky ; contenu en JSON (`mentions-legales`, `politique-de-confidentialite`, `cookies`).  
**Pourquoi :** obligation légale (formulaires + RGPD) ; le live Wix n’avait qu’un bloc mentions peu structuré.  
**Sources :** live Wix (textes IP / responsabilité) + API entreprises / Pappers (SIREN, SIRET, siège) + inspiration UI Outremer (structure claire, pas de copie de thème).  
**Note Footer :** Footer convergé **mergé** PR #6 — les pages légales se croisent entre elles + lien formulaire → confidentialité.

### C5 — lecture publique posts + publish live (2026-07-18)

**Décision :**
1. Lecture publique **serveur uniquement** via `SUPABASE_SECRET_KEY` (filtre `status = published`). **Pas** de policy RLS `anon` en V1 (surface minimale).
2. Dual-run : si la ligne DB manque → **fallback JSON** git.
3. Corps rendu : si le corps DB **diffère** du JSON seed (édition admin) → `bodyHtml` puis `body` ; sinon **Ricos** `contenu/ricos/` (les 422 seed restent fidèles).
4. Publish → `revalidateTag('posts')` + `revalidatePath` (article, blog, listes, accueil, sitemap).
5. Liste admin = DB (publiés + brouillons).
6. Covers Storage bucket `medias` = **C5.1** (hors MVP si non branché ici).

**Pourquoi :** « je publie → visible sans redeploy », sans ouvrir la table au monde via anon.  
**Conséquence :** clé secrète obligatoire sur Vercel pour le live public ; build sans clé = JSON only.

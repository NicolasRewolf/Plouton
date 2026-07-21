# Changelog

Une entrée par PR fusionnée dans `main`, la plus récente en haut.
Antérieur au 2026-07-19 : [`docs/archive/JOURNAL-2026-07.md`](docs/archive/JOURNAL-2026-07.md)
(historique narratif, plus maintenu).

**La rubrique « Docs périmés » n'est pas optionnelle.** C'est elle qui empêche la
documentation de pourrir : on note ce qu'un changement rend faux au moment où on
le fait, pas six mois plus tard en audit.

---

## 2026-07-20

### [#70] C5 — l'interprétation des expertises, séparée de l'affichage · `405a0b0`

**Ajouté** — `site/src/lib/expertise-content.ts` : lecture du contenu d'expertise
en fonctions pures (nettoyage, découpe, `chooseSectionLayout`). Les liens internes
deviennent des **données** résolues une fois par page, au lieu d'une regex rejouée
à chaque rendu.
**Changé** — `ExpertiseBody.tsx` : 730 → 469 lignes, présentation seulement.
**Garde** — `npm run check:expertise`.
**Preuve** — 15 pages : texte, titres, méta et JSON-LD identiques ; 1494 liens,
aucun perdu. Les 73 pages hors expertise sont identiques octet pour octet.

### [#69] C4 — un seul jeu de règles pour la soumission d'article · `e5214f5`

**Ajouté** — `site/src/lib/article-submission.ts` : slug, statut et validation,
partagés client et serveur.
**Corrigé** — deux slugifications incompatibles (le client retirait les accents,
le serveur les gardait ; les 422 URL indexées en portent). Le PUT construisait
l'article par `{ ...body }`, donc le client pouvait écrire n'importe quelle
colonne — compteur de vues, URL canonique, date de relecture.
**Garde** — `npm run check:submission`.

### [#68] C2 — la collection CMS, écrite une fois au lieu de cinq · `3d4106f`

**Ajouté** — `site/src/lib/supabase/admin.ts` (LE client serveur, ex-6 copies),
`site/src/lib/cms-collection.ts` (`defineCollection` / `defineKeyedCollection`).
**Changé** — `authors-db`, `categories-db`, `contact-db`, `faq-db` réécrits dessus.
**Corrigé** — trois tags de cache n'étaient jamais invalidés, un quatrième
n'était attaché à aucun cache.

### [#67] C1 — une seule interface pour « d'où vient le contenu » · `f2457c9`

**Ajouté** — `site/src/lib/content-source.ts` : le seam, adapters `SUPABASE` et
`SNAPSHOT`.
**Changé** — `posts-public.ts` réécrit : la précédence vit à **un seul endroit**.
Les 5 copies de la danse DB→JSON disparaissent des routes API.
**Corrigé** — `unstable_cache` sans `revalidate` figeait l'instantané JSON pour
toujours après un seul échec Supabase, redéploiements compris.
**Garde** — `npm run check:sources`.
**Docs périmés** — tous ceux qui disaient « dual-run, le public lit le JSON ».

### [#66] Assainissement blog + admin · `d1d1a13`

**Corrigé** — 13 défauts confirmés : l'autosave qui dépubliait un article en
ligne · la création qui écrasait un article au même slug · la restauration de
version annulée par la sauvegarde suivante · la page auteur qui perdait les
articles créés en admin · le cron ouvert sans `CRON_SECRET` · l'allowlist admin
absente de la surface API · le rendu des embeds.
**Supprimé** — `site/src/lib/post-edit-guard*.ts` (gel par nom de balise : il
figeait 53 articles sur 422 à tort), `site/src/lib/ricos/` (~500 lignes, zéro
appelant), `content.ts` `getRicos`/`getAuthor`/`getExpertiseCards`/
`authorNamesBySlug`, `posts-db.ts` `getPostStatus`.
**Ajouté** — `site/src/lib/post-edit-loss.ts` (mesure de perte réelle : une
confirmation, plus un refus), `site/src/lib/require-admin.ts` (ex-5 copies).
**Migrations** — `0012_post_versions_body_doc.sql`.
**Garde** — `npm run check:edit-loss`.

## 2026-07-19

### [#65] Blog — 3 pertes de la conversion Ricos + `wordCount` JSON-LD · `308c7ac`

### [#64] Briefs #17/#18 — `body_doc` en base, contact CMS, JSON-LD article · `cbee22b`
**Migrations** — `0011_content_singletons.sql`.

### [#63] Blog aligné sur le brief #18 — conversion fidèle, cache HTML public · `8768d48`
**Supprimé** — `site/src/components/PostCard.tsx` (wrapper déprécié → `AffaireCard`).

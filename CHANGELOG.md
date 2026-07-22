# Changelog

Une entrée par PR fusionnée dans `main`, la plus récente en haut.
Antérieur au 2026-07-19 : [`docs/archive/JOURNAL-2026-07.md`](docs/archive/JOURNAL-2026-07.md)
(historique narratif, plus maintenu).

**La rubrique « Docs périmés » n'est pas optionnelle.** C'est elle qui empêche la
documentation de pourrir : on note ce qu'un changement rend faux au moment où on
le fait, pas six mois plus tard en audit.

---

## 2026-07-21

### [à venir] Environnement Cursor Cloud — notes de démarrage

**Ajouté** — `AGENTS.md` : section « Cursor Cloud specific instructions »
(commandes dans `site/`, mode instantané sans secrets Supabase, où lancer
build/lint/dev). Script de mise à jour VM : `npm install --prefix site`.
**Docs périmés** — aucun (renvoie vers `docs/guides/demarrer.md` et
`docs/guides/gardes.md`, inchangés).

### [à venir] Layout bas de page honoraires & RDV

**Changé** — `/honoraires-rendez-vous` : le haut (titre + infos + formulaire)
reste tel quel. Sous le formulaire : **Accès** en grille (adresse / voiture /
tram) + photo d’équipe ; **Convention** et **Protection** côte à côte, médiateur
mis en avant.
**Docs périmés** — aucun (mêmes ancres `#acces` `#convention` `#protection`).

### Les routes d'écriture admin — un seul échafaudage, et une garde qui l'exige

**Ajouté** — `site/src/lib/admin-route.ts`. `require-admin.ts` avait supprimé les
cinq copies du contrôle d'identité, mais chaque route réassemblait encore à la
main les cinq étapes autour. Le seul préambule d'autorisation était recopié
**douze fois mot pour mot** dans cinq fichiers. `routeAdmin` acquiert l'identité
avant d'entrer dans le handler ; `refus(statut, message, code)` **lève** au lieu
de renvoyer, ce qui supprime le motif « rendre `Response | null` que l'appelant
doit penser à tester ».

**Corrigé — un corps JSON malformé ne peut plus devenir un 500 opaque.**
`readJsonBody` existait pour ça, mais seule `/api/posts` l'appelait : le même
corps donnait un 400 propre là et un 500 sans forme sur `/api/faq` et
`/api/posts/versions`. Toutes passent par `corps()`.

**Corrigé — une seule enveloppe d'erreur.** Trois coexistaient et l'admin devait
brancher selon la route appelée. Les routes admin rendent désormais
`{error, code}` — ajout strictement additif, aucun client ne casse.
`/api/contact` garde `{ok, error}` : c'est un contrat public de formulaire, pas
une route admin.

**Corrigé — les deux derniers `createClient` échappés.** `posts/media` et
`cron/publish-scheduled` reconstruisaient leur propre client avec la clé
secrète, alors que `lib/supabase/admin.ts` existe pour tenir cette copie unique.
Son en-tête affirmait avoir consolidé six copies ; deux lui avaient échappé.

**Corrigé — les trois écrans admin vérifiaient l'authentification, pas
l'autorisation.** `admin/faq`, `admin/demandes` et `admin/demandes/[id]`
recopiaient `supabaseServer() + auth.getUser()` sans jamais lire l'allowlist
`ADMIN_EMAILS`. Le proxy la fait respecter sur `/admin/:path*` — le risque était
donc faible — mais son commentaire promet que les pages revérifient, et une
défense en profondeur qui vérifie la moitié de la règle n'en est pas une.

**Corrigé — une écriture FAQ n'invalide plus le site entier.**
`revalidatePath("/", "layout")` périmait les 422 articles et les 87 pages à
chaque question modifiée, faute de savoir quelle page montre une FAQ. Le
registry sait répondre : `expertisePathFor` dérive le chemin, et
`revalidate-posts.ts` réutilise le même helper au lieu du sien. Vérifié : les 15
options FAQ résolvent toutes, et les 15 chemins correspondent à une vraie route.

**Garde** — `npm run check:admin-routes`, la propriété la plus sensible du dépôt
et que rien ne testait : **aucune route d'écriture ne répond à un appelant sans
session**, et toutes refusent de la même façon. Elle ÉNUMÈRE `src/app/api/**`
plutôt que de lister — une route ajoutée sans protection la fait rougir sans
qu'on ait eu à l'inscrire. Les trois routes légitimement publiques sont
déclarées une par une avec leur raison.

**Preuve** — 12/12 gardes conformes · `tsc`, `eslint`, `next build` verts ·
**−56 lignes nettes** dans `site/src` tout en ajoutant des codes d'erreur ·
plus aucun préambule d'authentification ni `createClient` hors
`lib/supabase/admin.ts` · test de mutation refait **en série** (les six
parallèles se marchaient dessus sur le même fichier) : casser `requireAdmin`
fait rougir la garde, la restaurer la fait reverdir.

**Non corrigé, signalé** — `PUT /api/posts` ne contrôle pas l'unicité du slug
comme le fait `POST` (`SLUG_TAKEN`) : c'est le même chemin de destruction
silencieuse, laissé ouvert d'un côté. Préexistant à ce changement.
`GET /api/authors` se replie en silence sur l'instantané JSON dès qu'une erreur
survient — une panne de base y devient invisible. Le cron appelle
`revalidatePostSurfaces` dans une boucle, soit N balayages de ~25 chemins.

**Docs périmés** — le décompte « onze gardes » (`AGENTS.md`, `README.md`,
`gardes.md`) ; toute mention laissant croire que `/api/*` est protégé par le
proxy — il ne l'a jamais été, son matcher est `/admin/:path*`.

---

### Le harnais des gardes — un instrument qui ne peut plus mentir

**Ajouté** — `scripts/lib/garde.mjs` : assertion, rapport, troncature et code de
sortie, écrits une fois au lieu de huit. Trois issues distinctes remplacent le
binaire vert/rouge — **0** conforme · **1** un défaut est prouvé · **2**
incomplet, rien n'a échoué mais tout n'a pas pu être vérifié.

**Corrigé — deux gardes qui disaient vert à tort.**
`check:sources` sautait tout son volet Supabase sans clé serveur, puis imprimait
`✅ conforme (3 contrats)` et sortait 0. Elle sort désormais en 2 et nomme les
quatre vérifications qu'elle n'a pas faites.
`check-meta-descriptions` épinglait sa **propre** expression d'élision, disjointe
de celle de `meta-description.ts` : elle testait une règle qui n'existait nulle
part. Elle importe maintenant `safeMetaDescription` et vérifie ce que le site
sert vraiment.

**Ajouté — trois gardes pour les trois modules les moins vérifiés.**
`check:precedence` (la règle « Supabase répond, sinon l'instantané » : base
muette, base joignable mais vide, article supprimé qui traîne dans l'instantané —
avec compteurs d'appels, donc « la bonne valeur pour la bonne raison ») ·
`check:baremes` (les deux simulateurs, dont rien n'épinglait une seule ligne
alors qu'ils affichent de l'argent à un justiciable) · `check:statuts` (le calcul
de date des statuts, y compris la fenêtre UTC/Paris, épinglée au lieu d'être
subie).

**Ajouté** — `site/src/lib/posts-precedence.ts` : la règle de précédence, sortie
de `posts-public.ts`. Elle n'y était pas dupliquée mais soudée à
`unstable_cache`, donc inexerçable hors d'une requête Next — c'est pour ça
qu'elle n'avait aucune garde. Elle prend ses sources en paramètre via
l'interface `ContentSource`, qui existait sans que rien ne s'en serve.
Extraction à comportement identique.

**Corrigé** — `meta-description.ts` : `\b` ne connaît que l'ASCII, donc
`\b(s)$` voyait une frontière de mot entre « é » et « s » et prenait
« salariés » ou « reprochés » pour une troncature. Mesuré sur les 422 articles :
**3 faux positifs, aucune vraie troncature** — la protection ne protégeait rien.
Corrigé sans qu'aucune des 422 descriptions servies ne change (vérifié octet
pour octet).

**Rangé** — `regen-body-html.mjs` écrivait 422 fichiers au milieu de gardes en
lecture seule → `site/scripts/regen/`. `check-expertises-live.py` portait le
préfixe `check-` en sortant **toujours 0**, et `--fix` réécrit le contenu →
`audit-expertises-live.py`. « Aucune garde n'écrit » est désormais vrai
structurellement, pas seulement écrit dans un document.

**Garde** — `cd site && npm run check` enchaîne les onze, à la place de la chaîne
`&&` qui était recopiée à la main dans trois documents. `check:body-docs` et
`check:meta` n'étaient câblées à aucun script npm.

**Preuve** — 11/11 conformes ; `tsc --noEmit`, `eslint`, `next build` verts.
Chaque garde a subi un test de mutation : casser la règle sous-jacente la fait
sortir en 1. `check:sources` en mode strict sort bien en 2.

**Trouvé, corrigé depuis** — les âges du simulateur de prestation n'étaient
pas assainis (NaN / −20 % silencieux). Corrigé plus haut : le modèle Wix
**refuse** un âge hors bornes ; voir l'entrée « Les simulateurs de divorce… ».

**Docs périmés** — tous ceux qui listaient les gardes une par une dans une chaîne
`&&` (`AGENTS.md`, `README.md`), qui affirmaient qu'aucune n'écrit
(`gardes.md`), ou que `check:submission` et `check:expertise` lisent la base
(`gardes.md` — faux pour les deux, elles sont hermétiques). `docs/archive/`
garde l'ancien nom de `audit-expertises-live.py`, c'est de l'histoire.

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

# Ce qui reste ouvert

> Mis à jour le 2026-07-21. Ce document et [`etat.md`](etat.md) sont les **seuls**
> à porter une date. Tout autre document qui écrit « aujourd'hui » est un bug.

## Avant le cutover

| Chantier | Où ça en est |
|---|---|
| **Bascule DNS + coupure Wix** | À coordonner. Rien de technique ne bloque. |
| **Pixels Cooked + Ads le jour J** | ⚠️ **Zéro fait.** Le formulaire capte bien `utm_*` / `gclid`, mais **rien ne les émet**. Seule priorité de `ne-pas-perdre` restée intacte. |
| **Indexation** | Le code déclare `index: true` et `robots.ts` autorise tout. La seule protection actuelle est le **login Vercel** — il n'y a **pas** de `noindex`. À décider consciemment au cutover. |
| Forfaits Pro Vercel + Supabase | Décision de Nicolas |

## ⚠️ Travail non fusionné à récupérer

**Branche `feat/expertise-ui-premium`** — commit `d7124dd` du 2026-07-18, de
Nicolas : « Expertises : UI premium (hero CTAs, cartes, conversion) ».
7 fichiers, +174/−57.

**Ce commit n'est pas dans `main`.** Vérifié ligne à ligne : le sommaire
d'expertise collant (fond translucide, `backdrop-blur`), les puces de navigation
arrondies et leur état actif en accent rouge n'existent nulle part dans le code
actuel.

Il touche `ExpertiseBody.tsx`, `ExpertisePageView.tsx`, `ExpertiseToc.tsx` et
`globals.css` — c'est-à-dire exactement les fichiers réécrits par le refactor
C5 du 20/07 (`ExpertiseBody` est passé de 730 à 469 lignes, `ExpertisePageView`
a changé de signature). **Une fusion directe partirait en conflits sur presque
chaque ligne.**

La bonne manière de le récupérer : relire le commit, en extraire les décisions
visuelles, et les réimplémenter sur le code actuel. Ce n'est pas un merge, c'est
une reprise d'intention.

⛔ **Ne pas supprimer cette branche tant que ce n'est pas fait.**

## Dette technique connue

| Sujet | Détail |
|---|---|
| **C3 — invalidation dérivée** | Partiel. Les chemins d'expertise sont dérivés du registry, mais les surfaces ne **déclarent** toujours pas ce qu'elles lisent. |
| **Ordre de résolution des liens (C5)** | Sur `avocat-divorce-bordeaux`, un lien se pose sur une mention plus tardive de « violences conjugales ». L'ordre dépend encore du parcours de rendu React. Un document typé le rendrait déterministe. |
| `tags` | Colonne + API + affichage existent, **zéro donnée**. Trancher : remplir ou retirer. |
| `DROP COLUMN body / author / author_id` | `posts.body` est écrit à chaque sauvegarde et lu par personne. Suppression non appliquée (destructive). |
| Colonnes `db_updated_at` | Sans trigger sur `authors`, `categories`, `content_singletons`. |
| Paste handler Tiptap | Coller depuis Word reste imparfait. |
| `/theme/<tag>` | Pages jamais créées. |
| « Défense des élus » | À retirer si le cabinet ne la revendique plus. |
| C5.1 covers Storage | Partiel : upload admin + URL, bucket `medias` public. |

## Volontairement en pause

**Le harnais pixel-perfect** ([`../archive/workflow-pixel-perfect.md`](../archive/workflow-pixel-perfect.md))
depuis le pivot du 18/07. L'UI est polie au fil de l'eau, pas par comparaison
pixel avec Wix.

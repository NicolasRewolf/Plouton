# D'où vient le contenu

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

**Le document central.** Si tu n'en lis qu'un, c'est celui-là : il répond à la
première question que pose le code de ce site.

## La règle

Le contenu a **deux domiciles** — Supabase, et l'instantané JSON de `contenu/`
hérité de la migration Wix. La règle tient en une phrase :

> **Supabase répond, sinon l'instantané.**

Elle vit à **un seul endroit** : `site/src/lib/posts-public.ts`. Nulle part
ailleurs. C'est le point important : avant le 20/07, cette décision était
retranchée dans une dizaine de modules avec des réponses divergentes, ce qui
produisait des symptômes sans rapport apparent (un article créé en admin absent
de la page de son auteur, une base vide affichant 422 articles côté admin et
zéro côté public).

## Le seam

`site/src/lib/content-source.ts` décrit ce qu'une source sait faire et en
fournit **deux** implémentations. Il ne tranche pas — il ne connaît pas la règle.

| Adapter | Rôle |
|---|---|
| `SUPABASE` | La source de vérité. Indisponible = pas de clé serveur, ou requête en erreur. |
| `SNAPSHOT` | L'instantané JSON de `contenu/`. Toujours disponible — c'est le dernier recours. |

Deux adapters, donc un vrai seam. Un seul aurait été de l'indirection.

## La convention qui porte tout

```
null  →  la source ne peut pas répondre  (non configurée, injoignable, en erreur)
[]    →  la source a répondu, et la réponse est vide
```

**Les confondre, c'est afficher un site vide au lieu de servir l'instantané.**
C'est exactement le défaut qui faisait dire à l'admin « 422 articles publiés »
pendant que le public n'en voyait aucun.

## Le piège contre-intuitif

Pour une **liste**, `null` est sans ambiguïté. Pour un **article**, `null`
signifie « absent » *ou* « source muette » — et la réponse change le résultat
(404, ou repli).

D'où la sonde `supabaseAnswers()` : **quand Supabase répond, son silence fait
autorité et l'instantané n'est pas consulté.** Un article absent de la base est
un 404, même si `contenu/articles/` en contient encore une copie. Le mot
« fallback » induit en erreur : ce n'est pas une seconde chance, c'est un relais
de panne.

## `FALLBACK_HEAL_SECONDS = 300`

`unstable_cache` était posé sans fenêtre de revalidation. Un **seul** échec de
Supabase — un démarrage à froid suffit — figeait l'instantané JSON pour toujours,
y compris à travers les redéploiements. Le site aurait servi le contenu Wix,
compteurs de vues à zéro, jusqu'à la prochaine publication.

Ce n'est pas théorique : observé le 20/07 pendant le refactor, deux captures à
code identique ont figé des sources différentes.

Cinq minutes bornent la dérive. Une publication invalide toujours le tag
immédiatement ; cette fenêtre ne sert qu'à guérir un repli subi.

## Le corps d'un article

```
body_doc   ProseMirror — LA SOURCE
body_html  rendu dérivé — un CACHE
body       tableau de paragraphes — hérité, plus lu au rendu
```

Le sens est toujours `body_doc → body_html`, **jamais l'inverse**. C'est pour ça
que `post_versions` archive `body_doc` (migration `0012`) : archiver le seul
cache faisait que restaurer une version était défait par la sauvegarde suivante.

Plus aucun rendu Ricos au runtime. `contenu/ricos/` reste la **provenance** de
la migration, lue uniquement par `scripts/check-body-docs.mjs`.

## Comment saura-t-on que la migration Wix est finie ?

Le jour où `SNAPSHOT` n'est plus jamais atteint, `contenu/articles/` peut mourir.

Tant que l'instantané est un adapter **nommé**, cette question a une réponse
unique et vérifiable — au lieu d'être une impression.

## Vérifier

`cd site && npm run check:sources` — exerce les deux états, y compris sans clé
serveur. Voir [`../guides/gardes.md`](../guides/gardes.md).

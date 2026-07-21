# Où on en est

> **Mis à jour le 2026-07-21.** Ce document et
> [`feuille-de-route.md`](feuille-de-route.md) sont les **seuls** à porter une
> date. Tout autre document qui écrit « aujourd'hui » est un bug.
> Détail des changements : [`/CHANGELOG.md`](../../CHANGELOG.md)

## En une phrase

Le socle technique est en place et déployé. Ce qui reste avant de remplacer Wix
est listé dans [`feuille-de-route.md`](feuille-de-route.md) — c'est court, mais
le **cutover DNS et les pixels du jour J** n'ont pas commencé.

## En ligne

- **Production Vercel** — build vert, 534 pages générées, redéploiement à chaque
  merge sur `main`.
  🔒 Protégée par le **login Vercel**. Il n'y a **pas** de `noindex` dans le code.
- **Supabase** (projet `Plouton`) — 7 tables, 12 migrations appliquées, CLI liée.
- Le public lit **Supabase**, avec repli sur l'instantané JSON —
  [`../socle/architecture-contenu.md`](../socle/architecture-contenu.md).

## Le contenu

| | |
|---|---|
| Articles | **422** — en base, corps en `body_doc` |
| Pages d'expertise | **15**, sur 3 pôles |
| Rubriques | 17 · FAQ unifiée · 6 membres d'équipe |
| Redirections 301 | 161 |
| Demandes | ~756 (dont l'import Wix) |

## Les canalisations C0–C5 — terminées

> ⚠️ Ne pas confondre avec le refactor C1–C5 du 20/07 :
> [`../socle/vocabulaire.md`](../socle/vocabulaire.md).

| Phase | Quoi |
|---|---|
| C0 | Formulaire → `demandes` |
| C1 | Pièces jointes → bucket |
| C2 | Magic link + `/admin/demandes` |
| C3 | Resend + import CSV Wix |
| C4 | Table `posts` + seed 422 |
| C5 | Le public lit la base + publication sans redéploiement |

## Le refactor du 2026-07-20

Cinq PR fusionnées (#66 → #70) : 13 défauts corrigés, et les modules
d'architecture décrits dans
[`../socle/modules-canoniques.md`](../socle/modules-canoniques.md).

Trois défauts avaient une conséquence visible pour un avocat : l'autosave
dépubliait un article en ligne, créer un article pouvait en écraser un autre, et
restaurer une version était annulé à la sauvegarde suivante. Les trois sont
fermés.

**Cinq gardes exécutables** existent désormais —
[`../guides/gardes.md`](../guides/gardes.md). C'était zéro avant.

## Ce qui n'est pas fini

Voir [`feuille-de-route.md`](feuille-de-route.md). Les deux points qui comptent :
les **pixels Cooked / Ads** (rien n'émet, alors que le formulaire capte déjà les
`utm_*`) et la **bascule DNS**.

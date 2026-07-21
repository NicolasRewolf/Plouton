# Vocabulaire

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

## ⚠️ « C0 à C5 » désigne DEUX séries différentes

C'est le piège de lecture n°1 du dépôt.

| Série | Ce que c'est | Où c'est décrit |
|---|---|---|
| **Canalisations C0–C5** | Les phases de plomberie de données, de juillet. C0 = formulaire → `demandes`. C5 = le public lit Supabase. **Toutes terminées.** | [`../etat/etat.md`](../etat/etat.md) |
| **Refactor C1–C5 du 20/07** | Les candidats d'un audit d'architecture, PR #66 à #70. C1 = `content-source`, C2 = `cms-collection`, C4 = `article-submission`, C5 = `expertise-content`. | [`/CHANGELOG.md`](../../CHANGELOG.md) |

Les deux « C5 » n'ont **aucun rapport**. Quand tu écris C5 quelque part, précise
laquelle : « C5 (canalisation) » ou « C5 (refactor 20/07) ».

## Les mots du code

**seam** — l'endroit où une interface vit, et où le comportement peut changer
sans modifier les appelants. Ici : `content-source.ts`.

**instantané / SNAPSHOT** — la copie JSON du contenu dans `contenu/`, héritée de
Wix. Ce n'est **pas** la source de vérité : c'est le relais de panne.

**`body_doc` / `body_html`** — la source ProseMirror, et son rendu mis en cache.
Le sens est toujours doc → html.

**garde** — un script exécutable qui prouve une propriété du contenu ou du code.
Voir [`../guides/gardes.md`](../guides/gardes.md). Ce ne sont pas des tests
unitaires : ils tournent contre les vraies données.

**pôle / expertise** — un pôle regroupe des expertises (`defense-penale` →
`droit-penal`, `proces-criminel`…). La taxonomie vit dans
`contenu/reference/poles-registry.json` ; le **contenu** des 15 pages vit dans
`contenu/expertises/*.json`.

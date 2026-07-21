# Documentation Plouton

Les documents sont classés par **durée de vie**, pas par sujet. C'est ce qui
évite qu'un document volatil et un document stable se ressemblent — la cause
principale du pourrissement précédent.

## 📍 `etat/` — volatil (jours)

Le **seul** endroit où l'on écrit une date. Si un autre document dit
« aujourd'hui », c'est un bug.

| Doc | Quand le lire |
|---|---|
| [`etat/etat.md`](etat/etat.md) | Pour savoir où on en est |
| [`etat/feuille-de-route.md`](etat/feuille-de-route.md) | Pour savoir ce qui reste ouvert |

## 🧱 `socle/` — stable (mois)

Décrit le système **tel qu'il est**. Ne devrait bouger que si le code bouge.

| Doc | Quand le lire |
|---|---|
| [`socle/architecture-contenu.md`](socle/architecture-contenu.md) | **👉 En premier.** D'où vient un article, et pourquoi |
| [`socle/vocabulaire.md`](socle/vocabulaire.md) | Avant de lire quoi que ce soit d'autre — « C5 » désigne deux choses |
| [`socle/modules-canoniques.md`](socle/modules-canoniques.md) | Avant d'écrire du code : ce qui existe, et ce qu'il ne faut pas ressusciter |
| [`socle/architecture-site.md`](socle/architecture-site.md) | Les routes et les gabarits |
| [`socle/donnees.md`](socle/donnees.md) | Le modèle de données |
| [`socle/composants-ui.md`](socle/composants-ui.md) | Les composants canoniques (cartes, CTA) |
| [`socle/taxonomie-blog.md`](socle/taxonomie-blog.md) | Rubriques et tags |
| [`socle/seo-geo.md`](socle/seo-geo.md) | SEO et référencement local |
| [`socle/stack-technique.md`](socle/stack-technique.md) | Supabase, Vercel, Cooked |
| [`socle/ne-pas-perdre.md`](socle/ne-pas-perdre.md) | Les contraintes client. Ne périme jamais. |
| [`socle/vue-ensemble.md`](socle/vue-ensemble.md) | Le projet en une page |

## 🛠 `guides/` — procédural

« Comment je fais X. »

| Doc | Quand le lire |
|---|---|
| [`guides/demarrer.md`](guides/demarrer.md) | Première installation — **contient le piège n°1** |
| [`guides/gardes.md`](guides/gardes.md) | **Avant toute livraison.** Les seuls tests du projet |
| [`guides/migrations-supabase.md`](guides/migrations-supabase.md) | Toucher à la base |
| [`guides/backoffice.md`](guides/backoffice.md) | Comprendre l'admin |
| [`guides/migration-wix.md`](guides/migration-wix.md) | Rejouer un import |

## ⚖️ `decisions/`

[`decisions/journal-decisions.md`](decisions/journal-decisions.md) — les
décisions figées, avec leur statut (actif / remplacée).

## 📦 `archive/`

[`archive/LIRE-MOI.md`](archive/LIRE-MOI.md) — **rien ici ne décrit le code
actuel.** Conservé pour comprendre le *pourquoi*, jamais le *comment*.

---

## Les règles

| Quoi | Où |
|---|---|
| Une livraison | [`/CHANGELOG.md`](../CHANGELOG.md) — une entrée par PR, rubrique « Docs périmés » obligatoire |
| Une décision métier | `decisions/journal-decisions.md` |
| Un état qui change | `etat/etat.md` — et **nulle part ailleurs** |

# Les gardes

> Vérifié le 2026-07-21. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

**Ce sont les seuls tests du projet.** Aucun fichier `*.test.*` n'existe, aucune
CI ne les lance. Elles sont à lancer **à la main, avant toute livraison.**

Une garde n'est pas un test unitaire : elle tourne contre les **vraies données**
(les 422 articles, les 15 expertises) et prouve une propriété du contenu ou du
code. Chacune existe parce qu'un défaut réel est passé — la colonne « un échec
veut dire » raconte lequel.

## Une seule commande

```bash
cd site && npm run check
```

Elle enchaîne les onze gardes et s'arrête à la première qui bronche. C'est ce
qu'il faut lancer avant de livrer.

⚠️ **`npm install` d'abord.** Neuf d'entre elles passent par `tsx`, pour importer
le TypeScript réel du site plutôt qu'une copie. Sur un checkout qui n'a pas
réinstallé, elles échouent sur `tsx: command not found` — ce n'est pas un échec
de garde, c'est une dépendance manquante.

## Trois issues, et elles ne veulent pas dire la même chose

C'est le point important pour qui n'est pas développeur :

| Sortie | Verdict | Ce que ça veut dire |
|---|---|---|
| **0** | `CONFORME` | Tout a été vérifié, tout passe. |
| **1** | `ÉCHEC` | Un défaut est **prouvé**. Il y a quelque chose à réparer. |
| **2** | `INCOMPLET` | Rien n'a échoué, mais **tout n'a pas pu être vérifié**. |

`INCOMPLET` existe pour une raison précise. `check:sources` sautait autrefois
tout son volet Supabase quand la clé serveur était absente — puis imprimait
`✅ conforme` et sortait 0. Elle disait « vérifié » en n'ayant vérifié que la
moitié. Un saut est désormais déclaré, compté, et sort en 2.

En local, sans clé Supabase, c'est normal et vous pouvez l'assumer :

```bash
GARDES_TOLERE_SKIP=1 npm run check
```

**Jamais avant une livraison.** Le trou est réel : il n'est acceptable que
lorsqu'on sait ce qu'on ne teste pas.

## Ce que chaque garde prouve

Depuis `site/` :

| Commande | Ce qu'elle prouve | Un échec veut dire |
|---|---|---|
| `check:roundtrip` | Ouvrir un article dans l'éditeur puis le resauvegarder ne perd **aucun nœud**, sur les 422. | Le schéma TipTap ne sait plus relire un type de contenu — il disparaîtrait en silence à la première sauvegarde. |
| `check:edit-loss` | La garde anti-suppression tient ses deux bords : elle laisse passer une édition normale, elle arrête une perte réelle. | Soit elle bloque des articles sains, soit elle laisse détruire du contenu. |
| `check:sources` | Les **deux** sources répondent, y compris sans clé serveur, c'est-à-dire quand Supabase est injoignable. | Le repli sur l'instantané ne fonctionne plus : une panne de base deviendrait un site vide. |
| `check:precedence` | La règle « Supabase répond, sinon l'instantané » tranche juste dans les cas qu'on ne peut pas provoquer en production : base muette, base joignable mais vide, article supprimé qui traîne encore dans l'instantané. | Le symptôme historique revient : 422 articles côté admin et zéro côté public, ou un article supprimé qui ressuscite. |
| `check:submission` | Les règles d'écriture (slug, statut, forme) refusent ce qui doit l'être au lieu de le corriger en silence. | Une soumission malformée passerait — c'est ainsi qu'un statut mal orthographié dépubliait un article en répondant 200. |
| `check:statuts` | Le calcul de date des statuts : publié + date future devient programmé, programmé + date passée devient publié, brouillon et archivé ne bougent jamais. | Un article programmé ne sortirait pas le bon jour, ou un archivé réapparaîtrait. |
| `check:baremes` | Les deux simulateurs (pension alimentaire, prestation compensatoire) rendent les mêmes montants qu'aujourd'hui, planchers compris. | Un chiffre affiché à un justiciable a changé sans que personne l'ait décidé. |
| `check:expertise` | L'interprétation des 15 pages d'expertise est lisible et complète ; imprime **ce que le site croit lire**. | Une expertise a perdu ses sections, ou un lien interne pointe vers rien. |
| `check:meta` | Pour chacun des 422 articles, la description que le site **va réellement servir** est exploitable. | Un article partirait en référencement avec une description vide ou tronquée sur une élision (« Cour d », « Victime d »). |
| `check:body-docs` | Les 422 Ricos et les 422 `body_doc` disent la même chose (types, texte, conversion stable). | Un article a été abîmé à la migration. |
| `check:docs` | Aucun document ne pointe vers un fichier disparu, ni ne cite un module supprimé. | La documentation a recommencé à pourrir. |

## Les deux règles qui portent tout

Elles sont dans le harnais, [`scripts/lib/garde.mjs`](../../scripts/lib/garde.mjs),
et ce sont elles qui font la différence entre une garde et un décor.

**1. Une garde importe la règle qu'elle vérifie. Elle ne la réénonce jamais.**

`check-meta-descriptions` épinglait sa propre expression d'élision, différente
de celle de `site/src/lib/meta-description.ts`. Elle laissait donc passer ce que
le site rejetait, et inversement : elle testait une règle qui n'existait nulle
part, et elle était verte. Une garde qui recopie un seuil, une expression
régulière ou une table de barème ne vérifie plus le site — elle vérifie sa
propre copie.

**2. Sauter une vérification, ce n'est pas réussir.** Voir `INCOMPLET` ci-dessus.

## Où elles vivent, et pourquoi

| Dossier | Contient | Pourquoi séparé |
|---|---|---|
| `site/scripts/` | Les 9 gardes qui importent le TypeScript réel du site (via `tsx`) | Elles doivent voir le vrai code, pas une copie |
| `scripts/` | Les 2 gardes qui ne touchent pas au TypeScript, + le harnais dans `lib/` | Elles tournent sous `node` nu |
| `site/scripts/regen/` | **Ce qui écrit** — aujourd'hui `regen-body-html.mjs` seul | Pour que « une garde ne modifie rien » se lise sur le dossier |

Tout ce qui est directement dans `site/scripts/` et `scripts/check-*` est en
lecture seule. Ce n'est plus une promesse dans un document : c'est le rangement.

⚠️ Le préfixe `check-` ne suffit pas à faire une garde.
`scripts/audit-expertises-live.py` s'appelait `check-expertises-live.py` alors
qu'il sort **toujours 0** et que `--fix` réécrit `contenu/expertises/`. Renommé
pour que le nom dise ce qu'il fait.

## Régénération (écrit, elle)

```bash
cd site && npm run regen:body-html -- --dry-run   # prévisualiser
cd site && npm run regen:body-html                # écrire
```

Reconstruit le cache `contenu/body-html/` depuis `contenu/body-docs/`, avec le
**vrai** renderer du site. À relancer après toute modification du schéma
TipTap — sinon le cache et l'éditeur divergent.

## Avant de livrer

```bash
cd site
npm run check && npx tsc --noEmit && npx eslint . && npm run build
```

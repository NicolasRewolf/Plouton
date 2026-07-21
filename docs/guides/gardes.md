# Les gardes

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

**Ce sont les seuls tests du projet.** Aucun fichier `*.test.*` n'existe, aucune
CI ne les lance. Elles sont à lancer **à la main, avant toute livraison qui
touche au contenu, à l'éditeur ou aux sources de données.**

Aucune n'écrit quoi que ce soit : toutes sont en lecture seule.

## Depuis `site/`

| Commande | Ce qu'elle prouve | Un échec veut dire |
|---|---|---|
| `npm run check:roundtrip` | Ouvrir un article dans l'éditeur puis le resauvegarder ne perd **aucun nœud**, sur les 422. | Le schéma TipTap ne sait plus relire un type de contenu — il disparaîtrait en silence à la première sauvegarde. |
| `npm run check:edit-loss` | La garde anti-suppression tient ses deux bords : elle laisse passer une édition normale, elle arrête une perte réelle. | Soit elle bloque des articles sains, soit elle laisse détruire du contenu. |
| `npm run check:sources` | Les **deux** sources répondent — y compris sans clé serveur, c'est-à-dire quand Supabase est injoignable. | Le repli sur l'instantané JSON ne fonctionne plus : une panne de base deviendrait un site vide. |
| `npm run check:submission` | Les règles d'écriture (slug, statut, forme) refusent ce qui doit l'être au lieu de le corriger en silence. | Une soumission malformée passerait — c'est ainsi qu'un statut mal orthographié dépubliait un article en répondant 200. |
| `npm run check:expertise` | L'interprétation des 15 pages d'expertise est lisible et complète ; imprime **ce que le site croit lire**. | Une expertise a perdu ses sections, ou un lien interne pointe vers rien. |

## Depuis la racine

| Commande | Ce qu'elle prouve |
|---|---|
| `node scripts/check-body-docs.mjs` | Les 422 documents Ricos et les 422 `body_doc` disent la même chose (types, texte, conversion stable). C'est ce qui garantit qu'aucun article n'a été abîmé à la migration. |
| `node scripts/check-meta-descriptions.mjs` | Chaque article a une meta description exploitable (≥ 80 caractères, pas de troncature). |
| `node scripts/check-docs-links.mjs` | Aucun document ne pointe vers un fichier disparu, ni ne cite un module supprimé. C'est ce qui empêche la doc de repourrir. |

## Régénération (écrit, elle)

`npm run regen:body-html` reconstruit le cache `contenu/body-html/` depuis
`contenu/body-docs/`, avec le **vrai** renderer du site. À relancer après toute
modification du schéma TipTap — sinon le cache et l'éditeur divergent.

## Avant de livrer

```bash
cd site
npm run check:roundtrip && npm run check:edit-loss && npm run check:sources \
  && npm run check:submission && npm run check:expertise \
  && npx tsc --noEmit && npx eslint . && npm run build
cd .. && node scripts/check-body-docs.mjs
```

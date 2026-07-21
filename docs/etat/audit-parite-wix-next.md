# Audit de parité Wix → Next

> **Mis à jour le 2026-07-21.** Registre durable : un prochain agent reprend
> exactement là où le précédent s'est arrêté. L'état par URL vit dans
> [`audit-parite-inventaire.csv`](audit-parite-inventaire.csv).

## But

Vérifier que le nouveau site Next.js dit **la même chose** que le site Wix
encore en ligne (<https://www.jplouton-avocat.fr>), page par page :

- texte complet — sans oubli, ajout ni reformulation ;
- titres H1–H4, listes, structure ;
- liens internes, boutons, destinations ;
- `<title>` SEO, meta description, URL canonique.

On compare le **sens et la structure**, pas le code généré par Wix. On ignore
les différences purement graphiques, les cookies, et les paramètres Cooked/UTM.

**Corrections : uniquement côté Next, toujours depuis la source de contenu
canonique** (Supabase / instantané `contenu/`, cf.
[`../socle/architecture-contenu.md`](../socle/architecture-contenu.md)). On ne
touche jamais à Wix, ni à la prod, ni aux slugs, ni aux textes de sa propre
initiative.

## Cooked — statut d'accès

**Cooked est le système de mesure du site** (dépôt privé `NicolasRewolf/cooked`,
base Supabase `mxycmjkeotrycyneacje`). Il devait servir à traiter d'abord les
URLs les plus consultées.

**Signalé une fois : Cooked est inaccessible depuis un agent cloud.**

- Le MCP Supabase (`.cursor/mcp.json`) exige une authentification OAuth qui ne
  se complète que dans Cursor Desktop ; un agent cloud ne peut pas la réaliser,
  et le serveur n'est pas injecté à chaud dans une session en cours.
- Aucune clé de service Supabase du projet Cooked n'est présente dans
  l'environnement (aucun secret `SUPABASE_*` pour ce projet).

**Pour débloquer** (au choix, à faire par Nicolas) :

1. Ajouter un secret **clé Supabase en lecture** du projet Cooked
   (`COOKED_SUPABASE_URL` + `COOKED_SUPABASE_SECRET_KEY`) dans les Secrets de
   l'agent — l'agent interrogera alors Cooked directement, sans MCP.
2. Ou authentifier le MCP Supabase dans Cursor Desktop puis relancer l'agent.

### Signal de priorité utilisé en attendant (données réelles, non inventées)

À défaut de Cooked, on classe par **vues Wix réelles** issues de
[`../../contenu/sources/wix/stats-posts.json`](../../contenu/sources/wix/stats-posts.json)
(422 posts, ~258 000 vues cumulées). C'est le même type de signal
« pages les plus consultées », pour les posts. Quand Cooked sera accessible, on
recalculera le rang (y compris pour les pages structure, absentes de ce
fichier) et on complétera la colonne `rang`.

## Méthode & outil

Outil de comparaison **en lecture seule** (ne modifie rien) :

- [`../../scripts/audit-parite/audit_lib.py`](../../scripts/audit-parite/audit_lib.py)
  — extrait titre/meta/canonique, titres H1–H4, blocs de texte et liens des deux
  pages, puis rapporte omissions (Wix→absent Next), ajouts et reformulations.
- [`../../scripts/audit-parite/run_batch.py`](../../scripts/audit-parite/run_batch.py)
  — lance un lot et classe chaque URL. `--posts-top N` / `--structure`.
- [`../../scripts/audit-parite/build_inventaire.py`](../../scripts/audit-parite/build_inventaire.py)
  — (re)génère l'inventaire CSV.

Le serveur Next doit tourner en local (`cd site && npm run dev`) : la prod Vercel
est protégée par login, on compare donc **Wix live** ↔ **Next local**.

Pour les **posts**, les deux côtés sont cadrés sur le corps de l'article
(`data-hook="post-description"` côté Wix, premier `<article>` côté Next) : la
comparaison de texte est fiable et peu bruitée.

Les « ajouts » côté Next récurrents et **attendus** (chrome de gabarit, à
ignorer) : encart auteur « À propos de l'auteur », ligne d'auteur/date/temps de
lecture, bouton « En savoir plus sur le cabinet », mention « Dernière mise à
jour … », bloc « Posts similaires ». Ce ne sont pas des ajouts de contenu
d'article.

## États possibles

| État | Sens |
|---|---|
| `conforme` | texte, titres, listes, liens et SEO équivalents |
| `corrigée` | un écart réel a été corrigé côté Next depuis la source canonique |
| `bloquée` | écart potentiellement **voulu** (décision éditoriale/SEO) — non corrigé, à arbitrer |
| `à faire` | pas encore contrôlée |

## Avancement

| | |
|---|---|
| URLs inventoriées | **449** (27 structure/hub/expertise + 422 posts) |
| Contrôlées | **25** (top 25 posts par vues) |
| `conforme` | 11 · `bloquée` 14 · `corrigée` 0 |
| Reste | 424 `à faire` |

### Lot 1 — top 25 posts par vues (2026-07-21)

**Fidélité du corps : excellente.** Sur les 25 posts les plus consultés,
**aucune omission réelle de texte** (hors un bloc « Cabinet Plouton » — probable
signature — sur un post, à vérifier). Titres et listes conformes.

**Écart systémique constaté — meta descriptions.** Next utilise le champ
`excerpt` du post comme meta description. Sur > la moitié des posts contrôlés,
elle diffère de la meta live Wix. Trois cas de figure :

1. Wix a une meta rédigée, Next affiche un **extrait du corps** (`excerpt` pollué
   à la migration) — ex. `durée-de-la-garde-à-vue…`. Régression probable.
2. Les deux ont une meta valide mais **différente** — ex. `casier-judiciaire…`.
   Dérive éditoriale.
3. Wix n'a **pas** de meta, Next en a une — ex. `affaire-matias-batista…`.
   Amélioration côté Next.

**Décision (prudente, conforme à la consigne) :** je **n'ai pas** réécrit ces
meta descriptions. Réécrire 200+ metas depuis Wix serait une modification de
contenu massive prise de ma propre initiative, et le sens « juste » (restaurer
Wix ? garder la nouvelle ?) est une **décision SEO/éditoriale** qui revient à
Nicolas. Ces pages sont classées `bloquée` avec le détail Wix vs Next dans le
CSV. → **À arbitrer par Nicolas** (voir « Décisions attendues »).

Détail par URL : colonnes `statut` / `ecarts` / `date_controle` de
[`audit-parite-inventaire.csv`](audit-parite-inventaire.csv).

## Pages structure / expertise — note de méthode

Plusieurs URLs Next sont des **chemins canoniques nouveaux** qui n'existent pas
à l'identique sur Wix (ex. `/medias`, `/cookies`,
`/politique-de-confidentialite` répondent 404 sur Wix — le contenu y vit à un
autre slug, atteint via les 161 redirections). Leur audit demande, page par
page : (1) trouver l'URL Wix équivalente, (2) cadrer la région de contenu des
deux côtés. C'est le **prochain lot** ; ces pages restent `à faire`.

## Décisions attendues (Nicolas)

1. **Meta descriptions** : pour les posts où Next diffère de Wix, que faut-il
   faire ? (a) restaurer la meta Wix, (b) garder l'`excerpt` actuel de Next,
   (c) cas par cas. Sans réponse, elles restent `bloquée`.
2. **Accès Cooked** : fournir une clé Supabase en lecture (voir plus haut) pour
   classer par vraies stats Cooked et couvrir les pages structure.

## Pour reprendre (prochain agent)

1. `cd site && npm run dev` (serveur local sur :3000).
2. Lot posts suivant : `python3 scripts/audit-parite/run_batch.py --posts-top 50`
   puis reporter les nouveaux résultats (au-delà du top 25) dans le CSV.
3. Ou attaquer les pages structure avec le mapping d'URL Wix (voir note ci-dessus).
4. À chaque lot : gardes AGENTS.md, `CHANGELOG.md`, commit + push, PR brouillon.
   Ne rien fusionner ni déployer.

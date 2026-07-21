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
base Supabase `mxycmjkeotrycyneacje`) : traceur maison sans cookies + Google
Search Console ingéré dans la même base.

**✅ Accessible depuis le 2026-07-21.** Deux secrets fournis par Nicolas
permettent d'interroger la base **en lecture directe** (sans MCP) :
`COOKED_SUPABASE_URL` + `COOKED_SUPABASE_SECRET_KEY`.

> Note : le **MCP Supabase** (`.cursor/mcp.json`) ne fonctionne **pas** depuis un
> agent cloud (OAuth possible seulement dans Cursor Desktop, pas d'injection à
> chaud). On passe donc par l'API REST du projet avec la clé de service.

### Signal de priorité — clics Google Search Console (Cooked)

Le rang vient de la vue Cooked `gsc_path_metrics_28d` (**clics GSC, 28 jours
glissants**), tous types de pages confondus (409 pages avec clics). C'est le
signal « pages réellement les plus consultées » demandé. Il est recalculé à
chaque `build_inventaire.py`.

L'agrégat plus lourd `cooked_pages_snapshot` (sessions traceur) dépasse le
timeout REST ; la vue GSC 28 j, indexée, répond instantanément et suffit au
classement.

Colonne `clics_gsc_28j` du CSV = valeur réelle au moment du contrôle. La colonne
`vues_wix` (instantané Wix hérité) est conservée comme second signal.

## Méthode & outil

Outil de comparaison **en lecture seule** (ne modifie rien) :

- [`../../scripts/audit-parite/audit_lib.py`](../../scripts/audit-parite/audit_lib.py)
  — extrait titre/meta/canonique, titres H1–H4, blocs de texte et liens des deux
  pages, puis rapporte omissions (Wix→absent Next), ajouts et reformulations.
- [`../../scripts/audit-parite/run_batch.py`](../../scripts/audit-parite/run_batch.py)
  — lance un lot et classe chaque URL. `--posts-top N` / `--structure`.
- [`../../scripts/audit-parite/cooked_rank.py`](../../scripts/audit-parite/cooked_rank.py)
  — classement Cooked (clics GSC 28 j) via l'API REST Supabase.
- [`../../scripts/audit-parite/build_inventaire.py`](../../scripts/audit-parite/build_inventaire.py)
  — (re)génère l'inventaire CSV, classé Cooked, en **préservant** les statuts.

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
| Contrôlées | **50** (top 50 posts par clics GSC) |
| `conforme` | 25 · `bloquée` 25 · `corrigée` 0 |
| Reste | 399 `à faire` |

### Résultat d'ensemble (lots 1 + 2 — 2026-07-21)

**Fidélité du corps : excellente.** Sur les 50 posts les plus consultés,
**aucune omission réelle de texte**. Titres, listes et **FAQ** (accordéons
`<details>`) conformes. Les seuls « manques » détectés étaient des **faux
positifs** de l'outil (voir plus bas) ou des **cartes d'aperçu de lien Wix**
(le titre de la page cible affiché en vignette) — présentation propre à Wix, le
lien lui-même existe côté Next. Ignoré, comme prévu.

**Seul écart réel et récurrent — meta descriptions.** Next utilise le champ
`excerpt` du post comme meta description ; sur ~la moitié des posts elle diffère
de la meta live Wix. Trois cas :

1. Wix a une meta rédigée, Next affiche un **extrait de corps** (`excerpt` pollué
   à la migration) — ex. `durée-de-la-garde-à-vue…`. Régression probable.
2. Les deux ont une meta valide mais **différente** — ex. `casier-judiciaire…`.
   Dérive éditoriale.
3. Wix n'a **pas** de meta, Next en a une — ex. `affaire-matias-batista…`.
   Amélioration côté Next.

**Décision (prudente, conforme à la consigne) :** je **n'ai pas** réécrit ces
meta descriptions. Réécrire ~200 metas depuis Wix serait une modification de
contenu massive prise de ma propre initiative, et le sens « juste » (restaurer
Wix ? garder la nouvelle ?) est une **décision SEO/éditoriale** qui revient à
Nicolas. Ces pages sont `bloquée` avec le détail dans le CSV.

**Correctif d'outil appliqué en cours de route.** Le premier jet signalait à
tort les questions de FAQ comme « absentes côté Next » : elles vivent dans des
balises `<summary>`/`<details>` que l'extracteur ne lisait pas. Corrigé (ajout
de `summary`, `dt`, `dd`) ; les lots ont été rejoués. Aucune perte de FAQ
réelle : la FAQ est bien rendue côté Next (accordéon), et présente dans le
`body_doc` canonique.

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

1. **Meta descriptions** (seul point ouvert) : pour les posts où Next diffère de
   Wix, que faut-il faire ? (a) restaurer la meta Wix, (b) garder l'`excerpt`
   actuel de Next, (c) cas par cas. Sans réponse, elles restent `bloquée`.
   Une fois la règle connue, la correction se fait côté source canonique
   (`excerpt` / `seo` du post) et repasse les pages en `corrigée`.

## Pour reprendre (prochain agent)

1. `cd site && npm run dev` (serveur local sur :3000).
2. Rafraîchir le classement Cooked : `python3 scripts/audit-parite/build_inventaire.py`
   (préserve les statuts déjà saisis).
3. Lot suivant — les prochaines lignes `à faire` par rang. Lister les chemins :
   `awk -F';' '$6=="à faire" && $3=="post"{print $2}' docs/etat/audit-parite-inventaire.csv | head -25`
   puis les passer à `run_batch.py`, et reporter statut/date/ecarts dans le CSV.
4. Pages structure/expertise : établir d'abord le mapping d'URL Wix (plusieurs
   chemins Next sont neufs), puis cadrer les régions des deux côtés.
5. À chaque lot : gardes AGENTS.md, `CHANGELOG.md`, commit + push, PR brouillon.
   Ne rien fusionner ni déployer.

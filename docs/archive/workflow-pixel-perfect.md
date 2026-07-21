# Workflow pixel-perfect v2 — boucle de convergence outillée

> ⛔ **ARCHIVE — ne décrit PAS le code actuel.**
> État courant : [`../etat/etat.md`](../etat/etat.md) · Architecture : [`../socle/architecture-contenu.md`](../socle/architecture-contenu.md) · Changements : [`/CHANGELOG.md`](../../CHANGELOG.md)

> ## ⏸ EN PAUSE (2026-07-18 soir)
>
> **Priorité produit = C5** (site public ← Supabase).  
> Ne **pas** lancer les Phases 4–6 pixel sauf **demande explicite** de Nicolas.  
> Le socle Phases 0–3 (harnais `scripts/visual/`, `contenu/reference/`, fonts, Ricos) est **conservé**.  
> Header figé · Footer déjà mergé (PR #6) · Expertises hors pixel.  
> Voir [`14-etat.md`](14-etat.md) · [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).

---

Remplace le workflow manuel (« screenshot, corriger écart par écart à l'œil »).
Principe : la vérité terrain du live Wix est **figée dans le repo** et chaque
template converge via un **diff automatique numérique**, jamais à l'impression.

## Vérité terrain (figée, committée)

| Artefact | Emplacement | Régénération |
|---|---|---|
| Specs de styles calculés + screenshots live (13 pages × 3-4 viewports) | `contenu/reference/<page>/<vw>/` | `node scripts/visual/capture.mjs --target live --page all --viewport all` |
| CSS Wix brut + tokens parsés | `contenu/reference/tokens/` | `node scripts/visual/extract-tokens.mjs` |
| Polices réelles du live (woff2 + alias) | `site/public/fonts/wix/` + `site/src/app/fonts.wix.css` | `node scripts/visual/fetch-fonts.mjs` |
| Tokens thème générés | `site/src/app/theme.wix.css` | `extract-tokens.mjs` (AUTO-GÉNÉRÉ, ne pas éditer) |
| Écarts volontaires (améliorations assumées) | `contenu/reference/deviations.json` | à la main, une entrée par déviation |

Le live disparaîtra après la bascule DNS : ne JAMAIS supprimer `contenu/reference/`.

## La boucle (une itération)

```
1. node scripts/visual/diff.mjs --page <id> --viewport 1440
2. Lire reports/visual/<page>/1440/spec-diff.md → prendre le cluster n°1
3. Corriger UNE cause racine, dans cet ordre de préférence :
   token global (theme.wix.css / globals.css) > style de composant > structure JSX
   OU si l'écart est une amélioration voulue : entrée dans deviations.json
   (charger d'abord la skill design pertinente : better-ui / better-typography / better-colors)
4. Relancer le diff → vérifier que le nombre de majeurs BAISSE
5. Répéter jusqu'à PASS, puis valider 375 et 768
6. Marquer la page convergée + commit (résumé du diff dans le message)
```

## Garde-fous

- Ne jamais chasser le ratio pixel tant que `majeurs > 0` — le spec-diff d'abord.
- Une cause racine par itération (les clusters regroupent les symptômes).
- Interdit de transformer un fix de token global en override par composant.
- Next 16 = APIs différentes du training data → lire `site/node_modules/next/dist/docs/`
  avant de toucher `site/` (cf. `site/AGENTS.md`).
- Le contenu texte doit être identique au live (les ancres s'apparient par texte) —
  si des ancres ne s'apparient pas, vérifier d'abord le CONTENU, pas le style.
- `deviations.json` : jamais d'entrée « fourre-tout » (`keyPattern: "*"` interdit
  sauf raison écrite) ; chaque entrée cite sa règle design.

## Gates d'acceptation (diff.mjs les applique, exit code 0/1)

| Classe | Définition (extrait) | Gate |
|---|---|---|
| Majeur | famille résolue fausse ; font-size > 1px ; graisse ; ΔE couleur > 2 ; deltaY > 8px ; largeur > 8px ; ancre manquante | 0 non couvert par déviation |
| Mineur | line-height ≤ 2px ; letter-spacing ≤ 0.2px ; deltaY 2–8px | ≤ 10 / page |
| Pixel/section | texte ≤ 1.5 % (posts 2 %) ; image ≤ 4 % non bloquant si 0 majeur | |
| Hauteur page | vs live | ± 2 % |

## Ordre de convergence (plan approuvé 2026-07-18)

Briques d'abord (Header → Footer → CTA/boutons → FAQ → cartes → bannières),
puis templates : expertise (18 p.) → hubs de pôles → article (422 p.) →
feed blog (18 p.) → accueil → one-offs. Détail : plan
`~/.claude/plans/comme-tu-sais-mon-synthetic-crown.md`.

> **Exception Plouton (décision 2026-07-18) :** le Header de `main` est **gelé**
> (vérité produit, pas de reconvergence pixel). Footer **déjà mergé** (PR #6).
> Phases 4–6 = **pause** — ne pas enchaîner CTA/FAQ/cartes/accueil « comme Wix »
> tant que C5 n’est pas fait. Voir `deviations.json` → `header-frozen-main`
> et `docs/05-decisions.md`.

## Captures locales

`capture.mjs --target local` suppose `npm run dev` actif dans `site/` (port 3000).
Le diff relance sa propre capture locale à chaque run (`--skip-capture` pour réutiliser).

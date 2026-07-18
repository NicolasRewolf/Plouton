# Passation — 2026-07-18 (soir)

_Pour Fable / prochain agent. Deux chantiers se sont croisés : le tien (fidélité Wix)
et une session UX/archi/perf sur `main` avec Nicolas + Cursor. Lis tout avant de coder._

---

## Message prêt à coller (Nicolas → Fable)

> Salut Fable — on reprend proprement.
>
> ### Ton chantier (copie fidèle) — où tu en étais
> - Plan : Phases 0→6 (vérité terrain → polices/tokens → Ricos → briques → templates → galerie).
> - **Poussé** sur `claude/wix-nextjs-migration-strategy-a31825` : Phases **0–3** (captures, polices/tokens, harvest Ricos/FAQ/nav, renderer Ricos + template article).
> - **Mergé dans `main`** via PR #4 (`306fd7e` et avant).
> - **Dernier message** : Header/Footer en cours de convergence dans le **worktree** (non reviewé / non commité proprement) ; baseline SEO à **re-run** (mesures polluées par le hot-reload).
> - Suite prévue chez toi : review Header → briques → template expertise → hubs → article → blog → accueil (`docs/13-workflow-pixel-perfect.md`).
>
> ### Ce qu’on a fait **sans toi** sur `main` (après ton merge)
> ~14 commits UX / archi / perf — **volontairement « améliorer en chemin »**, déjà consignés dans `contenu/reference/deviations.json` quand c’était un écart assumé.
>
> Notamment :
> - Formulaire RDV v3 + `demande-intake.ts` (validation serveur)
> - Expertises : hero asymétrique, TOC sticky, `ExpertiseBody`, liens internes, **13/14 illustrations** (manque Divorce)
> - Accueil : photo équipe + flèches pôles
> - Header **méga-menu** (notre version) + Footer branché registry
> - Nos affaires éditorial, FAQ accordion, carrousel affaires
> - **Architecture** : `queries.ts`, `expertise-loader.ts`, `poles-registry.json` (+ miroir `site/src/data/`)
> - **Perf** : index articles léger, cache, `dynamic()` below-fold
> - Script `check-expertises-live.py`
>
> HEAD `main` ≈ `0a9a106`. Remote à jour.
>
> ### ⚠️ Points de friction à gérer ensemble
> 1. **Header** : tu allais le converger via `contenu/navigation.json` + boucle diff ; sur `main` il y a déjà un méga-menu « editorial ». À **reconciler** (pas écraser à l’aveugle) — soit brancher ton nav JSON dans le Header actuel, soit reprendre la convergence en déclarant nos écarts dans `deviations.json`.
> 2. **Taxonomie** : `poles-registry.json` (menu / objets form / heroes) vs `navigation.json` (harvest). Une seule source de vérité à terme — proposition : registry = produit ; navigation.json = raw harvest.
> 3. **Worktree** `claude/wix-nextjs-migration-strategy-a31825` : dirty, ne pas merger sans diff vs `main`.
> 4. Supabase « contenu » : **pas** lancé cette session ; table `demandes` déjà OK, test prod à faire.
>
> ### Docs
> `docs/14-etat.md` · ce fichier · `JOURNAL.md` · `docs/13-workflow-pixel-perfect.md` · `AGENTS.md`.
>
> Objectif : **garder ta boucle de fidélité** + **ne pas perdre** les gains UX de la nuit. Nicolas tranche si conflit design.

---

## Carte des deux rails

| Rail | Branche / endroit | Statut |
|------|-------------------|--------|
| Fidélité Wix (Fable) | `claude/wix-nextjs-migration-strategy-a31825` + worktree | Phases 0–3 sur remote ; Phase 4 Header **WIP** worktree |
| UX + archi + perf (session soir) | `main` | Mergé / poussé |

`main` est **en avance** de ~14 commits sur le tip Phase 3 de ta branche.

## Artefacts déjà là (ne pas régénérer pour rien)

- `contenu/reference/` — captures + specs + tokens
- `contenu/ricos/` × 422
- `contenu/navigation.json` (présent, **pas encore branché** dans le Header de `main`)
- `contenu/reference/poles-registry.json` + `site/src/data/poles-registry.json`
- `contenu/reference/deviations.json` — **élargi** cette nuit (form, hero, TOC, body, etc.)
- `scripts/visual/` — kit diff
- Polices `site/public/fonts/wix/` + `theme.wix.css` / `fonts.wix.css`

## Dev local

```bash
cd site && npm install && npm run dev
# Si CSS cassé : rm -rf .next && npm run dev
python3 scripts/sync-poles-registry.py   # après edit registry
```

## Prochaines priorités (Nicolas décide)

1. Reconcile Header (fidélité vs UX nuit) + re-run baseline propre  
2. Illustration Divorce  
3. Test formulaire → Supabase  
4. Reprise boucle Phase 4–5 (expertise template…)  
5. Backoffice Demandes / auth (plus tard)

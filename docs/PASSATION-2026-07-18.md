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
> - Suite prévue chez toi : **Phase 4 sans Header** → Footer → CTA/boutons → FAQ → cartes → bannières → puis templates (`docs/13-workflow-pixel-perfect.md`).
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
> 1. **Header = vérité produit, frozen** : le Header de `main` est **figé** (décision Nicolas 2026-07-18). Tu **ne le retouches pas**. Ses écarts vs live Wix = déviations assumées (`deviations.json` → `header-frozen-main`). Oublie le WIP Header du worktree. Reprendre Phase 4 sur **Footer / CTA / FAQ / PostCard / etc.**
> 2. **Taxonomie** : `poles-registry.json` (menu / objets form / heroes) vs `navigation.json` (harvest). Une seule source de vérité à terme — proposition : registry = produit ; navigation.json = raw harvest.
> 3. **Worktree** `claude/wix-nextjs-migration-strategy-a31825` : dirty, ne pas merger sans diff vs `main` (et **ne pas** re-merger un Header alternatif).
> 4. Supabase « contenu » : **pas** lancé cette session ; table `demandes` déjà OK, test prod à faire.
>
> ### Docs
> `docs/14-etat.md` · ce fichier · `JOURNAL.md` · `docs/13-workflow-pixel-perfect.md` · `AGENTS.md` · `docs/05-decisions.md`.
>
> Objectif : **garder ta boucle de fidélité** à partir des briques post-Header + **ne pas perdre** les gains UX de la nuit. Header = hors scope.

---

## Carte des deux rails

| Rail | Branche / endroit | Statut |
|------|-------------------|--------|
| Fidélité Wix (Fable) | `claude/wix-nextjs-migration-strategy-a31825` + worktree | Phases 0–3 sur remote ; Phase 4 = **Footer+** (Header frozen sur `main`) |
| UX + archi + perf (session soir) | `main` | Mergé / poussé ; Header = vérité produit |

`main` est **en avance** de ~14 commits sur le tip Phase 3 de ta branche.

## Artefacts déjà là (ne pas régénérer pour rien)

- `contenu/reference/` — captures + specs + tokens
- `contenu/ricos/` × 422
- `contenu/navigation.json` (présent ; Header de `main` = **frozen**, branché sur `poles-registry.json` — ne pas forcer `navigation.json` dans le Header)
- `contenu/reference/poles-registry.json` + `site/src/data/poles-registry.json`
- `contenu/reference/deviations.json` — dont **`header-frozen-main`**
- `scripts/visual/` — kit diff
- Polices `site/public/fonts/wix/` + `theme.wix.css` / `fonts.wix.css`

## Dev local

```bash
cd site && npm install && npm run dev
# Si CSS cassé : rm -rf .next && npm run dev
python3 scripts/sync-poles-registry.py   # après edit registry
```

## Prochaines priorités (Nicolas décide)

1. Reprise Phase 4 **sans Header** (Footer → CTA → FAQ → PostCard / cartes…) + baseline SEO propre  
2. Illustration Divorce  
3. Test formulaire → Supabase  
4. Suite boucle Phase 4–5 (expertise template…)  
5. Backoffice Demandes / auth (plus tard)

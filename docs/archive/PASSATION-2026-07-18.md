# Passation — 2026-07-18 (soir)

> ⛔ **ARCHIVE — ne décrit PAS le code actuel.**
> État courant : [`../etat/etat.md`](../etat/etat.md) · Architecture : [`../socle/architecture-contenu.md`](../socle/architecture-contenu.md) · Changements : [`/CHANGELOG.md`](../../CHANGELOG.md)

_Pour le prochain agent. Lis tout avant de coder. **Ne démarre pas C5 sans feu vert Nicolas.**_

Photo matin (pré-C0, 0 row / sans auth) → [`archive/PASSATION-2026-07-18-matin-pre-C0.md`](archive/PASSATION-2026-07-18-matin-pre-C0.md).

---

## État au 18/07 soir

| Rail | Statut |
|------|--------|
| **C0–C4** | ✅ Mergés sur `main` (PR #7 C0–C3, PR #8 C4) |
| **C5** | 🔜 **Priorité produit** — lecture publique Supabase + publish + covers Storage |
| Pixel Phases 0–3 | Conservé (`contenu/reference/`, `scripts/visual/`, Ricos, fonts) |
| Pixel Phases 4–6 | **EN PAUSE** — ne pas relancer sauf demande explicite |
| Footer | ✅ Mergé PR #6 |
| Header | **Figé** — ne pas toucher |
| Expertises | Hors pixel (écarts dans `deviations.json`) |
| UI public | Canon **`AffaireCard`** + **`SiteCta`** ([`16-composants-ui.md`](16-composants-ui.md)) |

### Dual-run C4 (réalité)

- **Site public** (`/post/...`, `/blog`) = encore **JSON git** (`content.ts` / `queries.ts`)
- **Admin** (`site/src/app/admin/`) = lit DB en priorité, **écrit** en DB (magic link)
- RLS = **authenticated only** — pas d’anon yet
- Bascule lecture publique = **C5** (ne pas implémenter dans un clean docs)

### Pages backlog (fait aujourd’hui)

Médias, hub Ressources, 3 hubs pôles, Défense des élus, redirects blog — ✅.  
Reste : C5, recherche / simulateurs, polish UI au fil de l’eau.

---

## Message prêt à coller (Nicolas → agent)

> Salut — état soir 18/07.
>
> **C0–C4 faits.** Next = **C5** (site public lit Supabase + revalidate + covers Storage + tranché Ricos/body).
>
> Pixel Phases 4–6 = **pause**. Header figé. Footer déjà mergé. UI = `AffaireCard` + `SiteCta`.
>
> Admin réel = `site/src/app/admin/` (pas le dossier `admin/` placeholder).
>
> Docs : `docs/14-etat.md` · ce fichier · `docs/16-composants-ui.md` · `docs/11-stack-technique.md`.

---

## Contraintes produit inchangées

- Slugs `/post/...` **intouchables**
- Une FAQ unifiée ; registry pôles = vérité menu/objets form
- Peu de gabarits, beaucoup de données (`AGENTS.md`, `docs/09-architecture-site.md`)
- Cible admin domaine : `admin.jplouton-avocat.fr` — V1 = Demandes + Blog
- Ne pas inventer un type de page sans maj `09`
- Ne pas committer CSV PII / secrets / `.mcp.json`

---

## Reprise

Branche fraîche depuis `main`.  
Quand tu repartes produit : **C5**, pas Phase 4 pixel.

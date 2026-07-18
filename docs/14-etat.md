# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (Médias + hub Ressources)_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).
Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).
Audit santé : [`15-audit-sante.md`](15-audit-sante.md).

---

## ⚡ Pivot 2026-07-18 (matin)

- **Arrêt** de la priorité « copie fidèle / pixel-perfect » Wix.
- UI polie **au fil de l’eau** (Nicolas + Cursor).
- **Priorité absolue** : canalisations **contenu ↔ CMS / Supabase**.
- Header figé ; Phases 4–6 pixel en pause.

---

## 🟢 En ligne maintenant

- **Site en production sur Vercel** — build au vert, pages générées.
  URL : <https://plouton-rewolf-s-projects.vercel.app>
  🔒 Protégé par **login Vercel + `noindex`** → invisible pour le public et Google.
- **Base Supabase** (projet `Plouton`) — tables **`demandes`** + **`posts`** (RLS) + buckets + auth.
- **Clés Supabase** sur Vercel (Production + Preview).
- **Déploiement auto** : push / merge `main` → redéploie.
- **PR #7** (C0–C3) mergée sur `main` · **C4** = branche `feat/canalisations-c4`

## ✅ Fait — contenu & site (socle)

- **422 articles**, 17 catégories, tags, **6 membres** d'équipe, **FAQ unifiée**
- **14 pages expertises** (3 pôles) + pages cabinet
- `/blog` + catégories ; **161 redirections 301** ; médias rapatriés
- Gabarit article `/post/{slug}` (Ricos) + SEO titres/metas live
- Backoffice **blog** + **demandes** (`/admin`, auth)

## ✅ Fait — canalisations C0–C4

| Phase | Statut | Quoi |
|-------|--------|------|
| **C0** | ✅ | Formulaire → `demandes` |
| **C1** | ✅ | PJ → bucket `pieces-jointes` |
| **C2** | ✅ | Magic link + `/admin/demandes` |
| **C3** | ✅ | Resend + import CSV Wix (~752 Archivé) |
| **C4** | ✅ MVP | Table `posts` + seed **422** + `saveArticle` DB · dual-run public JSON |

## 🔧 Dual-run C4 (important)

- **Site public** (`/post/...`, `/blog`) = encore **JSON git**
- **Admin** = lit DB en priorité, **écrit** en DB (brouillon sans redeploy)
- Bascule lecture publique = **C5**

## ⚠ Réalité pages publiques (audit 2026-07-18 — hors articles)

**Verdict :** le socle tourne, mais **ce n’est pas un site fini** pour remplacer Wix.

Trous majeurs encore ouverts :
1. Page **Défense des élus** absente (existe sur le live)
2. **3 hubs de pôles** → 404 (JSON déjà capturé)
3. **Simulateurs divorce** + **recherche** = morts / non branchés
4. Redirects vers des URLs Next inexistantes (`/nos-affaires/categories/…`)
5. Polish UI « site fini » encore loin (pixel en pause, pages listes pauvres)
6. **C5** publish live pas là (public = encore JSON git)

Gagné : 14 expertises, 422 posts, formulaires/admin, légales, Header figé, **Médias** + **hub Ressources**.

## 🔜 Backlog site public (ordre logique — 2026-07-18)

| # | Chantier | Statut |
|---|----------|--------|
| 1 | **Médias** — vraie grille (pas stub) + bon lien menu | ✅ |
| 2 | **Ressources** — hub thématique `/comprendre-le-droit` | ✅ |
| 3 | **3 hubs pôles** (JSON déjà là → pages) | à faire |
| 4 | Expertise **Défense des élus** + menu | à faire |
| 5 | **Redirects** cassés (`/nos-affaires/categories` → blog) | à faire |
| 6 | **C5** — publish live (site lit la DB) | à faire |
| 7 | Recherche + simulateurs divorce (ou paliers) | plus tard |
| 8 | Polish UI (accueil, listes, vernis) | au fil de l’eau |

## 🔧 À brancher côté Nicolas

1. **Supabase Auth → URL Configuration** (si pas déjà fait)
2. **Resend** : `RESEND_API_KEY` sur Vercel
3. Smoke test : login admin → éditer un article → vérifier statut en DB

## 🙋 Ce qui dépend de Nicolas

- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Feu vert Nomad / Cooked pour le jour J

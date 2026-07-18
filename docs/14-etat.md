# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (après-midi — C4 MVP)_

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

## ⏸ Chantier « copie fidèle » — en pause

- Phases **0–3** dans `main` (garder) · Phase 4–6 pixel : pause · Header frozen

## 🔧 À brancher côté Nicolas

1. **Supabase Auth → URL Configuration** (si pas déjà fait)
2. **Resend** : `RESEND_API_KEY` sur Vercel
3. Smoke test : login admin → éditer un article → vérifier statut en DB
4. Merger la PR C4

## 🔜 Suite

1. **C5** — Publish live (status + cache/ISR) ; covers → `medias` ; `/post/{slug}` lit la DB
2. Polish UI · Divorce · cutover

## 🙋 Ce qui dépend de Nicolas

- Merge PR C4 + smoke test admin
- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Feu vert Nomad / Cooked pour le jour J

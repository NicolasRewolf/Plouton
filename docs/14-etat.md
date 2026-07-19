# État d'avancement — Plouton

_Mis à jour : 2026-07-19 (lot 6 demandes + nav RDV)_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).
Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).
Audit santé : [`15-audit-sante.md`](15-audit-sante.md).
UI canonique : [`16-composants-ui.md`](16-composants-ui.md).

---

## ⚡ Pivot 2026-07-18

- **Arrêt** de la priorité « copie fidèle / pixel-perfect » Wix.
- UI polie **au fil de l’eau** (Nicolas + Cursor) — canon `AffaireCard` + `SiteCta`.
- **Priorité absolue** : canalisations **contenu ↔ CMS / Supabase** → **C5 en cours**.
- Header figé ; Footer ✅ mergé (PR #6) ; Phases 4–6 pixel **EN PAUSE**.

---

## 📋 Plan C5 (figé)

1. Lecture publique **serveur** via `SUPABASE_SECRET_KEY` (`status = published`) — **pas** de RLS anon en V1.
2. Si pas de ligne DB → **fallback JSON** git (dual-run sûr).
3. Corps : si l’article DB a un corps **édité** (différent du JSON seed) → `bodyHtml` / `body` ; sinon **Ricos** fichier git (les 422 restent fidèles).
4. Au publish → `revalidatePath` / `revalidateTag` (article, listes, sitemap).
5. Admin liste = **DB** (publiés + brouillons).
6. Covers Storage = **C5.1** (reporté) si pas branché dans cette PR.

---

## 🟢 En ligne maintenant

- **Site en production sur Vercel** — build au vert, pages générées.
  URL : <https://plouton-rewolf-s-projects.vercel.app>
  🔒 Protégé par **login Vercel + `noindex`** → invisible pour le public et Google.
- **Base Supabase** (projet `Plouton`) — tables **`demandes`** + **`posts`** (RLS authenticated) + buckets + auth.
- **Clés Supabase** sur Vercel (Production + Preview).
- **Déploiement auto** : push / merge `main` → redéploie.
- **C0–C4 ✅ mergés** sur `main` (PR #7 C0–C3 · PR #8 C4)

## ✅ Fait — contenu & site (socle)

- **422 articles**, 17 catégories, tags, **6 membres** d'équipe, **FAQ unifiée**
- **15 pages expertises** (3 pôles, dont Défense des élus) + pages cabinet
- **3 hubs de pôles** (`/defense-penale`, `/indemnisation-des-victimes`, `/droit-des-contrats-et-des-personnes`)
- `/blog` + catégories ; **161 redirections 301** ; médias rapatriés
- Gabarit article `/post/{slug}` (Ricos) + SEO titres/metas live
- Backoffice **blog** + **demandes** dans `site/src/app/admin/` (magic link)
- **Médias** + **hub Ressources** + uniformité UI (PR #9–#11)

## ✅ Fait — canalisations C0–C5

| Phase | Statut | Quoi |
|-------|--------|------|
| **C0** | ✅ | Formulaire → `demandes` |
| **C1** | ✅ | PJ → bucket `pieces-jointes` |
| **C2** | ✅ | Magic link + `/admin/demandes` |
| **C3** | ✅ | Resend + import CSV Wix (~752 Archivé) |
| **C4** | ✅ MVP | Table `posts` + seed **422** + `saveArticle` DB |
| **C5** | ✅ | Public lit DB (secret) + revalidate · covers = **C5.1** |
| **Admin UX** | ✅ | TipTap (barre fixe) + shell dashboard |

## 🔧 Dual-run C5

- **Site public** = DB `published` en priorité, **fallback JSON** si row absente
- **Corps** = Ricos git tant que le corps DB = seed ; sinon `bodyHtml` TipTap / `body`
- **Admin** = TipTap + liste DB · publish → revalidate
- **Pas** de RLS anon (lecture via `SUPABASE_SECRET_KEY` serveur)

## ⚠ Réalité pages publiques (hors articles)

**Verdict :** le socle tourne, mais **ce n’est pas un site fini** pour remplacer Wix.

Trous majeurs encore ouverts :
1. **Simulateurs divorce** + **recherche** = morts / non branchés
2. Polish UI « site fini » encore loin (pixel en pause)
3. **C5.1** covers Storage (images articles) pas encore branché

Gagné : 15 expertises, 3 hubs pôles, 422 posts, formulaires/admin, légales, Header figé, Footer, **3 hubs contenus filtrables** (Affaires / Médias / Ressources), uniformité cartes/CTA, **publish live C5**.

## 🔜 Backlog site public (ordre logique)

| # | Chantier | Statut |
|---|----------|--------|
| 1 | **Médias** — `/medias` + chips filtres | ✅ |
| 2 | **Ressources** — hub + grille filtrable | ✅ |
| 3 | **3 hubs pôles** | ✅ |
| 4 | Expertise **Défense des élus** + menu | ✅ |
| 5 | **Redirects** — `/blog` → hubs (plus de fourre-tout) | ✅ |
| 6 | **C5** — site public lit Supabase + publish live | ✅ |
| 6a | **Admin** — TipTap (barre fixe Wix) + dashboard | ✅ |
| 6b | **C5.1** — covers / bucket `medias` | à faire |
| 7 | Recherche + simulateurs divorce (ou paliers) | plus tard |
| 8 | Polish UI (accueil, listes, vernis) | au fil de l’eau |

## 🔧 À brancher côté Nicolas

1. **Supabase Auth → URL Configuration** (si pas déjà fait)
2. **Resend** : `RESEND_API_KEY` sur Vercel
3. Smoke test C5 : admin → éditer + publier → page `/post/...` à jour **sans** redeploy
4. Vérifier seed **422** toujours en base (sinon `python3 scripts/seed-posts.py`)

## 🙋 Ce qui dépend de Nicolas

- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Feu vert Nomad / Cooked pour le jour J

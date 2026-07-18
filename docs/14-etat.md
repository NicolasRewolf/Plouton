# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (soir — clean pré-C5)_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).
Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).
Audit santé : [`15-audit-sante.md`](15-audit-sante.md).
UI canonique : [`16-composants-ui.md`](16-composants-ui.md).

---

## ⚡ Pivot 2026-07-18

- **Arrêt** de la priorité « copie fidèle / pixel-perfect » Wix.
- UI polie **au fil de l’eau** (Nicolas + Cursor) — canon `AffaireCard` + `SiteCta`.
- **Priorité absolue** : canalisations **contenu ↔ CMS / Supabase** → **next = C5**.
- Header figé ; Footer ✅ mergé (PR #6) ; Phases 4–6 pixel **EN PAUSE**.

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

## ⚠ Réalité pages publiques (hors articles)

**Verdict :** le socle tourne, mais **ce n’est pas un site fini** pour remplacer Wix.

Trous majeurs encore ouverts :
1. **Simulateurs divorce** + **recherche** = morts / non branchés
2. Polish UI « site fini » encore loin (pixel en pause)
3. **C5** publish live pas là (public = encore JSON git)

Gagné : 15 expertises, 3 hubs pôles, 422 posts, formulaires/admin, légales, Header figé, Footer, **Médias** + **hub Ressources**, uniformité cartes/CTA.

## 🔜 Backlog site public (ordre logique — soir 18/07)

| # | Chantier | Statut |
|---|----------|--------|
| 1 | **Médias** — vraie grille + bon lien menu | ✅ |
| 2 | **Ressources** — hub thématique `/comprendre-le-droit` | ✅ |
| 3 | **3 hubs pôles** | ✅ |
| 4 | Expertise **Défense des élus** + menu | ✅ |
| 5 | **Redirects** blog | ✅ |
| 6 | **C5** — **priorité critique** : site public lit Supabase + publish + covers | à faire (gros) |
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

# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (midi — canalisations C0–C3)_

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
  C'est **voulu** tant que le vrai domaine n'est pas branché.
- **Base Supabase** (projet `Plouton`) — table **`demandes`** + buckets + auth avocats (branche canalisations).
- **Clés Supabase** sur Vercel (Production + Preview).
- **Déploiement auto** : push / merge `main` → redéploie.
- **PR canalisations** : <https://github.com/NicolasRewolf/Plouton/pull/7> (C0–C3)

## ✅ Fait — contenu & site (socle)

- **422 articles**, 17 catégories, tags, **6 membres** d'équipe, **FAQ unifiée**
- **14 pages expertises** (3 pôles) + pages cabinet
- `/blog` + catégories ; **161 redirections 301** ; médias rapatriés
- Gabarit article `/post/{slug}` (Ricos) + SEO titres/metas live
- Backoffice **blog** en POC (`/admin`) — Demandes = boîte réelle (C2)

## ✅ Fait — canalisations C0–C3 (branche `claude/canalisations-c0`)

| Phase | Statut | Quoi |
|-------|--------|------|
| **C0** | ✅ | Formulaire → `demandes` (env alignés) |
| **C1** | ✅ | PJ multipart → bucket `pieces-jointes` |
| **C2** | ✅ | Magic link + `/admin/demandes` (liste/détail/statut/notes/PJ) |
| **C3a** | ✅ code | Resend → `accueil@…` (clé à poser sur Vercel) |
| **C3b** | ✅ | Import CSV Wix **752** rows (statut `Archivé`, notes `Import Wix C3`) |

## ✅ Fait — session UX / archi sur `main`

- Formulaire RDV + intake serveur · expertises · Header **frozen** · pages légales · liens pointillés · CTA mix X
- Registry pôles · perf · passation

## ⏸ Chantier « copie fidèle » — en pause

- Phases **0–3** dans `main` (garder) · Phase 4–6 pixel : pause · Header frozen

## 🔧 À brancher côté Nicolas (2 min)

1. **Supabase Auth → URL Configuration** : Site URL + Redirect URLs (Preview + `localhost:3000`)
2. **Vercel** : `NEXT_PUBLIC_SITE_ORIGIN` (URL Preview/prod, sans slash final)
3. **Resend** : créer clé → `RESEND_API_KEY` sur Vercel (+ optionnel `RESEND_FROM` une fois le domaine branché)
4. **Merger la PR #7**

## 🔜 Suite canalisations

5. **C4** — Table `posts` + seed 422 slugs + écriture admin DB  
6. **C5** — Publish live sans commit + covers Storage  
7. Polish UI · Divorce · cutover

## 🙋 Ce qui dépend de Nicolas

- Actions dashboard ci-dessus + merge PR
- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Feu vert Nomad / Cooked pour le jour J

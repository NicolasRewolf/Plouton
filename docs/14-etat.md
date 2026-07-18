# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (matin — pivot)_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).
Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).
Audit santé : [`15-audit-sante.md`](15-audit-sante.md).

---

## ⚡ Pivot 2026-07-18 (matin)

- **Arrêt** de la priorité « copie fidèle / pixel-perfect » Wix.
- UI polie **au fil de l’eau** (Nicolas + Cursor).
- **Priorité absolue** : canalisations **contenu ↔ CMS / Supabase**.
- Fable : stop Phase 4–5 pixel ; Footer branche = en attente OK ; Header figé ; expertises hors pixel.

---

## 🟢 En ligne maintenant

- **Site en production sur Vercel** — build au vert, pages générées.
  URL : <https://plouton-rewolf-s-projects.vercel.app>
  🔒 Protégé par **login Vercel + `noindex`** → invisible pour le public et Google.
  C'est **voulu** tant que le vrai domaine n'est pas branché.
- **Base Supabase** (projet `Plouton`) — table **`demandes`** créée (RLS + index).
  Buckets `pieces-jointes` (privé) + `medias` (public).
- **Clés Supabase** sur Vercel (Production + Preview).
- **Déploiement auto** : push / merge `main` → redéploie.

## ✅ Fait — contenu & site (socle)

- **422 articles**, 17 catégories, tags, **6 membres** d'équipe, **FAQ unifiée**
- **14 pages expertises** (3 pôles) + pages cabinet
- `/blog` + catégories ; **161 redirections 301** ; médias rapatriés
- Gabarit article `/post/{slug}` (Ricos) + SEO titres/metas live
- Backoffice **blog** en POC (`/admin`)

## ✅ Fait — session 2026-07-18 (UX + archi + perf) sur `main`

- Formulaire RDV refait + **intake validé côté serveur**
- Expertises : hero, TOC, corps mis en page, liens internes, **13/14 illustrations** (manque Divorce)
- Accueil : photo équipe + section expertises (flèches)
- Header méga-menu (**frozen** 2026-07-18) ; Nos affaires éditorial ; FAQ + carrousel
- **Registry pôles** + loader expertise + queries unifiées
- **Perf** : index léger, cache, lazy below-fold
- Script `check-expertises-live.py`
- Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md)

## ⏸ Chantier Fable « copie fidèle » — en pause

- Phases **0–3** déjà dans `main` (socle conservé : polices, Ricos, harvest)
- Phase 4–5 pixel / `diff.mjs` / templates Wix : **plus prioritaires**
- Footer déjà poussé sur branche Fable : **laisser en attente**
- **Header frozen** : vérité produit sur `main` ; Fable ne le retouche pas
- Expertises : hors pixel (déjà noté)

## 🔧 Câblé, à finir de valider

- **Demandes** : table + code + buckets — **0 row prouvée** en prod (E2E à faire = C0)
- Contenu public = **100 % JSON git** (pas de tables `posts` / FAQ / expertises)
- PJ formulaire : noms seulement — bucket **vide**
- Email `accueil@…` : **pas branché** · Auth admin : **absente**

## 🔜 Canalisations C0–C5 (priorité)

1. **C0** — 1 `demande` réelle en Preview/Prod (env alignés, pas de 503)
2. **C1** — Upload PJ → bucket `pieces-jointes` + `fichiers[]`
3. **C2** — Auth + UI boîte Demandes (statuts, notes, candidatures)
4. **C3** — Mail alerte + import CSV historique (hors git)
5. **C4** — Table `posts` + seed 422 slugs + écriture admin DB
6. **C5** — Publish live sans commit + covers Storage
7. Polish UI au fil de l’eau · Divorce · cutover (après canalisations)

## 🙋 Ce qui dépend de Nicolas

- Direction / validation des canalisations contenu ↔ Supabase
- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Feu vert Nomad / Cooked pour le jour J

# État d'avancement — Plouton

_Mis à jour : 2026-07-18 (soir)_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).
Passation agents : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).
Audit santé : [`15-audit-sante.md`](15-audit-sante.md).

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

## 🔁 Chantier Fable « copie fidèle » (parallèle)

- Phases **0–3** déjà dans l’historique `main` (vérité terrain, polices, Ricos, harvest)
- Suite prévue : Phase 4 **sans Header** (Footer → CTA → FAQ → cartes…) puis templates (`docs/13-workflow-pixel-perfect.md`)
- **Header frozen** (décision 2026-07-18) : Header de `main` = vérité produit ; écarts vs Wix = déviations (`header-frozen-main`) ; Fable ne le retouche pas
- `contenu/navigation.json` = harvest brut ; le Header frozen reste sur `poles-registry.json`

## 🔧 Câblé, à finir de valider

- **Formulaire → Supabase** : table + clés OK — **test bout-en-bout prod** encore à faire
- Email d'alerte → `accueil@jplouton-avocat.fr` : **pas branché**

## 🔜 Prochaines étapes (ordre suggéré)

1. Phase 4 fidélité **sans Header** (Footer / CTA / FAQ / PostCard…) + baseline SEO propre
2. Illustration **Divorce** + polish si besoin
3. Test formulaire → `demandes`
4. Suite boucle fidélité (expertise → hubs → article → blog → accueil)
5. Backoffice **Demandes** + auth · PJ réelles · mail alerte
6. Cutover domaine · Cooked · Nomad (jour J)

## 🙋 Ce qui dépend de Nicolas

- Illustration Divorce (si dispo)
- Forfaits **Pro** Vercel + Supabase avant cutover
- Merge PR si garde-fou GitHub
- Feu vert Nomad / Cooked pour le jour J

# Stack technique — balisé

Où vit quoi. Pour Nicolas + pour l’IA.

---

## État actuel (2026-07-18) — déployé ✅

- **Vercel** : projet `plouton` lié à GitHub, Root Directory `site/`, prod **au vert**
  (<https://plouton-rewolf-s-projects.vercel.app>, protégée par login + `noindex`).
  Forfait actuel = **Hobby** → passer en **Pro** avant le cutover (usage commercial).
- **Supabase** : projet `Plouton` (ref `iofhcxwgqvorpmaexjwb`), tables `demandes` + `posts`
  (RLS), buckets `pieces-jointes` / `medias`. Forfait actuel = **Free** →
  passer en **Pro** avant la prod réelle (pas de pause, backups, 100 Go fichiers).
- Contenu **public** = encore **JSON dans `contenu/`** (dual-run C4) ; admin blog écrit dans `posts`.
  Lecture publique DB = **C5**.
- Vue complète : [`14-etat.md`](14-etat.md) · passation : [`PASSATION-2026-07-18.md`](PASSATION-2026-07-18.md).

---

## Forfaits — quoi prendre (décision)

### Vercel
| | |
|--|--|
| **À prendre** | **Pro** (~20 $/mois / siège qui déploie) |
| **Pas besoin** | Enterprise / forfaits “avancés” custom |
| **Pourquoi Pro** | Site **client / cabinet** = usage commercial → Hobby (gratuit) **interdit** par Vercel. Pro suffit largement pour ce trafic. |

### Supabase
| | |
|--|--|
| **À prendre** | **Pro** (~25 $/mois) pour la **prod** |
| **Pas besoin** | Team (~599 $) ni Enterprise au départ |
| **Pourquoi Pro** | Free = projet **mis en pause** après 1 semaine d’inactivité, 1 Go fichiers max, pas sérieux pour un cabinet avec PJ. Pro = 100 Go fichiers, backups, pas de pause. |
| **Free OK pour** | Bricoler / proto 2 jours — **pas** pour le site live |

### Budget ordre de grandeur (prod)
~**45–50 €/mois** Vercel Pro + Supabase Pro (hors dépassements improbables au début).  
Cooked a déjà sa propre infra (à part).

---

## Vue d’ensemble

```
                    ┌─────────────────────┐
  Visiteurs ──────► │  site/   (Next.js)  │──► Vercel
                    │  www.jplouton…      │
                    └──────────┬──────────┘
                               │ lit / écrit
                    ┌──────────▼──────────┐
                    │     Supabase        │  ← mémoire (articles, FAQ,
                    │  (base + fichiers)  │     demandes, équipe…)
                    └──────────▲──────────┘
                               │
  Équipe ─────────► │  admin/  (Next.js)  │──► Vercel
                    │  admin.jplouton…    │     (même projet ou 2 apps
                    └─────────────────────┘      dans le monorepo)

  Mesure (toi) ───► Cooked (repo séparé) ──► même idée Supabase
                    tracker sur le site public
```

---

## Pièces

| Pièce | Rôle | Outil |
|-------|------|--------|
| **Site public** | Ce que voient les gens | Next.js dans `site/` → **Vercel** |
| **Backoffice** | Blog + Demandes | Next.js dans `admin/` → **Vercel** · `admin.jplouton-avocat.fr` |
| **Mémoire** | Articles, FAQ, formulaires, fichiers joints | **Supabase** (Postgres + Storage) |
| **Mesure** | Visites, UTM, conversions | **Cooked** (déjà existant) |
| **Pubs** | Optimisation Google Ads | Tag Nomad (en plus de Cooked) |
| **Mails** | Alerte nouvelle demande | → `accueil@jplouton-avocat.fr` |
| **Domaine** | DNS | aujourd’hui Wix → demain Vercel |

---

## Supabase — à créer (oui)

Projet neuf (ou espace dédié) pour **Plouton produit** :

- Tables : `posts`, `categories`, `faq`, `demandes`, `equipe`, `expertises`…  
- **Storage** : images blog + **pièces jointes** formulaires  
- Auth : comptes avocats + Nicolas (accès `admin`)

**Pas** mélanger avec la base Cooked (Cooked = mesure ; ici = contenu & leads).  
Ils peuvent **se parler** (webhook form → Cooked comme aujourd’hui).

---

## Vercel — à brancher (oui)

- Déploiement auto depuis GitHub `NicolasRewolf/Plouton`  
- Préprod (URL vercel) pour tester **avant** de toucher le vrai domaine  
- Jour J : DNS `www` + `admin` vers Vercel  

---

## Autres choses (checklist infra)

| Item | Quand |
|------|--------|
| Repo GitHub | ✅ déjà |
| Projet Supabase | ✅ créé (table `demandes` en prod) |
| Projet Vercel + lien GitHub | ✅ fait (prod au vert) |
| DNS `admin.` | au moment de mettre l’admin en vrai |
| DNS `www` cutover | **jour J** (après checklist migration) |
| Resend / envoi mail (accueil@) | ✅ code C3 — poser `RESEND_API_KEY` (+ `RESEND_FROM` domaine) |
| Cooked tracker sur le nouveau site | avant ou au cutover |
| Tag conversion Nomad | avant cutover Ads |
| Wix | reste live jusqu’au feu vert |

---

## Wix Sandbox — **ne pas activer** pour nous

Le Sandbox Wix = **copie de test** des collections **sur Wix** (éditer sans publier, puis sync Live).

Utile si on **continuait à construire dans Wix**.

**Notre migration** lit le contenu **Live** via l’API (déjà OK) → Supabase.  
Activer le Sandbox :
- n’aide pas l’export  
- peut créer de la confusion (2 versions, sync, contenu sandbox effacé après 7 j si on désactive)

**Décision :** laisser **Sandbox OFF**. On ne touche pas à ça.

---

## Ordre technique recommandé

1. Doc / archi (en cours)  
2. Créer **Supabase** + schéma minimal (demandes + posts + faq)  
3. Squelette **admin** sur Vercel (préprod)  
4. Import CSV demandes + import FAQ unifiée  
5. Import blog (script)  
6. Squelette **site** (gabarits)  
7. Cutover DNS + Cooked + Nomad  

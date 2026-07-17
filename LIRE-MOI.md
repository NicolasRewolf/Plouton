# Plouton — le plan de la maison

Site public + backoffice du Cabinet Plouton.  
**Cooked** (mesure) reste dans un autre repo.

---

## Carte du repo

| Dossier | Rôle | Devient demain |
|---------|------|----------------|
| **`site/`** | Site Next.js (visiteurs) | Vercel `www` |
| **`admin/`** | Backoffice (placeholder) | Vercel `admin.` |
| **`contenu/`** | Contenu produit + sources Wix | Tables Supabase + Storage |
| **`base/`** | Schémas / migrations (placeholder) | Projet Supabase |
| **`scripts/`** | Imports & scrapers migration | Gardés pour rejouabilité |
| **`docs/`** | Décisions & architecture | Toujours |

Fichiers racine : `LIRE-MOI.md` (toi) · `JOURNAL.md` (livraisons) · `AGENTS.md` (IA) · `README.md` (GitHub)

---

## Démarrer le POC

```bash
cd site && npm install && npm run dev
```

→ http://127.0.0.1:3000

---

## Par où lire ?

1. [`JOURNAL.md`](./JOURNAL.md) — dernière livraison  
2. [`docs/00-INDEX.md`](./docs/00-INDEX.md) — index docs  
3. [`docs/09-architecture-site.md`](./docs/09-architecture-site.md) — gabarits + CMS  
4. [`docs/11-stack-technique.md`](./docs/11-stack-technique.md) — Supabase / Vercel  
5. [`contenu/LIRE-MOI.md`](./contenu/LIRE-MOI.md) — organisation contenu  

---

## État

POC local **sans cloud payant** : contenu en fichiers JSON.  
Prochaine étape infra : Supabase + Vercel Pro (quand le design est validé).

Site live actuel : https://www.jplouton-avocat.fr

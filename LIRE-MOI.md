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
| **`base/`** / **`supabase/`** | Migrations SQL | Projet Supabase |
| **`scripts/`** | Imports & scrapers migration | Gardés pour rejouabilité |
| **`docs/`** | Décisions & architecture | Toujours |

Fichiers racine : `LIRE-MOI.md` (toi) · `JOURNAL.md` (livraisons) · `AGENTS.md` (IA) · `README.md` (GitHub)

---

## Démarrer en local

```bash
cd site && npm install && npm run dev
```

→ http://127.0.0.1:3000

---

## Par où lire ?

1. [`docs/14-etat.md`](./docs/14-etat.md) — **où on en est**  
2. [`JOURNAL.md`](./JOURNAL.md) — dernières livraisons  
3. [`docs/PASSATION-2026-07-18.md`](./docs/PASSATION-2026-07-18.md) — reprise agent (Fable)  
4. [`docs/09-architecture-site.md`](./docs/09-architecture-site.md) — gabarits + CMS  
5. [`docs/11-stack-technique.md`](./docs/11-stack-technique.md) — Supabase / Vercel  
6. [`contenu/LIRE-MOI.md`](./contenu/LIRE-MOI.md) — organisation contenu  

---

## État (2026-07-18)

- Site **riche** en local + **preview Vercel** (login, noindex) — pas encore le vrai domaine
- Contenu = **fichiers JSON** (`contenu/`) ; demandes = table Supabase **prête**, test prod à valider
- Registry expertises : `contenu/reference/poles-registry.json`

Site live actuel (Wix) : https://www.jplouton-avocat.fr  
Preview : https://plouton-rewolf-s-projects.vercel.app

# site/

Site public Next.js (App Router) — preview Vercel + local.

```bash
npm install
npm run dev
# → http://127.0.0.1:3000
```

## Contenu (C5)

| Surface | Source |
|---------|--------|
| **Public** (`/post/...`, `/blog`…) | **Supabase** `posts` (clé secrète serveur) → fallback **JSON** `../contenu/` |
| **Corps article** | Ricos git si non réécrit ; sinon `bodyHtml` / `body` DB |
| **Admin** (`/admin`) | Lit/écrit **Supabase** (`posts`, `demandes`) — magic link |
| **Publish** | `revalidateTag('posts')` + chemins → visible sans redeploy |

Covers Storage = **C5.1**. Détail : `docs/14-etat.md` · `docs/05-decisions.md`.

## Code

```
src/
├── app/           ← routes (pages) + admin/
├── components/    ← UI (AffaireCard, SiteCta, …)
├── fonts/         ← Google Sans / Source Sans + Wix
└── lib/           ← content, queries, posts-db, posts-public, store, supabase
```

## Admin réel

`/admin` dans **cette** app = backoffice actuel (Demandes + Blog).  
Le dossier monorepo `admin/` reste un placeholder pour une future app dédiée.

Détail stack → `docs/11-stack-technique.md`.  
UI canon → `docs/16-composants-ui.md`.

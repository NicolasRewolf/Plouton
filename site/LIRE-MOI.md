# site/

Site public Next.js (App Router) — preview Vercel + local.

```bash
npm install
npm run dev
# → http://127.0.0.1:3000
```

## Contenu (dual-run C4)

| Surface | Source |
|---------|--------|
| **Public** (`/post/...`, `/blog`, expertises…) | Encore **JSON** `../contenu/` via `content.ts` / `queries.ts` |
| **Admin** (`/admin`) | Lit/écrit **Supabase** (`posts`, `demandes`) — magic link |

Bascule lecture publique = **C5**. Détail : `docs/14-etat.md`.

## Code

```
src/
├── app/           ← routes (pages) + admin/
├── components/    ← UI (AffaireCard, SiteCta, …)
├── fonts/         ← Google Sans / Source Sans + Wix
└── lib/           ← content, queries, seo, store, supabase
```

## Admin réel

`/admin` dans **cette** app = backoffice actuel (Demandes + Blog).  
Le dossier monorepo `admin/` reste un placeholder pour une future app dédiée.

Détail stack → `docs/11-stack-technique.md`.  
UI canon → `docs/16-composants-ui.md`.

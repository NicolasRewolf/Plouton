# site/

Site public Next.js (App Router) — POC local.

```bash
npm install
npm run dev
# → http://127.0.0.1:3000
```

## Contenu

Lu depuis `../contenu/` (fichiers JSON). Pas de Supabase pour l’instant.

## Code

```
src/
├── app/           ← routes (pages)
├── components/    ← UI réutilisable
├── fonts/         ← Google Sans / Source Sans
└── lib/           ← content.ts, seo, expertise-route
```

## Admin POC

`/admin` dans cette app = édition locale temporaire.  
Le vrai backoffice ira dans `/admin` monorepo + Supabase.

Détail stack → `docs/11-stack-technique.md`.

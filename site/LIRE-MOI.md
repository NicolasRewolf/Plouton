# Site public + admin POC (local)

## Lancer

```bash
cd site
npm install
npm run dev
```

Ouvre http://localhost:3000

| URL | Contenu |
|-----|---------|
| `/` | Homepage |
| `/defense-penale/droit-penal` | Page expertise (gabarit) |
| `/post/indemnisation-passager-accident-route` | Article blog |
| `/contact` | Contact / honoraires |
| `/admin` | Backoffice blog |

Données = fichiers dans `../contenu/` (pas de Supabase).

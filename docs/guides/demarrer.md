# Démarrer

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

```bash
cp site/.env.example site/.env.local   # puis renseigner (voir plus bas)
cd site
npm install
npm run dev                            # http://localhost:3000
```

## ⚠️ Le piège à connaître avant tout le reste

**Sans `SUPABASE_SECRET_KEY`, le site démarre sans le moindre avertissement — et
sert l'instantané Wix figé.**

`isSupabaseConfigured()` est simplement faux, tout retombe sur l'adapter
`SNAPSHOT`, et rien ne le signale. Tu verras 422 articles, des pages qui
s'affichent, un site qui a l'air normal. Mais les compteurs de vues seront à
zéro et toute modification faite en base sera invisible.

**Le témoin le plus rapide** : sur l'accueil, un compteur de vues non nul
signifie que Supabase répond. Tous à zéro = tu lis l'instantané.

## Les variables qui comptent

| Variable | Sans elle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` | Tout le site retombe sur l'instantané JSON (voir ci-dessus) |
| `ADMIN_EMAILS` | L'allowlist ne filtre personne — tout compte Auth existant entre |
| `CRON_SECRET` | La route de publication programmée répond 503 (échec **fermé**, voulu) |
| `RESEND_API_KEY` | Les notifications de nouvelle demande ne partent pas |

## Ensuite

- L'architecture en un document : [`../socle/architecture-contenu.md`](../socle/architecture-contenu.md)
- Les gardes à lancer avant de livrer : [`gardes.md`](gardes.md)
- Une migration de base : [`migrations-supabase.md`](migrations-supabase.md)

# Migrations Supabase

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

## La voie normale

La CLI est installée et le projet lié.

```bash
supabase db push          # applique ce qui manque
supabase migration list   # compare local et distant
```

**Convention de nommage : `000N_nom.sql`**, à respecter. Les migrations vivent
dans `supabase/migrations/`, nulle part ailleurs.

## ⚠️ Deux pièges

**1. Le MCP Supabase est cassé.** Son OAuth répond `Unrecognized client_id`, et
rien n'est réparable côté configuration. Ne pas le proposer comme solution. Pour
un DDL : la CLI, ou le SQL Editor du dashboard.

**2. L'historique a déjà divergé une fois.** Deux outils ont écrit dans la table
de suivi avec deux conventions (numérotée et horodatée). Si `db push` se plaint
de « Remote migration versions not found », **ne suis pas la commande de
réparation qu'il propose** : marquer les versions distantes comme `reverted`
sans rien marquer d'autre ferait rejouer toutes les migrations sur une base
pleine. L'ordre correct est `repair --status applied` **d'abord**, `reverted`
ensuite.

## Les tables

| Table | Contenu |
|---|---|
| `posts` | Les 422 articles — source de vérité du blog |
| `post_versions` | Instantanés avant chaque sauvegarde admin (avec `body_doc` depuis `0012`) |
| `demandes` | Formulaire de contact (~756 lignes, dont l'import Wix) |
| `faq` | FAQ unifiée, découpée par expertise |
| `authors` | Référentiel auteurs (signatures, E-E-A-T) |
| `categories` | Rubriques du blog (+ vue `category_post_counts`) |
| `content_singletons` | Contenus uniques — aujourd'hui `contact` |

**Défaut connu, non corrigé** : `authors`, `categories` et `content_singletons`
n'ont aucun trigger de mise à jour — leur `db_updated_at` ne bouge jamais.

## Ne jamais faire

Ne pas relancer `scripts/import-wix-blog.py` : il fait un `unlink()` sur tout
`contenu/articles/` avant de réimporter. Le lancer aujourd'hui écraserait l'état
courant avec un instantané périmé.

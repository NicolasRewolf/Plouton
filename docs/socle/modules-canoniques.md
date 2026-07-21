# Les modules canoniques

> Vérifié le 2026-07-21 contre `405a0b0`. Périmé ? → [`/CHANGELOG.md`](../../CHANGELOG.md)

Carte de `site/src/lib/`. Chaque ligne dit ce que le module **remplace** — c'est
ce qui empêche de recréer la duplication qu'on vient de retirer.

| Module | Rôle | Ce qu'il remplace |
|---|---|---|
| `content-source.ts` | Le seam : adapters `SUPABASE` / `SNAPSHOT` | La décision « d'où vient le contenu » retranchée dans ~10 modules |
| `posts-public.ts` | **La** précédence, une fois | 4 chaînes de repli divergentes |
| `supabase/admin.ts` | LE client serveur (clé secrète, contourne RLS) | **6 copies** verbatim |
| `require-admin.ts` | Auth des routes d'écriture + lecture JSON sûre | **5 copies** verbatim, dont aucune ne vérifiait `ADMIN_EMAILS` |
| `cms-collection.ts` | `defineCollection` / `defineKeyedCollection` | 4 enveloppes `unstable_cache` + 5 politiques de repli |
| `article-submission.ts` | Slug, statut, validation — client **et** serveur | 2 slugifications incompatibles, 2 défauts de rubrique |
| `expertise-content.ts` | Lecture du contenu d'expertise, en fonctions pures | 340 lignes d'heuristiques dans un composant React |
| `post-edit-loss.ts` | Mesure de perte de nœuds à la sauvegarde | Un gel par nom de balise qui figeait 53 articles sur 422 |
| `revalidate-posts.ts` | Invalidation, chemins d'expertise **dérivés** du registry | Une liste littérale de 9 chemins tenue à la main |

### Pourquoi `require-admin.ts` existe

Le proxy (`site/src/proxy.ts`) applique l'allowlist `ADMIN_EMAILS`, mais son
matcher est `/admin/:path*` : **il ne voit jamais `/api/*`**. Les routes
d'écriture doivent donc vérifier elles-mêmes — et elles écrivent avec la clé
secrète, sans RLS pour rattraper.

---

## ⛔ Morts — ne pas ressusciter

Si tu croises un de ces noms dans un vieux document ou un vieux commit, il
n'existe plus. Ce ne sont pas des oublis : chacun a été retiré pour une raison.

| Mort | Pourquoi |
|---|---|
| `src/lib/ricos/` (`render.tsx`, `types.ts`) | ~500 lignes, **zéro appelant**. Second encodage de la sémantique Ricos, jamais exécuté ni vérifié. |
| `src/lib/post-edit-guard*.ts` | Gel par nom de balise (`table`, `details`, `iframe`…) : figeait 12 % du corpus à tort. Remplacé par `post-edit-loss.ts`, qui **mesure** au lieu de pronostiquer. |
| `src/components/PostCard.tsx` | Wrapper déprécié → `AffaireCard`. |
| `content.ts` : `getRicos`, `getAuthor`, `getExpertiseCards`, `authorNamesBySlug` | Zéro appelant. |
| `posts-db.ts` : `getPostStatus` | Zéro appelant. |
| `forceRichEdit` | Contournement du gel supprimé. Remplacé par `confirmContentLoss`. |
| `resolvePostBodyMode`, `preferDbBody` | Reliquats du dual-run. La précédence est unique désormais. |
| `linkify(text, links)` dans `ExpertiseBody` | Les liens sont des **données** maintenant (`makeLinkResolver`). |

/**
 * La précédence — la règle seule, séparée de ses sources et du cache Next.
 *
 * « Supabase répond, sinon l'instantané. » La règle vivait déjà à un seul
 * endroit (`posts-public.ts`), mais elle y était soudée à deux choses qui
 * n'ont rien à voir avec elle : les adapters concrets, et `unstable_cache`.
 * Conséquence pratique — on ne pouvait pas l'exercer hors d'une requête Next,
 * donc elle n'avait aucune garde. C'était le module le moins vérifié du dépôt,
 * et celui dont l'en-tête documente deux incidents de production.
 *
 * Ici la règle reçoit ses sources en paramètre. Elle ne connaît que
 * l'interface `ContentSource` : deux adapters en production, des adapters de
 * papier dans la garde. C'est la même interface pour les deux — l'interface
 * est la surface de test.
 *
 * Ce module ne lit rien, n'écrit rien, ne met rien en cache. Il décide.
 *
 * Vérifié par `npm run check:precedence`.
 */

import type { Article, ArticleIndexItem } from "@/lib/content"
import type { AdminIndexItem, ContentSource } from "@/lib/content-source"

/**
 * Ce dont la règle a besoin pour trancher.
 *
 * `supabaseAnswers` est fourni par l'appelant plutôt que déduit ici : en
 * production c'est une sonde mémoïsée par requête (React `cache`), dans une
 * garde c'est une constante. La règle n'a pas à savoir laquelle.
 */
export interface Precedence {
  supabase: ContentSource
  snapshot: ContentSource
  /** Supabase est-il joignable ? Voir `decidePublishedArticle`. */
  supabaseAnswers(): Promise<boolean>
}

/**
 * Index public.
 *
 * `null` = source indisponible, donc repli. `[]` = réponse vide, donc `[]` :
 * une base joignable mais vide doit donner une liste vide, pas les 422 de
 * l'instantané. L'instantané répond toujours — d'où le `!`.
 */
export async function decidePublishedIndex(
  p: Precedence
): Promise<ArticleIndexItem[]> {
  return (await p.supabase.publishedIndex()) ?? (await p.snapshot.publishedIndex())!
}

/**
 * Article publié — le seul cas où la règle est contre-intuitive.
 *
 * Pour une liste, `null` est sans ambiguïté. Pour un article, `null` signifie
 * « absent » *ou* « source muette », et la réponse change le résultat : 404, ou
 * repli. On sonde donc la source avant de se replier : **quand Supabase
 * répond, son silence fait autorité**. Un article absent de la base est un 404,
 * même si `contenu/articles/` en contient encore une copie — sans quoi
 * supprimer un article ne le supprimerait jamais vraiment.
 *
 * Le slug est attendu déjà normalisé (NFC, décodé) : la normalisation est le
 * travail de l'appelant, pas de la règle.
 */
export async function decidePublishedArticle(
  p: Precedence,
  slug: string
): Promise<Article | null> {
  const fromDb = await p.supabase.publishedArticle(slug)
  if (fromDb) return fromDb

  if (await p.supabaseAnswers()) return null

  return p.snapshot.publishedArticle(slug)
}

/** Article tous statuts (admin). Même précédence, sans la sonde. */
export async function decideAnyArticle(
  p: Precedence,
  slug: string
): Promise<Article | null> {
  return (await p.supabase.anyArticle(slug)) ?? (await p.snapshot.anyArticle(slug))
}

/** Slugs publiés (`generateStaticParams`). */
export async function decidePublishedSlugs(p: Precedence): Promise<string[]> {
  return (await p.supabase.publishedSlugs()) ?? (await p.snapshot.publishedSlugs())!
}

/**
 * Liste admin.
 *
 * C'est la DISPONIBILITÉ de la source qui décide, pas le nombre de lignes
 * qu'elle renvoie : une base vide mais joignable doit donner une liste vide à
 * l'admin, sans quoi le tableau de bord affiche 422 articles pendant que le
 * site public n'en montre aucun — et masque la panne.
 */
export async function decideAdminList(p: Precedence): Promise<AdminIndexItem[]> {
  return (await p.supabase.adminIndex()) ?? (await p.snapshot.adminIndex())!
}

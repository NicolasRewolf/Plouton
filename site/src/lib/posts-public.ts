/**
 * Le contenu publié — une interface, une précédence.
 *
 * C'est ICI, et nulle part ailleurs, qu'on décide d'où vient un article.
 * La règle tient en une phrase : **Supabase répond, sinon l'instantané JSON**.
 * Les deux sources sont derrière le seam de `content-source.ts` ; ce module
 * ne connaît que la règle.
 *
 * Avant, cette règle était réécrite à chaque question posée — quatre fois ici,
 * trois dans les routes API, une sur la page auteur — et les versions
 * divergeaient. C'est ce qui produisait des symptômes sans rapport apparent :
 * un article créé en admin absent de la page de son auteur, une base vide
 * affichant 422 articles côté admin et zéro côté public.
 *
 * Corps : `body_doc` est la source, `body_html` son cache. Plus de Ricos au
 * runtime.
 */

import { unstable_cache } from "next/cache"
import { cache } from "react"
import { type Article, type ArticleIndexItem } from "@/lib/content"
import {
  SNAPSHOT,
  SUPABASE,
  withBodyFromFiles,
  type AdminIndexItem,
} from "@/lib/content-source"
import { getBodyDoc, getBodyHtmlCache } from "@/lib/content"
import { isSupabaseConfigured, POSTS_CACHE_TAG } from "@/lib/posts-db"
import { hasUsableHtml } from "@/lib/article-body"
import {
  decideAdminList,
  decideAnyArticle,
  decidePublishedArticle,
  decidePublishedIndex,
  decidePublishedSlugs,
  type Precedence,
} from "@/lib/posts-precedence"

export { POSTS_CACHE_TAG }
export type { AdminIndexItem }

function normSlug(slug: string): string {
  return decodeURIComponent(slug).normalize("NFC")
}

/**
 * Supabase répond-il ?
 *
 * Pour une LISTE, la question ne se pose pas : `null` signifie sans ambiguïté
 * « indisponible », un tableau vide étant une réponse valide. Pour un ARTICLE,
 * `null` est ambigu — absent, ou source muette ? — et la réponse change le
 * résultat : 404, ou repli sur l'instantané.
 *
 * On sonde donc, mais une seule fois par requête (`cache` de React), et
 * seulement quand un article manque à l'appel.
 */
const supabaseAnswers = cache(async function supabaseAnswers(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  return (await SUPABASE.adminIndex()) !== null
})

/**
 * Les sources réelles, câblées à la règle.
 *
 * La règle elle-même vit dans `posts-precedence.ts` et ne connaît que
 * l'interface : c'est ce qui permet à `check:precedence` de lui présenter des
 * adapters de papier et d'exercer les cas qu'on ne peut pas provoquer en
 * production (base joignable mais vide, base muette, article supprimé qui
 * traîne encore dans l'instantané).
 */
const SOURCES: Precedence = {
  supabase: SUPABASE,
  snapshot: SNAPSHOT,
  supabaseAnswers,
}

/**
 * HTML public : `body_html` de la source si un `body_doc` existe (c'est son
 * cache dérivé), puis le cache fichier, puis le HTML du seed.
 */
export function resolvePublicBodyHtml(article: Article): string {
  const hasDoc =
    (article.bodyDoc && typeof article.bodyDoc === "object") ||
    Boolean(getBodyDoc(article.slug))

  if (hasDoc && hasUsableHtml(article.bodyHtml)) return article.bodyHtml!.trim()

  const fromCache = getBodyHtmlCache(article.slug)
  if (fromCache?.trim()) return fromCache

  if (hasUsableHtml(article.bodyHtml)) return article.bodyHtml!.trim()
  return ""
}

/** `body_doc` résolu (source puis fichier). */
export function resolveBodyDoc(
  article: Article
): Record<string, unknown> | null {
  if (article.bodyDoc && typeof article.bodyDoc === "object")
    return article.bodyDoc
  return getBodyDoc(article.slug)
}

/* ────────────── la précédence, une fois pour toutes ────────────── */

async function fetchPublishedIndex(): Promise<ArticleIndexItem[]> {
  return decidePublishedIndex(SOURCES)
}

async function fetchPublishedArticle(slug: string): Promise<Article | null> {
  const raw = normSlug(slug)
  // La règle choisit la source ; la complétion du corps s'applique ensuite, à
  // l'article retenu quel qu'il soit.
  const found = await decidePublishedArticle(SOURCES, raw)
  return found ? withBodyFromFiles(found, raw) : null
}

/** Article tous statuts (admin / écriture). Même précédence. */
export async function resolveAnyArticle(slug: string): Promise<Article | null> {
  return decideAnyArticle(SOURCES, normSlug(slug))
}

/**
 * Fenêtre de sûreté sur le repli.
 *
 * Le résultat mis en cache inclut la source qui a répondu. Si Supabase est
 * muet une seule fois — un démarrage à froid suffit — c'est l'instantané JSON
 * qui est figé, et `unstable_cache` sans `revalidate` le garde indéfiniment,
 * y compris à travers les redéploiements (c'est documenté dans la doc Next
 * embarquée). Le site servirait alors le contenu Wix, compteurs de vues à
 * zéro, jusqu'à la prochaine publication d'article.
 *
 * Observé pour de vrai pendant le refactor : une capture a figé l'instantané,
 * la suivante Supabase, à code identique.
 *
 * Cinq minutes bornent la dérive sans rien coûter : une publication invalide
 * toujours le tag immédiatement, cette fenêtre ne sert qu'à guérir un repli
 * subi.
 */
const FALLBACK_HEAL_SECONDS = 300

const cachedPublishedIndex = unstable_cache(
  async () => fetchPublishedIndex(),
  ["c5-published-posts-index"],
  { tags: [POSTS_CACHE_TAG], revalidate: FALLBACK_HEAL_SECONDS }
)

const cachedPublishedArticle = unstable_cache(
  async (slug: string) => fetchPublishedArticle(slug),
  ["c5-published-post"],
  { tags: [POSTS_CACHE_TAG], revalidate: FALLBACK_HEAL_SECONDS }
)

export const resolvePublishedIndex = cache(
  async function resolvePublishedIndex(): Promise<ArticleIndexItem[]> {
    return cachedPublishedIndex()
  }
)

export const resolvePublishedArticle = cache(
  async function resolvePublishedArticle(slug: string): Promise<Article | null> {
    return cachedPublishedArticle(normSlug(slug))
  }
)

export async function resolvePublishedSlugs(): Promise<string[]> {
  return (await decidePublishedSlugs(SOURCES)).map(normSlug)
}

export async function resolveAdminArticleList(): Promise<AdminIndexItem[]> {
  return decideAdminList(SOURCES)
}

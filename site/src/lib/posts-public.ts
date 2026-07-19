/**
 * Couche publique C5 + bascule body_doc (brief #18 P1-D).
 *
 * Corps : body_doc (DB) → body_html cache. Plus de rendu Ricos runtime.
 * Index public : DB seule si Supabase joignable (plus de republication
 * de brouillons via articles-index.json sans status).
 */

import { unstable_cache } from "next/cache"
import { cache } from "react"
import {
  getArticle,
  getBodyDoc,
  getBodyHtmlCache,
  listArticleIndex,
  type Article,
  type ArticleIndexItem,
} from "@/lib/content"
import {
  getPublishedPost,
  listAdminPosts,
  listPublishedSlugs,
  POSTS_CACHE_TAG,
} from "@/lib/posts-db"
import {
  hasUsableArticleBody,
  hasUsableHtml,
} from "@/lib/article-body"
import { isPubliclyVisible, type PostStatus } from "@/lib/post-status"

export { POSTS_CACHE_TAG }

function normSlug(slug: string): string {
  return decodeURIComponent(slug).normalize("NFC")
}

/**
 * HTML public (P1-D, source unique body_doc) :
 * 1. bodyHtml DB si bodyDoc présent (cache dérivé à l'écriture / backfill)
 * 2. Cache fichier contenu/body-html/
 * 3. bodyHtml seed
 */
export function resolvePublicBodyHtml(article: Article): string {
  const hasDoc =
    (article.bodyDoc && typeof article.bodyDoc === "object") ||
    Boolean(getBodyDoc(article.slug))

  if (hasDoc && hasUsableHtml(article.bodyHtml))
    return article.bodyHtml!.trim()

  const fromCache = getBodyHtmlCache(article.slug)
  if (fromCache?.trim()) return fromCache

  if (hasUsableHtml(article.bodyHtml)) return article.bodyHtml!.trim()
  return ""
}

/** body_doc résolu (DB puis fichier). */
export function resolveBodyDoc(
  article: Article
): Record<string, unknown> | null {
  if (article.bodyDoc && typeof article.bodyDoc === "object")
    return article.bodyDoc
  return getBodyDoc(article.slug)
}

export type PostBodyMode = "html" | "blocks"

export function resolvePostBodyMode(article: Article): PostBodyMode {
  const html = resolvePublicBodyHtml(article)
  if (html) return "html"
  if (Array.isArray(article.body) && hasUsableArticleBody(article.body))
    return "blocks"
  return "blocks"
}

async function fetchPublishedIndexMerged(): Promise<ArticleIndexItem[]> {
  const dbMeta = await listAdminPosts()

  // DB joignable → source unique (brief #18 : fin dual-run dangereux)
  if (dbMeta) {
    const out: ArticleIndexItem[] = []
    for (const p of dbMeta) {
      if (!isPubliclyVisible(p.status, p.publishedAt)) continue
      const { status: _s, ...item } = p
      out.push(item)
    }
    out.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    return out
  }

  // Hors ligne / pas de clés : JSON publié seulement (secours local)
  return listArticleIndex().filter((j) => {
    const full = getArticle(j.slug)
    return !full || full.status === "published"
  })
}

const cachedPublishedIndex = unstable_cache(
  async () => fetchPublishedIndexMerged(),
  ["c5-published-posts-index"],
  { tags: [POSTS_CACHE_TAG] }
)

async function fetchPublishedArticle(slug: string): Promise<Article | null> {
  const raw = normSlug(slug)
  const fromDb = await getPublishedPost(raw)
  if (fromDb) {
    if (!fromDb.bodyDoc) {
      const doc = getBodyDoc(raw)
      if (doc) fromDb.bodyDoc = doc
    }
    if (!hasUsableHtml(fromDb.bodyHtml)) {
      const html = getBodyHtmlCache(raw)
      if (html) fromDb.bodyHtml = html
    }
    return fromDb
  }

  // Secours local uniquement si pas de client DB
  const dbMeta = await listAdminPosts()
  if (dbMeta) return null

  const fromJson = getArticle(raw)
  if (!fromJson || fromJson.status !== "published") return null
  if (!fromJson.bodyDoc) {
    const doc = getBodyDoc(raw)
    if (doc) fromJson.bodyDoc = doc
  }
  if (!hasUsableHtml(fromJson.bodyHtml)) {
    const html = getBodyHtmlCache(raw)
    if (html) fromJson.bodyHtml = html
  }
  return fromJson
}

const cachedPublishedArticle = unstable_cache(
  async (slug: string) => fetchPublishedArticle(slug),
  ["c5-published-post"],
  { tags: [POSTS_CACHE_TAG] }
)

export const resolvePublishedIndex = cache(async function resolvePublishedIndex(): Promise<
  ArticleIndexItem[]
> {
  return cachedPublishedIndex()
})

export const resolvePublishedArticle = cache(async function resolvePublishedArticle(
  slug: string
): Promise<Article | null> {
  return cachedPublishedArticle(normSlug(slug))
})

export async function resolvePublishedSlugs(): Promise<string[]> {
  const dbSlugs = await listPublishedSlugs()
  if (dbSlugs) return dbSlugs.map(normSlug)

  return listArticleIndex()
    .filter((j) => {
      const full = getArticle(j.slug)
      return !full || full.status === "published"
    })
    .map((j) => j.slug)
}

export async function resolveAdminArticleList(): Promise<
  (ArticleIndexItem & { status: PostStatus })[]
> {
  const fromDb = await listAdminPosts()
  if (fromDb?.length) return fromDb
  return listArticleIndex().map((a) => ({ ...a, status: "published" as const }))
}

/** @deprecated Préférer resolvePublicBodyHtml — plus de bascule signature. */
export function preferDbBody(article: Article): boolean {
  return Boolean(article.bodyDoc) || hasUsableHtml(article.bodyHtml)
}

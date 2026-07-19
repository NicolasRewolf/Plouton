/**
 * Couche publique C5 + bascule body_doc (brief #18 P1-D).
 *
 * Corps : body_doc (fichier ou DB) → HTML cache. Plus de rendu Ricos runtime.
 * Dual-run JSON index reste tant que DB incomplete ; articles sans status
 * dans l’index JSON ne sont servis que s’ils sont `published` dans le JSON article.
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
  getPostStatus,
  listAdminPosts,
  listPublishedSlugs,
  POSTS_CACHE_TAG,
} from "@/lib/posts-db"
import {
  hasUsableArticleBody,
  hasUsableHtml,
  isEditorJsDoc,
  htmlToParagraphs,
  editorJsToHtml,
} from "@/lib/article-body"
import { isPubliclyVisible, type PostStatus } from "@/lib/post-status"

export { POSTS_CACHE_TAG }

function normSlug(slug: string): string {
  return decodeURIComponent(slug).normalize("NFC")
}

function bodySignature(article: Pick<Article, "body" | "bodyHtml">): string {
  const html = (article.bodyHtml || "").trim()
  let body = ""
  if (isEditorJsDoc(article.body))
    body = htmlToParagraphs(editorJsToHtml(article.body)).join("\n\n")
  else if (Array.isArray(article.body))
    body = article.body.map((p) => p.trim()).join("\n\n")
  return `${html}\n---\n${body}`
}

/** Corps DB « utile » = différent du JSON seed (édition admin). */
export function preferDbBody(article: Article): boolean {
  const jsonTwin = getArticle(article.slug)
  if (!jsonTwin) return true
  return bodySignature(article) !== bodySignature(jsonTwin)
}

/**
 * HTML public (P1-D) :
 * 1. Édition admin (bodyHtml DB divergente du seed)
 * 2. Cache dérivé body_doc (`contenu/body-html/`)
 * 3. bodyHtml seed / DB
 * 4. vide → blocs texte
 */
export function resolvePublicBodyHtml(article: Article): string {
  if (preferDbBody(article) && hasUsableHtml(article.bodyHtml))
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

/** @deprecated Prefer resolvePublicBodyHtml — plus de mode ricos. */
export function resolvePostBodyMode(article: Article): PostBodyMode {
  const html = resolvePublicBodyHtml(article)
  if (html) return "html"
  if (Array.isArray(article.body) && hasUsableArticleBody(article.body))
    return "blocks"
  return "blocks"
}

async function fetchPublishedIndexMerged(): Promise<ArticleIndexItem[]> {
  const jsonIndex = listArticleIndex()
  const dbMeta = await listAdminPosts()

  if (!dbMeta) return jsonIndex

  const dbBySlug = new Map(dbMeta.map((p) => [normSlug(p.slug), p]))
  const out: ArticleIndexItem[] = []

  for (const p of dbMeta) {
    if (!isPubliclyVisible(p.status, p.publishedAt)) continue
    const { status: _s, ...item } = p
    out.push(item)
  }

  for (const j of jsonIndex) {
    if (dbBySlug.has(normSlug(j.slug))) continue
    // Sécurité dual-run : ne pas republier un brouillon JSON si pas en DB
    const full = getArticle(j.slug)
    if (full && full.status !== "published") continue
    out.push(j)
  }

  out.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  return out
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
    // Enrichir bodyDoc depuis fichier si absent en DB
    if (!fromDb.bodyDoc) {
      const doc = getBodyDoc(raw)
      if (doc) fromDb.bodyDoc = doc
    }
    return fromDb
  }

  const fromJson = getArticle(raw)
  if (!fromJson || fromJson.status !== "published") return null

  const status = await getPostStatus(raw)
  if (status === "draft" || status === "archived" || status === "scheduled")
    return null

  if (!fromJson.bodyDoc) {
    const doc = getBodyDoc(raw)
    if (doc) fromJson.bodyDoc = doc
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
  const jsonSlugs = listArticleIndex().map((a) => a.slug)
  const dbSlugs = await listPublishedSlugs()
  if (!dbSlugs) return jsonSlugs
  const set = new Set([...dbSlugs, ...jsonSlugs].map(normSlug))
  const meta = await listAdminPosts()
  if (meta) {
    for (const p of meta) {
      if (p.status === "draft" || p.status === "archived") set.delete(normSlug(p.slug))
      if (
        p.status === "scheduled" &&
        !isPubliclyVisible(p.status, p.publishedAt)
      )
        set.delete(normSlug(p.slug))
    }
  }
  return [...set]
}

export async function resolveAdminArticleList(): Promise<
  (ArticleIndexItem & { status: PostStatus })[]
> {
  const fromDb = await listAdminPosts()
  if (fromDb?.length) return fromDb
  return listArticleIndex().map((a) => ({ ...a, status: "published" as const }))
}

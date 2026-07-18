/**
 * Couche publique C5 : DB (secret) → fallback JSON.
 *
 * Corps rendu : si corps DB ≠ JSON seed → bodyHtml/body ;
 * sinon Ricos git (fidélité des 422).
 */

import { unstable_cache } from "next/cache"
import { cache } from "react"
import {
  getArticle,
  getRicos,
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

export { POSTS_CACHE_TAG }

function normSlug(slug: string): string {
  return decodeURIComponent(slug).normalize("NFC")
}

function bodySignature(article: Pick<Article, "body" | "bodyHtml">): string {
  const html = (article.bodyHtml || "").trim()
  const body = (article.body || []).map((p) => p.trim()).join("\n\n")
  return `${html}\n---\n${body}`
}

/** Corps DB « utile » = différent du JSON seed (édition admin) ou article absent du git. */
export function preferDbBody(article: Article): boolean {
  const jsonTwin = getArticle(article.slug)
  if (!jsonTwin) return true
  return bodySignature(article) !== bodySignature(jsonTwin)
}

export type PostBodyMode = "db-html" | "db-blocks" | "ricos" | "html" | "blocks"

/** Chemin de rendu du corps (documenté dans docs/05-decisions.md). */
export function resolvePostBodyMode(article: Article): PostBodyMode {
  const ricos = getRicos(article.slug)
  if (preferDbBody(article)) {
    if (article.bodyHtml?.trim()) return "db-html"
    if (article.body?.some((p) => p.trim() && p !== "Contenu à rédiger."))
      return "db-blocks"
  }
  if (ricos) return "ricos"
  if (article.bodyHtml?.trim()) return "html"
  return "blocks"
}

async function fetchPublishedIndexMerged(): Promise<ArticleIndexItem[]> {
  const jsonIndex = listArticleIndex()
  const dbMeta = await listAdminPosts()

  if (!dbMeta) return jsonIndex

  const dbBySlug = new Map(dbMeta.map((p) => [normSlug(p.slug), p]))
  const out: ArticleIndexItem[] = []

  for (const p of dbMeta) {
    if (p.status !== "published") continue
    const { status: _s, ...item } = p
    out.push(item)
  }

  for (const j of jsonIndex) {
    if (dbBySlug.has(normSlug(j.slug))) continue
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
  if (fromDb) return fromDb

  // Dual-run : pas en DB (ou erreur) → JSON git si publié
  const fromJson = getArticle(raw)
  if (!fromJson || fromJson.status !== "published") return null

  // Si la DB a un brouillon pour ce slug, ne pas servir le JSON publié
  const status = await getPostStatus(raw)
  if (status === "draft") return null

  return fromJson
}

const cachedPublishedArticle = unstable_cache(
  async (slug: string) => fetchPublishedArticle(slug),
  ["c5-published-post"],
  { tags: [POSTS_CACHE_TAG] }
)

/** Index public (DB ∪ JSON manquants). Cache tag `posts`. */
export const resolvePublishedIndex = cache(async function resolvePublishedIndex(): Promise<
  ArticleIndexItem[]
> {
  return cachedPublishedIndex()
})

/** Article public par slug. Cache tag `posts`. */
export const resolvePublishedArticle = cache(async function resolvePublishedArticle(
  slug: string
): Promise<Article | null> {
  return cachedPublishedArticle(normSlug(slug))
})

/** Slugs pour SSG : DB ∪ JSON. */
export async function resolvePublishedSlugs(): Promise<string[]> {
  const jsonSlugs = listArticleIndex().map((a) => a.slug)
  const dbSlugs = await listPublishedSlugs()
  if (!dbSlugs) return jsonSlugs
  const set = new Set([...dbSlugs, ...jsonSlugs].map(normSlug))
  // Exclure brouillons DB même s’ils sont encore dans l’index JSON
  const meta = await listAdminPosts()
  if (meta) {
    for (const p of meta) {
      if (p.status === "draft") set.delete(normSlug(p.slug))
    }
  }
  return [...set]
}

/** Liste admin : DB si dispo, sinon index JSON (tous « published »). */
export async function resolveAdminArticleList(): Promise<
  (ArticleIndexItem & { status: "draft" | "published" })[]
> {
  const fromDb = await listAdminPosts()
  if (fromDb?.length) return fromDb
  return listArticleIndex().map((a) => ({ ...a, status: "published" as const }))
}

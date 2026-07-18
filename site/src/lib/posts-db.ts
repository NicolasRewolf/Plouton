/**
 * Lecture / mapping `public.posts` (C5).
 *
 * Public : filtre `status = published` via clé secrète serveur
 * (`SUPABASE_SECRET_KEY`) — pas de RLS anon en V1.
 * Admin : tous les statuts.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Article, ArticleIndexItem } from "@/lib/content"
import {
  emptyEditorJsDoc,
  isEditorJsDoc,
  type ArticleBody,
} from "@/lib/editorjs"

/** Tag Next.js cache — invalidé au publish. */
export const POSTS_CACHE_TAG = "posts"

export interface PostRow {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
  updated_at: string | null
  status: "draft" | "published"
  author: string
  author_id: string | null
  categories: string[] | null
  tags: string[] | null
  category_ids: string[] | null
  cover_image: string | null
  minutes_to_read: number | null
  view_count: number | null
  url: string | null
  wix_id: string | null
  meta_title: string | null
  meta_description: string | null
  body_html: string | null
  body: unknown
}

const INDEX_SELECT =
  "slug, title, excerpt, published_at, status, categories, cover_image, minutes_to_read, url, view_count"

function hasSecretEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  )
}

function secretClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export function articleToPostRow(article: Article) {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || "",
    published_at: article.publishedAt?.slice(0, 10) || null,
    updated_at: article.updatedAt?.slice(0, 10) || null,
    status: article.status === "published" ? "published" : "draft",
    author: article.author || "",
    author_id: article.authorId ?? null,
    categories: article.categories || [],
    tags: article.tags || [],
    category_ids: article.categoryIds || [],
    cover_image: article.coverImage ?? null,
    minutes_to_read: article.minutesToRead ?? null,
    view_count: article.viewCount ?? 0,
    url: article.url || `/post/${article.slug}`,
    wix_id: article.wixId ?? null,
    meta_title: article.metaTitle ?? null,
    meta_description: article.metaDescription ?? null,
    body_html: article.bodyHtml ?? null,
    body: normalizeBodyForDb(article.body),
  }
}

function normalizeBodyForDb(body: Article["body"] | undefined): ArticleBody {
  if (isEditorJsDoc(body)) {
    return body.blocks?.length ? body : emptyEditorJsDoc("Contenu à rédiger.")
  }
  if (Array.isArray(body) && body.length) return body
  return ["Contenu à rédiger."]
}

function parseBodyFromDb(raw: unknown): ArticleBody {
  if (isEditorJsDoc(raw)) return raw
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (isEditorJsDoc(parsed)) return parsed
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* plain string */
    }
    return [raw]
  }
  return ["Contenu à rédiger."]
}

export function postRowToArticle(row: PostRow): Article {
  const body = parseBodyFromDb(row.body)
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    publishedAt: row.published_at || new Date().toISOString().slice(0, 10),
    updatedAt: row.updated_at || undefined,
    status: row.status === "published" ? "published" : "draft",
    author: row.author || "",
    authorId: row.author_id || undefined,
    categories: row.categories || [],
    tags: row.tags || undefined,
    categoryIds: row.category_ids || undefined,
    coverImage: row.cover_image,
    minutesToRead: row.minutes_to_read,
    viewCount: row.view_count ?? undefined,
    url: row.url || `/post/${row.slug}`,
    wixId: row.wix_id || undefined,
    metaTitle: row.meta_title || undefined,
    metaDescription: row.meta_description || undefined,
    bodyHtml: row.body_html || undefined,
    body,
  }
}

export function postRowToIndexItem(
  row: Pick<
    PostRow,
    | "slug"
    | "title"
    | "excerpt"
    | "published_at"
    | "categories"
    | "cover_image"
    | "minutes_to_read"
    | "url"
    | "view_count"
  >
): ArticleIndexItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    publishedAt: row.published_at || "",
    categories: row.categories || [],
    coverImage: row.cover_image,
    minutesToRead: row.minutes_to_read,
    url: row.url || `/post/${row.slug}`,
    viewCount: row.view_count ?? undefined,
  }
}

function sortByPublishedDesc(a: { publishedAt: string }, b: { publishedAt: string }) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

/** Article publié par slug — null si absent / brouillon / pas de Supabase. */
export async function getPublishedPost(slug: string): Promise<Article | null> {
  const client = secretClient()
  if (!client) return null
  const raw = decodeURIComponent(slug).normalize("NFC")
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("slug", raw)
    .eq("status", "published")
    .maybeSingle()
  if (error) {
    console.warn(`[posts-db] getPublishedPost(${raw}): ${error.message}`)
    return null
  }
  if (!data) return null
  return postRowToArticle(data as PostRow)
}

/** Statut DB d’un slug (sans filtre) — null si absent / pas de Supabase. */
export async function getPostStatus(
  slug: string
): Promise<"draft" | "published" | null> {
  const client = secretClient()
  if (!client) return null
  const raw = decodeURIComponent(slug).normalize("NFC")
  const { data, error } = await client
    .from("posts")
    .select("status")
    .eq("slug", raw)
    .maybeSingle()
  if (error) {
    console.warn(`[posts-db] getPostStatus(${raw}): ${error.message}`)
    return null
  }
  if (!data) return null
  return data.status === "published" ? "published" : "draft"
}

/** Meta légère tous statuts (admin + merge public). */
export async function listPostsMeta(): Promise<
  (ArticleIndexItem & { status: "draft" | "published" })[] | null
> {
  if (!hasSecretEnv()) return null
  const client = secretClient()
  if (!client) return null

  const pageSize = 1000
  const out: (ArticleIndexItem & { status: "draft" | "published" })[] = []
  let from = 0

  for (;;) {
    const { data, error } = await client
      .from("posts")
      .select(INDEX_SELECT)
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1)
    if (error) {
      console.warn(`[posts-db] listPostsMeta: ${error.message}`)
      return null
    }
    const rows = (data || []) as (PostRow & { status: "draft" | "published" })[]
    for (const row of rows) {
      out.push({
        ...postRowToIndexItem(row),
        status: row.status === "published" ? "published" : "draft",
      })
    }
    if (rows.length < pageSize) break
    from += pageSize
  }

  return out
}

/** Index publié uniquement (listings publics). */
export async function listPublishedPostsIndex(): Promise<ArticleIndexItem[] | null> {
  const meta = await listPostsMeta()
  if (!meta) return null
  return meta
    .filter((p) => p.status === "published")
    .map(({ status: _s, ...item }) => item)
    .sort(sortByPublishedDesc)
}

/** Tous les posts pour la liste admin (DB). */
export async function listAdminPosts(): Promise<
  (ArticleIndexItem & { status: "draft" | "published" })[] | null
> {
  return listPostsMeta()
}

/** Slugs publiés (generateStaticParams). */
export async function listPublishedSlugs(): Promise<string[] | null> {
  const index = await listPublishedPostsIndex()
  if (!index) return null
  return index.map((a) => a.slug)
}

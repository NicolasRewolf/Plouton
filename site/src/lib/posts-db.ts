/**
 * Lecture / mapping `public.posts` (C5).
 *
 * Public : filtre `status = published` via clé secrète serveur
 * (`SUPABASE_SECRET_KEY`) — pas de RLS anon en V1.
 * Admin : tous les statuts.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  isPostStatus,
  isPubliclyVisible,
  resolvePersistStatus,
  todayIsoDate,
  type PostStatus,
} from "@/lib/post-status"
import type { Article, ArticleIndexItem } from "@/lib/content"
import { getCategories, resolveAuthorSlug } from "@/lib/content"
import {
  editorJsToHtml,
  hasUsableHtml,
  htmlToParagraphs,
  isEditorJsDoc,
  type ArticleBody,
} from "@/lib/article-body"

/** Tag Next.js cache — invalidé au publish. */
export const POSTS_CACHE_TAG = "posts"

export interface PostRow {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
  updated_at: string | null
  status: PostStatus
  author: string
  author_id: string | null
  author_slug: string | null
  reviewer_slug: string | null
  reviewed_at: string | null
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
  body_doc: unknown | null
  body: unknown
}

const INDEX_SELECT =
  "slug, title, excerpt, published_at, status, categories, category_ids, cover_image, minutes_to_read, url, view_count"

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
  const publishedAt = article.publishedAt?.slice(0, 10) || null
  const rawStatus: PostStatus = isPostStatus(article.status)
    ? article.status
    : "draft"
  const status = resolvePersistStatus(rawStatus, publishedAt || undefined)
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || "",
    published_at: publishedAt,
    updated_at: article.updatedAt?.slice(0, 10) || null,
    status,
    author: article.author || "",
    author_id: article.authorId ?? null,
    author_slug:
      article.authorSlug ?? resolveAuthorSlug(article) ?? null,
    reviewer_slug: article.reviewerSlug ?? null,
    reviewed_at: article.reviewedAt ?? null,
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
    body_doc: article.bodyDoc ?? null,
    body: normalizeBodyForDb(article.body),
  }
}

function normalizeBodyForDb(body: Article["body"] | undefined): ArticleBody {
  if (Array.isArray(body) && body.length) return body
  if (isEditorJsDoc(body)) return htmlToParagraphs(editorJsToHtml(body))
  return ["Contenu à rédiger."]
}

function parseBodyFromDb(raw: unknown): ArticleBody {
  if (Array.isArray(raw)) return raw.map(String)
  if (isEditorJsDoc(raw)) return htmlToParagraphs(editorJsToHtml(raw))
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed.map(String)
      if (isEditorJsDoc(parsed)) return htmlToParagraphs(editorJsToHtml(parsed))
    } catch {
      /* plain string */
    }
    return [raw]
  }
  return ["Contenu à rédiger."]
}

export function postRowToArticle(row: PostRow): Article {
  let body = parseBodyFromDb(row.body)
  let bodyHtml = row.body_html || undefined
  // Legacy Editor.js en jsonb → HTML TipTap
  if (!hasUsableHtml(bodyHtml) && isEditorJsDoc(row.body)) {
    bodyHtml = editorJsToHtml(row.body)
    body = htmlToParagraphs(bodyHtml)
  }
  const status: PostStatus = isPostStatus(row.status) ? row.status : "draft"
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    publishedAt: row.published_at || new Date().toISOString().slice(0, 10),
    updatedAt: row.updated_at || undefined,
    status,
    author: row.author || "",
    authorId: row.author_id || undefined,
    authorSlug: row.author_slug || row.author_id || undefined,
    reviewerSlug: row.reviewer_slug || undefined,
    reviewedAt: row.reviewed_at || undefined,
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
    bodyHtml,
    bodyDoc: (row.body_doc as Article["bodyDoc"]) || undefined,
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
    | "category_ids"
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
    categoryIds: row.category_ids || undefined,
    coverImage: row.cover_image,
    minutesToRead: row.minutes_to_read,
    url: row.url || `/post/${row.slug}`,
    viewCount: row.view_count ?? undefined,
  }
}

function sortByPublishedDesc(a: { publishedAt: string }, b: { publishedAt: string }) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

/** Article publié par slug — null si absent / brouillon / pas de Supabase.
 * scheduled avec date passée → promu en published (écriture best-effort). */
export async function getPublishedPost(slug: string): Promise<Article | null> {
  const client = secretClient()
  if (!client) return null
  const raw = decodeURIComponent(slug).normalize("NFC")
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("slug", raw)
    .in("status", ["published", "scheduled"])
    .maybeSingle()
  if (error) {
    console.warn(`[posts-db] getPublishedPost(${raw}): ${error.message}`)
    return null
  }
  if (!data) return null
  const row = data as PostRow
  if (!isPubliclyVisible(row.status, row.published_at || undefined)) return null

  if (row.status === "scheduled") {
    const { error: upErr } = await client
      .from("posts")
      .update({ status: "published" })
      .eq("slug", raw)
    if (upErr) console.warn(`[posts-db] promote scheduled: ${upErr.message}`)
    row.status = "published"
  }

  return postRowToArticle(row)
}

/** Statut DB d’un slug (sans filtre) — null si absent / pas de Supabase. */
export async function getPostStatus(slug: string): Promise<PostStatus | null> {
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
  return isPostStatus(data.status) ? data.status : "draft"
}

/** Meta légère tous statuts (admin + merge public). */
export async function listPostsMeta(): Promise<
  (ArticleIndexItem & { status: PostStatus })[] | null
> {
  if (!hasSecretEnv()) return null
  const client = secretClient()
  if (!client) return null

  const pageSize = 1000
  const out: (ArticleIndexItem & { status: PostStatus })[] = []
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
    const rows = (data || []) as (PostRow & { status: PostStatus })[]
    for (const row of rows) {
      const status: PostStatus = isPostStatus(row.status) ? row.status : "draft"
      out.push({
        ...postRowToIndexItem(row),
        status,
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
    .filter((p) => isPubliclyVisible(p.status, p.publishedAt))
    .map(({ status: _s, ...item }) => item)
    .sort(sortByPublishedDesc)
}

/** Tous les posts pour la liste admin (DB). */
export async function listAdminPosts(): Promise<
  (ArticleIndexItem & { status: PostStatus })[] | null
> {
  return listPostsMeta()
}

/** Soft-delete : passe en archived. */
export async function archivePost(slug: string): Promise<boolean> {
  const client = secretClient()
  if (!client) return false
  const { error } = await client
    .from("posts")
    .update({
      status: "archived",
      updated_at: todayIsoDate(),
    })
    .eq("slug", slug)
  if (error) {
    console.warn(`[posts-db] archivePost(${slug}): ${error.message}`)
    return false
  }
  return true
}

/** Labels → category_ids (référentiel contenu/categories.json). */
export function resolveCategoryIdsFromLabels(labels: string[]): string[] {
  const cats = getCategories()
  const byLabel = new Map(cats.map((c) => [c.label, c.id]))
  const ids: string[] = []
  for (const label of labels) {
    const id = byLabel.get(label)
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

export type PostVersionRow = {
  id: number
  post_slug: string
  body_html: string | null
  body: unknown
  title: string | null
  categories: string[] | null
  meta_title: string | null
  meta_description: string | null
  author_email: string | null
  created_at: string
}

/** Snapshot avant PUT admin (P0-F). Best-effort si table absente. */
export async function insertPostVersion(opts: {
  slug: string
  article: Article
  authorEmail?: string | null
}): Promise<boolean> {
  const client = secretClient()
  if (!client) return false
  const { error } = await client.from("post_versions").insert({
    post_slug: opts.slug,
    body_html: opts.article.bodyHtml ?? null,
    body: opts.article.body ?? null,
    title: opts.article.title ?? null,
    categories: opts.article.categories ?? [],
    meta_title: opts.article.metaTitle ?? null,
    meta_description: opts.article.metaDescription ?? null,
    author_email: opts.authorEmail ?? null,
  })
  if (error) {
    console.warn(`[posts-db] insertPostVersion(${opts.slug}): ${error.message}`)
    return false
  }
  return true
}

export async function listPostVersions(
  slug: string,
  limit = 20
): Promise<PostVersionRow[] | null> {
  const client = secretClient()
  if (!client) return null
  const { data, error } = await client
    .from("post_versions")
    .select("*")
    .eq("post_slug", slug)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    console.warn(`[posts-db] listPostVersions(${slug}): ${error.message}`)
    return null
  }
  return (data || []) as PostVersionRow[]
}

export async function getPostVersion(
  id: number
): Promise<PostVersionRow | null> {
  const client = secretClient()
  if (!client) return null
  const { data, error } = await client
    .from("post_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) {
    console.warn(`[posts-db] getPostVersion(${id}): ${error.message}`)
    return null
  }
  return data as PostVersionRow | null
}

/** Slugs publiés (generateStaticParams). */
export async function listPublishedSlugs(): Promise<string[] | null> {
  const index = await listPublishedPostsIndex()
  if (!index) return null
  return index.map((a) => a.slug)
}

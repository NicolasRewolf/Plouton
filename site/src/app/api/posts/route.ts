import { NextResponse } from "next/server"
import {
  getArticle,
  type Article,
} from "@/lib/content"
import {
  hasUsableHtml,
  htmlToParagraphs,
  isEditorJsDoc,
} from "@/lib/article-body"
import { isPostStatus, resolvePersistStatus, type PostStatus } from "@/lib/post-status"
import { editGuardMessage } from "@/lib/post-edit-guard"
import { assessEditRisk } from "@/lib/post-edit-guard-server"
import { archivePost, insertPostVersion, resolveCategoryIdsFromLabels } from "@/lib/posts-db"
import { resolveAdminArticleList } from "@/lib/posts-public"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { getStore, type ContentStore } from "@/lib/store"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

interface StoreWithGet extends ContentStore {
  getArticleBySlug?(slug: string): Promise<Article | null>
}

async function requireAdmin() {
  try {
    const supabase = await supabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return user
  } catch {
    return null
  }
}

function normalizeIncoming(body: Partial<Article>): Pick<Article, "body" | "bodyHtml"> {
  const html = (body.bodyHtml || "").trim()
  if (hasUsableHtml(html) || html === "<p></p>") {
    return {
      bodyHtml: html || "<p></p>",
      body: htmlToParagraphs(html || "<p></p>"),
    }
  }
  if (Array.isArray(body.body) && body.body.length)
    return { body: body.body, bodyHtml: body.bodyHtml }
  // Legacy Editor.js encore en DB
  if (isEditorJsDoc(body.body))
    return { body: body.body, bodyHtml: body.bodyHtml }
  return { body: ["Contenu à rédiger."], bodyHtml: "<p></p>" }
}

function normalizeStatus(
  raw: unknown,
  publishedAt: string | undefined
): PostStatus {
  const base: PostStatus = isPostStatus(raw) ? raw : "draft"
  return resolvePersistStatus(base, publishedAt)
}

export async function GET(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (slug) {
    const store = getStore() as StoreWithGet
    if (store.getArticleBySlug) {
      const fromDb = await store.getArticleBySlug(slug)
      if (fromDb) {
        const editGuard = assessEditRisk(slug, fromDb.bodyHtml)
        return NextResponse.json({ ...fromDb, editGuard })
      }
    }
    const article = getArticle(slug)
    if (!article) return NextResponse.json({ error: "introuvable" }, { status: 404 })
    const editGuard = assessEditRisk(slug, article.bodyHtml)
    return NextResponse.json({ ...article, editGuard })
  }
  return NextResponse.json(await resolveAdminArticleList())
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as Partial<Article>
  if (!body.slug || !body.title)
    return NextResponse.json({ error: "slug et title requis" }, { status: 400 })

  const publishedAt = body.publishedAt || new Date().toISOString().slice(0, 10)
  const normalized = normalizeIncoming(body)
  const categories = body.categories?.length
    ? body.categories
    : ["Ressources et notions juridiques"]
  const categoryIds =
    body.categoryIds?.length
      ? body.categoryIds
      : resolveCategoryIdsFromLabels(categories)
  const article: Article = {
    slug: body.slug.replace(/[^a-z0-9-àâäéèêëïîôùûüç]/gi, "-").toLowerCase(),
    title: body.title,
    excerpt: body.excerpt || "",
    publishedAt,
    status: normalizeStatus(body.status, publishedAt),
    author: body.author || "Cabinet Plouton",
    categories,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    coverImage: body.coverImage,
    tags: body.tags,
    categoryIds,
    authorId: body.authorId,
    wixId: body.wixId,
    url: body.url,
    minutesToRead: body.minutesToRead,
    viewCount: body.viewCount,
    updatedAt: body.updatedAt || new Date().toISOString().slice(0, 10),
  }
  try {
    await getStore().saveArticle(article)
    revalidatePostSurfaces(article.slug)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "échec enregistrement"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  return NextResponse.json(article)
}

export async function PUT(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as Article & { forceRichEdit?: boolean }
  if (!body.slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })

  // P0-A — gel articles riches (Ricos / HTML) sauf override explicite
  const risk = assessEditRisk(body.slug, body.bodyHtml)
  if (risk.blocked && !body.forceRichEdit) {
    return NextResponse.json(
      {
        error: editGuardMessage(risk),
        code: "RICH_EDIT_BLOCKED",
        reasons: risk.reasons,
        source: risk.source,
      },
      { status: 409 }
    )
  }

  const store = getStore() as StoreWithGet
  const previous =
    (store.getArticleBySlug && (await store.getArticleBySlug(body.slug))) ||
    getArticle(body.slug)
  if (previous) {
    await insertPostVersion({
      slug: body.slug,
      article: previous,
      authorEmail: user.email,
    })
  }

  const normalized = normalizeIncoming(body)
  const publishedAt = body.publishedAt || new Date().toISOString().slice(0, 10)
  const categories = body.categories?.length
    ? body.categories
    : previous?.categories?.length
      ? previous.categories
      : ["Ressources et notions juridiques"]
  const categoryIds = resolveCategoryIdsFromLabels(categories)
  const article: Article = {
    ...body,
    publishedAt,
    status: normalizeStatus(body.status, publishedAt),
    categories,
    categoryIds,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    updatedAt: body.updatedAt || new Date().toISOString().slice(0, 10),
  }
  try {
    await getStore().saveArticle(article)
    revalidatePostSurfaces(article.slug)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "échec enregistrement"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  return NextResponse.json(article)
}

/** Soft-delete : status → archived */
export async function DELETE(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })

  const ok = await archivePost(slug)
  if (!ok) {
    // Fallback FsStore : marquer archived via save
    try {
      const store = getStore() as StoreWithGet
      const existing =
        (store.getArticleBySlug && (await store.getArticleBySlug(slug))) ||
        getArticle(slug)
      if (!existing)
        return NextResponse.json({ error: "introuvable" }, { status: 404 })
      await store.saveArticle({ ...existing, status: "archived" })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "échec archivage"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }
  revalidatePostSurfaces(slug)
  return NextResponse.json({ ok: true, status: "archived" })
}

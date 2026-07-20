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
import { isKnownAuthorSlug } from "@/lib/authors-db"
import { isPostStatus, resolvePersistStatus, type PostStatus } from "@/lib/post-status"
import { detectNodeLoss, nodeLossMessage } from "@/lib/post-edit-loss"
import { sanitizeEditorHtml } from "@/lib/tiptap/sanitize"
import { bodyDocToHtml } from "@/lib/tiptap/body-doc"
import { archivePost, insertPostVersion, resolveCategoryIdsFromLabels } from "@/lib/posts-db"
import { resolveAdminArticleList, resolveBodyDoc } from "@/lib/posts-public"
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

function normalizeIncoming(body: Partial<Article>): Pick<Article, "body" | "bodyHtml" | "bodyDoc"> {
  const doc = body.bodyDoc
  if (doc && typeof doc === "object") {
    const html = sanitizeEditorHtml(bodyDocToHtml(doc))
    return {
      bodyDoc: doc,
      bodyHtml: html,
      body: htmlToParagraphs(html),
    }
  }
  const html = sanitizeEditorHtml((body.bodyHtml || "").trim() || "<p></p>")
  if (hasUsableHtml(html) || html === "<p></p>") {
    return {
      bodyHtml: html,
      body: htmlToParagraphs(html),
      bodyDoc: body.bodyDoc ?? null,
    }
  }
  if (Array.isArray(body.body) && body.body.length)
    return { body: body.body, bodyHtml: body.bodyHtml, bodyDoc: body.bodyDoc ?? null }
  if (isEditorJsDoc(body.body))
    return { body: body.body, bodyHtml: body.bodyHtml, bodyDoc: body.bodyDoc ?? null }
  return { body: ["Contenu à rédiger."], bodyHtml: "<p></p>", bodyDoc: null }
}

function normalizeStatus(
  raw: unknown,
  publishedAt: string | undefined
): PostStatus {
  const base: PostStatus = isPostStatus(raw) ? raw : "draft"
  return resolvePersistStatus(base, publishedAt)
}

/** P1-A — auteur hors référentiel = refus (plus de GUID libre). */
async function assertAuthorSlug(
  slug: string | undefined | null
): Promise<NextResponse | null> {
  if (!slug?.trim()) return null
  const ok = await isKnownAuthorSlug(slug.trim())
  if (ok) return null
  return NextResponse.json(
    {
      error: `Auteur inconnu « ${slug} ». Choisir dans la liste (pas de saisie libre).`,
      code: "UNKNOWN_AUTHOR",
    },
    { status: 400 }
  )
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
      if (fromDb) return NextResponse.json(fromDb)
    }
    const article = getArticle(slug)
    if (!article) return NextResponse.json({ error: "introuvable" }, { status: 404 })
    return NextResponse.json(article)
  }
  return NextResponse.json(await resolveAdminArticleList())
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as Partial<Article>
  if (!body.slug || !body.title)
    return NextResponse.json({ error: "slug et title requis" }, { status: 400 })

  const authorSlug = body.authorSlug || body.authorId
  const authorErr = await assertAuthorSlug(authorSlug)
  if (authorErr) return authorErr

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
    authorId: body.authorId,
    authorSlug,
    categories,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    bodyDoc: normalized.bodyDoc,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    coverImage: body.coverImage,
    tags: body.tags,
    categoryIds,
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

  const body = (await req.json()) as Article & { confirmContentLoss?: boolean }
  if (!body.slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })

  const store = getStore() as StoreWithGet
  const previous =
    (store.getArticleBySlug && (await store.getArticleBySlug(body.slug))) ||
    getArticle(body.slug)

  const normalized = normalizeIncoming(body)

  // Alerte sur une perte MESURÉE (et non pronostiquée par nom de balise).
  // Se place avant toute écriture : une sauvegarde refusée ne doit pas
  // laisser de version d'archive derrière elle.
  if (previous && !body.confirmContentLoss) {
    const losses = detectNodeLoss(resolveBodyDoc(previous), normalized.bodyDoc)
    if (losses.length) {
      return NextResponse.json(
        {
          error: nodeLossMessage(losses),
          code: "CONTENT_LOSS",
          losses,
        },
        { status: 409 }
      )
    }
  }

  if (previous) {
    await insertPostVersion({
      slug: body.slug,
      article: previous,
      authorEmail: user.email,
    })
  }

  const publishedAt = body.publishedAt || new Date().toISOString().slice(0, 10)
  const categories = body.categories?.length
    ? body.categories
    : previous?.categories?.length
      ? previous.categories
      : ["Ressources et notions juridiques"]
  const categoryIds = resolveCategoryIdsFromLabels(categories)
  const authorSlug = body.authorSlug || body.authorId || previous?.authorSlug
  const authorErr = await assertAuthorSlug(authorSlug)
  if (authorErr) return authorErr
  const reviewerSlug = body.reviewerSlug || previous?.reviewerSlug
  const reviewerErr = await assertAuthorSlug(reviewerSlug)
  if (reviewerErr) return reviewerErr
  const article: Article = {
    ...body,
    publishedAt,
    status: normalizeStatus(body.status, publishedAt),
    categories,
    categoryIds,
    authorSlug,
    authorId: body.authorId || previous?.authorId,
    reviewerSlug: reviewerSlug || undefined,
    reviewedAt: reviewerSlug
      ? body.reviewedAt || new Date().toISOString()
      : undefined,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    bodyDoc: normalized.bodyDoc,
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

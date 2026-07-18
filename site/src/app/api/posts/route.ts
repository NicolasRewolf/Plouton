import { NextResponse } from "next/server"
import {
  getArticle,
  type Article,
} from "@/lib/content"
import { resolveAdminArticleList } from "@/lib/posts-public"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { getStore, type ContentStore } from "@/lib/store"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

/** Store avec lecture DB optionnelle (SupabaseStore). */
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

export async function GET(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (slug) {
    // Dual-run : DB d'abord (brouillons / éditions admin), sinon JSON git.
    const store = getStore() as StoreWithGet
    if (store.getArticleBySlug) {
      const fromDb = await store.getArticleBySlug(slug)
      if (fromDb) return NextResponse.json(fromDb)
    }
    const article = getArticle(slug)
    if (!article) return NextResponse.json({ error: "introuvable" }, { status: 404 })
    return NextResponse.json(article)
  }
  // Liste admin : DB (publiés + brouillons), fallback JSON
  return NextResponse.json(await resolveAdminArticleList())
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as Partial<Article>
  if (!body.slug || !body.title)
    return NextResponse.json({ error: "slug et title requis" }, { status: 400 })

  const article: Article = {
    slug: body.slug.replace(/[^a-z0-9-àâäéèêëïîôùûüç]/gi, "-").toLowerCase(),
    title: body.title,
    excerpt: body.excerpt || "",
    publishedAt: body.publishedAt || new Date().toISOString().slice(0, 10),
    status: body.status === "published" ? "published" : "draft",
    author: body.author || "Cabinet Plouton",
    categories: body.categories || ["Ressources et notions juridiques"],
    body: body.body?.length ? body.body : ["Contenu à rédiger."],
    bodyHtml: body.bodyHtml,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    coverImage: body.coverImage,
    tags: body.tags,
    categoryIds: body.categoryIds,
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

  const body = (await req.json()) as Article
  if (!body.slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })
  const article: Article = {
    ...body,
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

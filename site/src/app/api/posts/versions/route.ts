import { NextResponse } from "next/server"
import { getArticle } from "@/lib/content"
import {
  getPostVersion,
  insertPostVersion,
  listPostVersions,
} from "@/lib/posts-db"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { getStore, type ContentStore } from "@/lib/store"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

interface StoreWithGet extends ContentStore {
  getArticleBySlug?(slug: string): Promise<import("@/lib/content").Article | null>
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

/** GET ?slug=… — liste des versions. POST { versionId } — restaurer. */
export async function GET(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })
  const slug = new URL(req.url).searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })
  const rows = await listPostVersions(slug)
  if (!rows) return NextResponse.json({ versions: [] })
  return NextResponse.json({
    versions: rows.map((v) => ({
      id: v.id,
      createdAt: v.created_at,
      title: v.title,
      authorEmail: v.author_email,
    })),
  })
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as { versionId?: number }
  if (!body.versionId)
    return NextResponse.json({ error: "versionId requis" }, { status: 400 })

  const version = await getPostVersion(body.versionId)
  if (!version)
    return NextResponse.json({ error: "version introuvable" }, { status: 404 })

  const store = getStore() as StoreWithGet
  const current =
    (store.getArticleBySlug &&
      (await store.getArticleBySlug(version.post_slug))) ||
    getArticle(version.post_slug)
  if (!current)
    return NextResponse.json({ error: "article introuvable" }, { status: 404 })

  // Snapshot de l'état actuel avant restauration
  await insertPostVersion({
    slug: version.post_slug,
    article: current,
    authorEmail: user.email,
  })

  const restored = {
    ...current,
    title: version.title || current.title,
    categories: version.categories || current.categories,
    metaTitle: version.meta_title || undefined,
    metaDescription: version.meta_description || undefined,
    bodyHtml: version.body_html || current.bodyHtml,
    body: (Array.isArray(version.body)
      ? version.body
      : current.body) as typeof current.body,
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  try {
    await store.saveArticle(restored)
    revalidatePostSurfaces(version.post_slug)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "échec restauration"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json(restored)
}

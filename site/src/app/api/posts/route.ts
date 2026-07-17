import { NextResponse } from "next/server"
import {
  getArticle,
  listArticleIndex,
  type Article,
} from "@/lib/content"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  if (slug) {
    const article = getArticle(slug)
    if (!article) return NextResponse.json({ error: "introuvable" }, { status: 404 })
    return NextResponse.json(article)
  }
  return NextResponse.json(listArticleIndex())
}

export async function POST(req: Request) {
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
  }
  await getStore().saveArticle(article)
  return NextResponse.json(article)
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Article
  if (!body.slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })
  await getStore().saveArticle(body)
  return NextResponse.json(body)
}

import { NextResponse } from "next/server"
import { listArticles, saveArticle, type Article } from "@/lib/content"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(listArticles())
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Article>
  if (!body.slug || !body.title) {
    return NextResponse.json({ error: "slug et title requis" }, { status: 400 })
  }
  const article: Article = {
    slug: body.slug.replace(/[^a-z0-9-àâäéèêëïîôùûüç]/gi, "-").toLowerCase(),
    title: body.title,
    excerpt: body.excerpt || "",
    publishedAt: body.publishedAt || new Date().toISOString(),
    status: body.status === "published" ? "published" : "draft",
    author: body.author || "Cabinet Plouton",
    categories: body.categories || ["Ressources et notions juridiques"],
    body: body.body?.length ? body.body : ["Contenu à rédiger."],
  }
  saveArticle(article)
  return NextResponse.json(article)
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Article
  if (!body.slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })
  saveArticle(body)
  return NextResponse.json(body)
}

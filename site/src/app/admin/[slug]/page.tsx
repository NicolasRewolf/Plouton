"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import type { Article } from "@/lib/content"

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/posts?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: Article & { error?: string }) => {
        if (data.error) setArticle(null)
        else setArticle(data)
      })
  }, [slug])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!article) return
    const fd = new FormData(e.currentTarget)
    const body = String(fd.get("body") || "")
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const next: Article = {
      ...article,
      title: String(fd.get("title")),
      excerpt: String(fd.get("excerpt")),
      author: String(fd.get("author")),
      status: fd.get("status") === "published" ? "published" : "draft",
      body,
    }
    const res = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
    if (!res.ok) {
      setError("Échec")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  if (!article) return <p className="p-12 text-sm text-graytext">Chargement…</p>

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl mb-6">Éditer — {article.slug}</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm">
          Titre
          <input name="title" defaultValue={article.title} className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Extrait
          <textarea name="excerpt" defaultValue={article.excerpt} rows={2} className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Auteur
          <input name="author" defaultValue={article.author} className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Statut
          <select name="status" defaultValue={article.status} className="border border-line px-3 py-2 bg-white">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Corps
          <textarea
            name="body"
            defaultValue={article.body.join("\n\n")}
            rows={14}
            className="border border-line px-3 py-2 bg-white font-mono text-sm"
          />
        </label>
        {error ? <p className="text-accent text-sm">{error}</p> : null}
        <div className="flex gap-3">
          <button type="submit" className="bg-accent text-white px-4 py-2">
            Enregistrer
          </button>
          <Link href="/admin" className="px-4 py-2 border border-line">
            Retour
          </Link>
        </div>
      </form>
    </div>
  )
}

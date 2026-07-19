"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { Article } from "@/lib/content"

/** P1-G — Aperçu brouillon (HTML TipTap) sans quitter l’admin. */
export default function AdminPreviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/posts?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: Article & { error?: string }) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setArticle(data)
      })
      .catch(() => setError("Chargement impossible"))
  }, [slug])

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-accent">{error}</p>
        <Link href={`/admin/${slug}`}>← Retour édition</Link>
      </main>
    )
  }
  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-muted">
        Chargement…
      </main>
    )
  }

  return (
    <main className="bg-page min-h-screen px-3 py-8">
      <div className="mx-auto mb-4 flex max-w-[940px] justify-between text-[13px]">
        <Link href={`/admin/${slug}`} className="text-navy hover:underline">
          ← Édition
        </Link>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
          Aperçu — {article.status}
        </span>
      </div>
      <article className="prose-plouton mx-auto max-w-[940px] border border-line bg-white px-5 py-14 sm:px-10">
        <h1 className="font-display text-[28px] font-medium text-navy">
          {article.title}
        </h1>
        <div
          className="mt-8"
          dangerouslySetInnerHTML={{
            __html: article.bodyHtml || "<p></p>",
          }}
        />
      </article>
    </main>
  )
}

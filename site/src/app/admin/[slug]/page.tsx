"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { AdminEditorLazy } from "@/components/admin/AdminEditorLazy"
import { AdminPostMeta } from "@/components/admin/AdminPostMeta"
import {
  articleToEditorHtml,
  htmlToParagraphs,
} from "@/lib/article-body"
import type { Article } from "@/lib/content"
import { statusLabel, todayIsoDate, type PostStatus } from "@/lib/post-status"

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [bodyHtml, setBodyHtml] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState("")
  const [categoryLabel, setCategoryLabel] = useState("")
  const [publishedAt, setPublishedAt] = useState(todayIsoDate())
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/posts?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: Article & { error?: string }) => {
        if (data.error) {
          setArticle(null)
          return
        }
        setArticle(data)
        setBodyHtml(articleToEditorHtml(data))
        setCoverImage(data.coverImage || "")
        setCategoryLabel(data.categories?.[0] || "")
        setPublishedAt((data.publishedAt || todayIsoDate()).slice(0, 10))
        setMetaTitle(data.metaTitle || "")
        setMetaDescription(data.metaDescription || "")
      })
  }, [slug])

  async function save(status: PostStatus) {
    if (!article || bodyHtml === null) return
    const form = formRef.current
    if (!form) return
    setSaving(true)
    setError("")
    const fd = new FormData(form)
    const next: Article = {
      ...article,
      title: String(fd.get("title")),
      excerpt: String(fd.get("excerpt")),
      author: String(fd.get("author")),
      publishedAt,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      coverImage: coverImage || null,
      categories: categoryLabel
        ? [categoryLabel]
        : article.categories?.length
          ? article.categories
          : ["Ressources et notions juridiques"],
      status,
      bodyHtml,
      body: htmlToParagraphs(bodyHtml),
    }
    const res = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
    setSaving(false)
    if (!res.ok) {
      setError("Échec de l’enregistrement")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  async function archive() {
    if (!article) return
    if (
      !window.confirm(
        `Archiver « ${article.title} » ? Il disparaîtra du site public (récupérable en changeant le statut).`
      )
    )
      return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/posts?slug=${encodeURIComponent(article.slug)}`, {
      method: "DELETE",
    })
    setSaving(false)
    if (!res.ok) {
      setError("Archivage impossible")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const current = article?.status
    if (current === "published" || current === "scheduled") void save(current)
    else void save("draft")
  }

  if (!article || bodyHtml === null)
    return (
      <p className="px-6 py-16 text-center text-[14px] text-muted">Chargement…</p>
    )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
            Édition
          </p>
          <h1 className="font-display mt-1 truncate text-[24px] font-medium text-navy sm:text-[26px]">
            {article.title}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted">/post/{article.slug}</p>
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <Link
            href={`/post/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-navy"
          >
            Voir ↗
          </Link>
          <Link href="/admin" className="text-muted hover:text-navy">
            ← Liste
          </Link>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="space-y-4">
          <label className="grid gap-1.5 text-[13px] font-medium text-navy">
            Titre
            <input
              name="title"
              defaultValue={article.title}
              className="admin-input text-[16px] font-medium"
            />
          </label>
          <AdminEditorLazy initialHtml={bodyHtml} onChange={setBodyHtml} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Publication
            </p>
            <p className="mt-2 text-[12px] text-muted">
              Actuellement :{" "}
              <span className="font-medium text-navy">
                {statusLabel(article.status)}
              </span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                className="admin-btn admin-btn-secondary w-full"
                onClick={() => void save("draft")}
              >
                {saving ? "…" : "Enregistrer brouillon"}
              </button>
              <button
                type="button"
                disabled={saving}
                className="admin-btn admin-btn-primary w-full"
                onClick={() => void save("published")}
              >
                Publier
              </button>
              <button
                type="button"
                disabled={saving}
                className="admin-btn admin-btn-secondary w-full"
                onClick={() => void save("scheduled")}
                title="Visible le jour de la date de publication"
              >
                Programmer
              </button>
            </div>
            {error ? <p className="mt-3 text-[13px] text-accent">{error}</p> : null}
            <button
              type="button"
              disabled={saving || article.status === "archived"}
              className="mt-4 w-full text-[12px] text-accent/90 hover:text-accent disabled:opacity-40"
              onClick={() => void archive()}
            >
              Archiver l’article…
            </button>
          </div>

          <AdminPostMeta
            author={article.author}
            excerpt={article.excerpt}
            publishedAt={publishedAt}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            coverImage={coverImage}
            categoryLabel={categoryLabel}
            onCoverChange={setCoverImage}
            onCategoryChange={setCategoryLabel}
            onPublishedAtChange={setPublishedAt}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
          />
        </aside>
      </form>
    </main>
  )
}

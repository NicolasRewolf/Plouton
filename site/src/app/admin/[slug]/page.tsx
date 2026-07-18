"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { AdminEditorLazy } from "@/components/admin/AdminEditorLazy"
import type { Article } from "@/lib/content"
import {
  articleBodyToEditorJs,
  type EditorJsDocument,
} from "@/lib/editorjs"

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [bodyDoc, setBodyDoc] = useState<EditorJsDocument | null>(null)
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
        setBodyDoc(articleBodyToEditorJs(data.body))
      })
  }, [slug])

  async function save(status: "draft" | "published") {
    if (!article || !bodyDoc) return
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
      status,
      body: bodyDoc,
      bodyHtml: undefined,
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

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save(article?.status === "published" ? "published" : "draft")
  }

  if (!article || !bodyDoc)
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
          <AdminEditorLazy initialData={bodyDoc} onChange={setBodyDoc} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Publication
            </p>
            <p className="mt-2 text-[12px] text-muted">
              Actuellement :{" "}
              <span className="font-medium text-navy">
                {article.status === "published" ? "Publié" : "Brouillon"}
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
            </div>
            {error ? <p className="mt-3 text-[13px] text-accent">{error}</p> : null}
          </div>

          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Métadonnées
            </p>
            <label className="mt-3 grid gap-1 text-[13px] text-navy">
              Auteur
              <input
                name="author"
                defaultValue={article.author}
                className="admin-input"
              />
            </label>
            <label className="mt-3 grid gap-1 text-[13px] text-navy">
              Extrait
              <textarea
                name="excerpt"
                defaultValue={article.excerpt}
                rows={3}
                className="admin-input resize-y"
              />
            </label>
          </div>
        </aside>
      </form>
    </main>
  )
}

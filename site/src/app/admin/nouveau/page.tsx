"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { AdminEditorLazy } from "@/components/admin/AdminEditorLazy"
import { AdminPostMeta } from "@/components/admin/AdminPostMeta"
import { htmlToParagraphs } from "@/lib/article-body"
import { todayIsoDate, type PostStatus } from "@/lib/post-status"

export default function NewPostPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [bodyHtml, setBodyHtml] = useState("<p></p>")
  const [coverImage, setCoverImage] = useState("")
  const [categoryLabels, setCategoryLabels] = useState<string[]>([
    "Ressources et notions juridiques",
  ])
  const [publishedAt, setPublishedAt] = useState(todayIsoDate())
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")

  async function save(status: PostStatus) {
    const form = formRef.current
    if (!form) return
    setSaving(true)
    setError("")
    const fd = new FormData(form)
    const title = String(fd.get("title") || "")
    const slug =
      String(fd.get("slug") || "") ||
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        excerpt: fd.get("excerpt"),
        status,
        author: fd.get("author"),
        publishedAt,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        coverImage: coverImage || null,
        categories: categoryLabels.length ? categoryLabels : undefined,
        bodyHtml,
        body: htmlToParagraphs(bodyHtml),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      setError("Enregistrement impossible")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save("draft")
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
            Blog
          </p>
          <h1 className="font-display mt-1 text-[26px] font-medium text-navy">
            Nouvel article
          </h1>
        </div>
        <Link href="/admin" className="text-[13px] text-muted hover:text-navy">
          ← Retour liste
        </Link>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="space-y-4">
          <label className="grid gap-1.5 text-[13px] font-medium text-navy">
            Titre *
            <input
              required
              name="title"
              className="admin-input text-[16px] font-medium"
              placeholder="Titre de l’article"
            />
          </label>
          <AdminEditorLazy initialHtml={bodyHtml} onChange={setBodyHtml} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Publication
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Brouillon = visible seulement ici. Publier = en ligne. Programmer =
              le jour de la date choisie.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn-secondary w-full"
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
              >
                Programmer
              </button>
            </div>
            {error ? <p className="mt-3 text-[13px] text-accent">{error}</p> : null}
          </div>

          <AdminPostMeta
            author="Cabinet Plouton"
            excerpt=""
            publishedAt={publishedAt}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            coverImage={coverImage}
            categoryLabels={categoryLabels}
            showSlug
            onCoverChange={setCoverImage}
            onCategoriesChange={setCategoryLabels}
            onPublishedAtChange={setPublishedAt}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
          />
        </aside>
      </form>
    </main>
  )
}

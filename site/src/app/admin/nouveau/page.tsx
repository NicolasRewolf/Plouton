"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { AdminEditorLazy } from "@/components/admin/AdminEditorLazy"
import {
  emptyEditorJsDoc,
  type EditorJsDocument,
} from "@/lib/editorjs"

export default function NewPostPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [bodyDoc, setBodyDoc] = useState<EditorJsDocument>(() => emptyEditorJsDoc())

  async function save(status: "draft" | "published") {
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
        body: bodyDoc,
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
          <AdminEditorLazy initialData={bodyDoc} onChange={setBodyDoc} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Publication
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Brouillon = visible seulement ici. Publier = en ligne tout de suite.
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
            </div>
            {error ? <p className="mt-3 text-[13px] text-accent">{error}</p> : null}
          </div>

          <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
            <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
              Métadonnées
            </p>
            <label className="mt-3 grid gap-1 text-[13px] text-navy">
              Slug (URL)
              <input
                name="slug"
                placeholder="auto si vide"
                className="admin-input font-mono text-[12px]"
              />
            </label>
            <label className="mt-3 grid gap-1 text-[13px] text-navy">
              Auteur
              <input
                name="author"
                defaultValue="Cabinet Plouton"
                className="admin-input"
              />
            </label>
            <label className="mt-3 grid gap-1 text-[13px] text-navy">
              Extrait
              <textarea name="excerpt" rows={3} className="admin-input resize-y" />
            </label>
          </div>
        </aside>
      </form>
    </main>
  )
}

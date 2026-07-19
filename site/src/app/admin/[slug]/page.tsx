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
import {
  assessHtmlEditRisk,
  mergeEditRisks,
  type EditGuardResult,
} from "@/lib/post-edit-guard"
import { statusLabel, todayIsoDate, type PostStatus } from "@/lib/post-status"

type VersionMeta = {
  id: number
  createdAt: string
  title: string | null
  authorEmail: string | null
}

const EMPTY_RISK: EditGuardResult = {
  blocked: false,
  reasons: [],
  source: "none",
}

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [bodyHtml, setBodyHtml] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState("")
  const [categoryLabels, setCategoryLabels] = useState<string[]>([])
  const [publishedAt, setPublishedAt] = useState(todayIsoDate())
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [forceRichEdit, setForceRichEdit] = useState(false)
  const [versions, setVersions] = useState<VersionMeta[]>([])
  const [serverRisk, setServerRisk] = useState<EditGuardResult>(EMPTY_RISK)
  const [authorSlug, setAuthorSlug] = useState("")
  const [reviewerSlug, setReviewerSlug] = useState("")
  const [authorLabel, setAuthorLabel] = useState("")
  const [bodyDoc, setBodyDoc] = useState<Record<string, unknown> | null>(null)
  const [dirty, setDirty] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const risk = mergeEditRisks(
    serverRisk,
    bodyHtml !== null ? assessHtmlEditRisk(bodyHtml) : EMPTY_RISK
  )

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    fetch(`/api/posts?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then(
        (
          data: Article & {
            error?: string
            editGuard?: EditGuardResult
          }
        ) => {
          if (data.error) {
            setArticle(null)
            return
          }
          const { editGuard, ...articleData } = data
          setArticle(articleData)
          setBodyHtml(articleToEditorHtml(articleData))
          setBodyDoc(articleData.bodyDoc || null)
          setCoverImage(articleData.coverImage || "")
          setCategoryLabels(
            articleData.categories?.length ? articleData.categories : []
          )
          setPublishedAt(
            (articleData.publishedAt || todayIsoDate()).slice(0, 10)
          )
          setMetaTitle(articleData.metaTitle || "")
          setMetaDescription(articleData.metaDescription || "")
          setAuthorSlug(
            articleData.authorSlug || articleData.authorId || ""
          )
          setReviewerSlug(articleData.reviewerSlug || "")
          setAuthorLabel(articleData.author || "")
          if (editGuard) setServerRisk(editGuard)
        }
      )
    fetch(`/api/posts/versions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: { versions?: VersionMeta[] }) => {
        if (Array.isArray(data.versions)) setVersions(data.versions)
      })
      .catch(() => {})
  }, [slug])

  async function save(status: PostStatus) {
    if (!article || bodyHtml === null) return
    const form = formRef.current
    if (!form) return
    if (risk.blocked && !forceRichEdit) {
      setError(
        "Édition gelée : contenu riche. Cochez « éditer quand même » seulement si vous acceptez la perte."
      )
      return
    }
    setSaving(true)
    setError("")
    const fd = new FormData(form)
    const next: Article & { forceRichEdit?: boolean } = {
      ...article,
      title: String(fd.get("title")),
      excerpt: String(fd.get("excerpt")),
      author: authorLabel || String(fd.get("author")),
      authorId: authorSlug || article.authorId,
      authorSlug: authorSlug || article.authorSlug,
      reviewerSlug: reviewerSlug || undefined,
      reviewedAt: reviewerSlug
        ? new Date().toISOString()
        : undefined,
      publishedAt,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      coverImage: coverImage || null,
      categories: categoryLabels.length
        ? categoryLabels
        : article.categories?.length
          ? article.categories
          : ["Ressources et notions juridiques"],
      status,
      bodyHtml,
      bodyDoc: bodyDoc || undefined,
      body: htmlToParagraphs(bodyHtml),
      forceRichEdit: forceRichEdit || undefined,
    }
    const res = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
    setSaving(false)
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error || "Échec de l’enregistrement")
      return
    }
    setDirty(false)
    setArticle(next)
    if (status === "draft") {
      // Autosave / brouillon : rester sur la page
      router.refresh()
      return
    }
    router.push("/admin")
    router.refresh()
  }

  function onBodyChange(html: string, json?: Record<string, unknown>) {
    setBodyHtml(html)
    if (json) setBodyDoc(json)
    setDirty(true)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      // Autosave brouillon uniquement si déjà connu et pas gelé
      if (!article || (risk.blocked && !forceRichEdit)) return
      void save("draft")
    }, 45000)
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

  async function restoreVersion(versionId: number) {
    if (
      !window.confirm(
        "Restaurer cette version ? L’état actuel sera aussi sauvegardé dans l’historique."
      )
    )
      return
    setSaving(true)
    setError("")
    const res = await fetch("/api/posts/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    })
    setSaving(false)
    if (!res.ok) {
      setError("Restauration impossible")
      return
    }
    const data = (await res.json()) as Article
    setArticle(data)
    setBodyHtml(articleToEditorHtml(data))
    setCategoryLabels(data.categories || [])
    setMetaTitle(data.metaTitle || "")
    setMetaDescription(data.metaDescription || "")
    setCoverImage(data.coverImage || "")
    // refresh versions list
    const v = await fetch(
      `/api/posts/versions?slug=${encodeURIComponent(slug)}`
    ).then((r) => r.json())
    if (Array.isArray(v.versions)) setVersions(v.versions)
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
            href={`/admin/apercu/${article.slug}`}
            className="text-muted hover:text-navy"
          >
            Aperçu
          </Link>
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

      {risk.blocked ? (
        <div className="mb-6 rounded-[14px] border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-navy">
          <p className="font-semibold text-amber-900">Édition gelée (contenu riche)</p>
          <p className="mt-1 text-navy/80">
            Cet article contient des éléments (tableaux, accordéons, images,
            embeds…) que l’éditeur actuel détruirait à la sauvegarde. Attendez
            la mise à jour TipTap, ou forcez uniquement en connaissance de
            cause.
          </p>
          <p className="mt-1 font-mono text-[11px] text-navy/60">
            {risk.reasons.slice(0, 10).join(", ")}
            {risk.reasons.length > 10 ? "…" : ""}
          </p>
          <label className="mt-3 flex items-center gap-2 text-[12px] text-amber-950">
            <input
              type="checkbox"
              checked={forceRichEdit}
              onChange={(e) => setForceRichEdit(e.target.checked)}
            />
            Éditer quand même (je comprends le risque de perte)
          </label>
        </div>
      ) : null}

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
              disabled={risk.blocked && !forceRichEdit}
            />
          </label>
          <AdminEditorLazy initialHtml={bodyHtml} onChange={onBodyChange} />
          {dirty ? (
            <p className="text-[12px] text-muted">
              Modifications non enregistrées
              {saving ? " — enregistrement…" : ""}
            </p>
          ) : null}
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
                disabled={saving || (risk.blocked && !forceRichEdit)}
                className="admin-btn admin-btn-secondary w-full"
                onClick={() => void save("draft")}
              >
                {saving ? "…" : "Enregistrer brouillon"}
              </button>
              <button
                type="button"
                disabled={saving || (risk.blocked && !forceRichEdit)}
                className="admin-btn admin-btn-primary w-full"
                onClick={() => void save("published")}
              >
                Publier
              </button>
              <button
                type="button"
                disabled={saving || (risk.blocked && !forceRichEdit)}
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
            author={authorLabel || article.author}
            authorSlug={authorSlug}
            reviewerSlug={reviewerSlug}
            excerpt={article.excerpt}
            publishedAt={publishedAt}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            coverImage={coverImage}
            categoryLabels={categoryLabels}
            onCoverChange={setCoverImage}
            onCategoriesChange={setCategoryLabels}
            onPublishedAtChange={setPublishedAt}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onAuthorChange={({ author, authorId, authorSlug: s }) => {
              setAuthorLabel(author)
              setAuthorSlug(s || authorId)
            }}
            onReviewerChange={setReviewerSlug}
          />

          {versions.length > 0 ? (
            <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
              <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
                Versions
              </p>
              <ul className="mt-3 space-y-2">
                {versions.slice(0, 8).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-start justify-between gap-2 text-[12px]"
                  >
                    <span className="min-w-0 text-muted">
                      {new Date(v.createdAt).toLocaleString("fr-FR")}
                      {v.authorEmail ? (
                        <span className="block truncate">{v.authorEmail}</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      className="shrink-0 text-navy underline-offset-2 hover:underline"
                      onClick={() => void restoreVersion(v.id)}
                    >
                      Restaurer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </form>
    </main>
  )
}

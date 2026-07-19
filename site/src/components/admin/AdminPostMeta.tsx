"use client"

import { useEffect, useState } from "react"
import { AdminCoverField } from "@/components/admin/AdminCoverField"
import { todayIsoDate, type PostStatus } from "@/lib/post-status"

interface CategoryOpt {
  id: string
  label: string
  slug: string
}

interface AdminPostMetaProps {
  author: string
  excerpt: string
  publishedAt: string
  metaTitle: string
  metaDescription: string
  coverImage: string
  /** Multi-catégories (labels) — P0-D */
  categoryLabels: string[]
  showSlug?: boolean
  slugDefault?: string
  onCoverChange: (url: string) => void
  onCategoriesChange: (labels: string[]) => void
  onPublishedAtChange: (iso: string) => void
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
}

/**
 * Panneau métadonnées admin (SEO, date, cover, catégories multi).
 */
export function AdminPostMeta({
  author,
  excerpt,
  publishedAt,
  metaTitle,
  metaDescription,
  coverImage,
  categoryLabels,
  showSlug,
  slugDefault,
  onCoverChange,
  onCategoriesChange,
  onPublishedAtChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
}: AdminPostMetaProps) {
  const [categories, setCategories] = useState<CategoryOpt[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: CategoryOpt[]) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(() => {})
  }, [])

  function toggleCategory(label: string) {
    if (categoryLabels.includes(label)) {
      onCategoriesChange(categoryLabels.filter((l) => l !== label))
    } else {
      onCategoriesChange([...categoryLabels, label])
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
        <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
          Métadonnées
        </p>
        {showSlug ? (
          <label className="mt-3 grid gap-1 text-[13px] text-navy">
            Slug (URL)
            <input
              name="slug"
              defaultValue={slugDefault}
              placeholder="auto si vide"
              className="admin-input font-mono text-[12px]"
            />
          </label>
        ) : null}
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Auteur
          <input name="author" defaultValue={author} className="admin-input" />
        </label>
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Date de publication
          <input
            type="date"
            name="publishedAt"
            value={publishedAt.slice(0, 10) || todayIsoDate()}
            onChange={(e) => onPublishedAtChange(e.target.value)}
            className="admin-input"
          />
        </label>
        <fieldset className="mt-3">
          <legend className="text-[13px] text-navy">Catégories (plusieurs possibles)</legend>
          <div className="mt-2 flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-lg border border-[rgba(23,71,94,0.1)] p-2">
            {categories.map((c) => {
              const checked = categoryLabels.includes(c.label)
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 text-[13px] text-navy"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.label)}
                    className="size-3.5 accent-navy"
                  />
                  {c.label}
                </label>
              )
            })}
            {categoryLabels
              .filter((l) => !categories.some((c) => c.label === l))
              .map((l) => (
                <label
                  key={l}
                  className="flex cursor-pointer items-center gap-2 text-[13px] text-navy"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleCategory(l)}
                    className="size-3.5 accent-navy"
                  />
                  {l} <span className="text-muted">(hors liste)</span>
                </label>
              ))}
          </div>
        </fieldset>
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Extrait
          <textarea
            name="excerpt"
            defaultValue={excerpt}
            rows={3}
            className="admin-input resize-y"
          />
        </label>
        <div className="mt-3">
          <AdminCoverField value={coverImage} onChange={onCoverChange} />
        </div>
      </div>

      <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
        <p className="text-[12px] font-semibold tracking-wide text-navy/50 uppercase">
          SEO
        </p>
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Meta title
          <input
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder="Titre onglet / Google"
            className="admin-input"
            maxLength={70}
          />
        </label>
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Meta description
          <textarea
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="Résumé pour Google (~155 car.)"
            rows={3}
            className="admin-input resize-y"
            maxLength={180}
          />
        </label>
      </div>
    </div>
  )
}

export type { PostStatus }

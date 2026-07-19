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
  categoryLabel: string
  showSlug?: boolean
  slugDefault?: string
  onCoverChange: (url: string) => void
  onCategoryChange: (label: string) => void
  onPublishedAtChange: (iso: string) => void
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
}

/**
 * Panneau métadonnées admin (SEO, date, cover, catégorie).
 * Champs name=* restent dans le formulaire parent pour author/excerpt/slug.
 */
export function AdminPostMeta({
  author,
  excerpt,
  publishedAt,
  metaTitle,
  metaDescription,
  coverImage,
  categoryLabel,
  showSlug,
  slugDefault,
  onCoverChange,
  onCategoryChange,
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
          <input
            name="author"
            defaultValue={author}
            className="admin-input"
          />
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
        <label className="mt-3 grid gap-1 text-[13px] text-navy">
          Catégorie
          <select
            className="admin-input"
            value={categoryLabel}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {!categoryLabel ? <option value="">— Choisir —</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
            {categoryLabel &&
            !categories.some((c) => c.label === categoryLabel) ? (
              <option value={categoryLabel}>{categoryLabel}</option>
            ) : null}
          </select>
        </label>
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

"use client"

import { useMemo, useState } from "react"
import { AffaireCard, type AffaireCardItem } from "@/components/AffaireCard"
import { labelEquals } from "@/lib/category-match"

interface CategoryOption {
  label: string
  slug: string
}

const PAGE_SIZE = 24

function matchesCategory(
  article: AffaireCardItem,
  slug: string | null,
  categories: CategoryOption[]
) {
  if (!slug) return true
  const cat = categories.find((c) => c.slug === slug)
  if (!cat) return false
  return article.categories.some((c) => labelEquals(c, cat.label))
}

/** Grille éditoriale « Nos affaires » — filtres + cards preview. */
export function AffairesGallery({
  articles,
  categories,
}: {
  articles: AffaireCardItem[]
  categories: CategoryOption[]
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(
    () => articles.filter((a) => matchesCategory(a, activeSlug, categories)),
    [articles, activeSlug, categories]
  )

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  function selectCategory(slug: string | null) {
    setActiveSlug(slug)
    setVisible(PAGE_SIZE)
  }

  return (
    <div>
      <nav
        aria-label="Filtrer par catégorie"
        className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        <FilterChip
          label="Toutes"
          active={activeSlug === null}
          onClick={() => selectCategory(null)}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.slug}
            label={c.label}
            active={activeSlug === c.slug}
            onClick={() => selectCategory(c.slug)}
          />
        ))}
      </nav>

      <p className="mt-5 text-[13px] tabular-nums text-muted">
        {filtered.length} affaire{filtered.length > 1 ? "s" : ""}
        {activeSlug ? " dans cette catégorie" : ""}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((article, index) => (
          <AffaireCard
            key={article.slug}
            article={article}
            featured={index === 0 && activeSlug === null && visible <= PAGE_SIZE}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-[15px] text-muted">
          Aucune affaire dans cette catégorie pour le moment.
        </p>
      ) : null}

      {hasMore ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((n) => n + PAGE_SIZE)}
            className="rounded-full bg-navy px-7 py-3 text-[14px] font-medium text-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-navy-soft active:scale-[0.96]"
          >
            Voir plus d&apos;affaires
          </button>
        </div>
      ) : null}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "shrink-0 min-h-10 rounded-full bg-navy px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(23,71,94,0.18)] transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
          : "shrink-0 min-h-10 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-navy shadow-[0_1px_2px_rgba(23,71,94,0.05),0_4px_14px_rgba(23,71,94,0.04)] transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-[0_2px_8px_rgba(23,71,94,0.08)] active:scale-[0.96]"
      }
    >
      {label}
    </button>
  )
}

export type { AffaireCardItem }

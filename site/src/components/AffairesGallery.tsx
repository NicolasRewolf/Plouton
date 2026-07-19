"use client"

import { useMemo, useState } from "react"
import { AffaireCard, type AffaireCardItem } from "@/components/AffaireCard"
import { labelEquals } from "@/lib/category-match"

interface CategoryOption {
  label: string
  slug: string
}

type SortMode = "recent" | "views"

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

function pluralFr(n: number, singular: string, plural: string) {
  return n > 1 ? plural : singular
}

function sortArticles(articles: AffaireCardItem[], sort: SortMode) {
  const copy = [...articles]
  if (sort === "views")
    return copy.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  return copy.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

/** Grille éditoriale filtrable — Affaires, Médias, Ressources. */
export function AffairesGallery({
  articles,
  categories,
  itemSingular = "affaire",
  itemPlural = "affaires",
  emptyMessage = "Aucune affaire dans cette catégorie pour le moment.",
  loadMoreLabel = "Voir plus d'affaires",
  filterAriaLabel = "Filtrer par catégorie",
  enableSort = false,
}: {
  articles: AffaireCardItem[]
  categories: CategoryOption[]
  itemSingular?: string
  itemPlural?: string
  emptyMessage?: string
  loadMoreLabel?: string
  filterAriaLabel?: string
  /** Chips « + récentes / + consultées » (nos-affaires). */
  enableSort?: boolean
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>("recent")
  const [visible, setVisible] = useState(PAGE_SIZE)

  const hasViewStats = useMemo(
    () => enableSort && articles.some((a) => (a.viewCount ?? 0) > 0),
    [articles, enableSort]
  )

  const filtered = useMemo(() => {
    const byCat = articles.filter((a) => matchesCategory(a, activeSlug, categories))
    return hasViewStats ? sortArticles(byCat, sort) : byCat
  }, [articles, activeSlug, categories, sort, hasViewStats])

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  function selectCategory(slug: string | null) {
    setActiveSlug(slug)
    setVisible(PAGE_SIZE)
  }

  function selectSort(next: SortMode) {
    setSort(next)
    setVisible(PAGE_SIZE)
  }

  return (
    <div>
      <nav
        aria-label={filterAriaLabel}
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

      {hasViewStats ? (
        <nav aria-label="Trier les affaires" className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="+ récentes"
            active={sort === "recent"}
            onClick={() => selectSort("recent")}
          />
          <FilterChip
            label="+ consultées"
            active={sort === "views"}
            onClick={() => selectSort("views")}
          />
        </nav>
      ) : null}

      <p className="mt-5 text-[13px] tabular-nums text-muted">
        {filtered.length} {pluralFr(filtered.length, itemSingular, itemPlural)}
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
        <p className="mt-16 text-center text-[15px] text-muted">{emptyMessage}</p>
      ) : null}

      {hasMore ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((n) => n + PAGE_SIZE)}
            className="rounded-full bg-navy px-7 py-3 text-[14px] font-medium text-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-navy-soft active:scale-[0.96]"
          >
            {loadMoreLabel}
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

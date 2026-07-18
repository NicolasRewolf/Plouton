"use client"

import Link from "next/link"
import { useRef } from "react"
import { AffaireCard, type AffaireCardItem } from "@/components/AffaireCard"

/** Carrousel horizontal d’affaires — pages expertise (catégorie liée). */
export function AffairesCarousel({
  articles,
  title,
  categoryLabel,
  seeAllHref = "/nos-affaires",
  seeAllLabel = "Voir toutes les affaires",
}: {
  articles: AffaireCardItem[]
  title: string
  /** Catégorie du contexte (page expertise) — affichée sur les cards */
  categoryLabel?: string
  seeAllHref?: string
  seeAllLabel?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (!articles.length) return null

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(640, el.clientWidth * 0.85), behavior: "smooth" })
  }

  return (
    <section id="affaires" className="scroll-mt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.35rem] font-medium leading-[1.15] tracking-[-0.02em] text-navy text-balance">
              {title}
            </h2>
          <p className="mt-1.5 text-[14px] tabular-nums text-muted">
            {articles.length} affaire{articles.length > 1 ? "s" : ""} récente
            {articles.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Afficher les affaires précédentes"
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-navy shadow-[0_1px_3px_rgba(23,71,94,0.08),0_6px_16px_rgba(23,71,94,0.06)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-[0_2px_8px_rgba(23,71,94,0.12)] active:scale-[0.96] sm:inline-flex"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Afficher les affaires suivantes"
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-navy shadow-[0_1px_3px_rgba(23,71,94,0.08),0_6px_16px_rgba(23,71,94,0.06)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-[0_2px_8px_rgba(23,71,94,0.12)] active:scale-[0.96] sm:inline-flex"
          >
            <Chevron dir="right" />
          </button>
          <Link
            href={seeAllHref}
            className="text-[14px] font-medium text-accent decoration-from-font underline-offset-2 hover:underline"
          >
            {seeAllLabel}
          </Link>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-none -mx-1 mt-6 flex gap-4 overflow-x-auto px-1 pb-3 snap-x snap-mandatory"
      >
        {articles.map((article) => (
          <div key={article.slug} className="snap-start">
            <AffaireCard article={article} compact preferredCategory={categoryLabel} titleAs="h3" />
          </div>
        ))}
      </div>
    </section>
  )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M14.5 6.5L9 12l5.5 5.5" : "M9.5 6.5L15 12l-5.5 5.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

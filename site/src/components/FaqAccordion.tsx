"use client"

import { useMemo, useState } from "react"
import type { FaqItem } from "@/lib/content"

/** FAQ expertise : filtres par sous-catégorie + accordéon. Commun aux ~15 pages. */
export function FaqAccordion({
  items,
  title,
}: {
  items: FaqItem[]
  title?: string
}) {
  const sous = useMemo(() => {
    const order: string[] = []
    const seen = new Set<string>()
    for (const item of items) {
      const s = item.sousExpertise?.trim()
      if (!s || seen.has(s)) continue
      seen.add(s)
      order.push(s)
    }
    return order
  }, [items])

  const [filter, setFilter] = useState<string | null>(null)

  const visible = useMemo(
    () => (filter ? items.filter((i) => i.sousExpertise === filter) : items),
    [items, filter]
  )

  const groups = useMemo(() => {
    if (filter) return [{ label: filter, items: visible }]
    const map = new Map<string, FaqItem[]>()
    for (const item of visible) {
      const key = item.sousExpertise?.trim() || "Général"
      const list = map.get(key) || []
      list.push(item)
      map.set(key, list)
    }
    // garder l’ordre d’apparition des sous-expertises
    const ordered: { label: string; items: FaqItem[] }[] = []
    for (const label of sous) {
      const list = map.get(label)
      if (list?.length) ordered.push({ label, items: list })
      map.delete(label)
    }
    for (const [label, list] of map) ordered.push({ label, items: list })
    return ordered
  }, [visible, filter, sous])

  if (!items.length) return null

  return (
    <section id="faq" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {title ? (
            <h2 className="font-display text-[1.35rem] font-medium tracking-[-0.02em] text-navy text-balance">
              {title}
            </h2>
          ) : null}
          <p className="mt-1.5 text-[14px] text-muted">
            {visible.length} question{visible.length > 1 ? "s" : ""}
            {filter ? ` · ${filter}` : ""}
          </p>
        </div>
      </div>

      {sous.length > 1 ? (
        <nav
          aria-label="Filtrer la FAQ par sujet"
          className="scrollbar-none -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          <FaqChip label="Toutes" active={filter === null} onClick={() => setFilter(null)} />
          {sous.map((s) => (
            <FaqChip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
          ))}
        </nav>
      ) : null}

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            {!filter && sous.length > 1 ? (
              <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-accent">
                {group.label}
              </h3>
            ) : null}
            <div className="space-y-2.5">
              {group.items.map((item) => (
                <FaqRow key={item.question} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FaqChip({
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
          ? "shrink-0 rounded-full bg-navy px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(23,71,94,0.18)] transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
          : "shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-navy shadow-[0_1px_2px_rgba(23,71,94,0.05),0_4px_14px_rgba(23,71,94,0.04)] transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:shadow-[0_2px_8px_rgba(23,71,94,0.08)] active:scale-[0.96]"
      }
    >
      {label}
    </button>
  )
}

function FaqRow({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-[18px] bg-white p-1 shadow-[0_1px_2px_rgba(23,71,94,0.04),0_8px_22px_rgba(23,71,94,0.05)] transition-[box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] open:shadow-[0_2px_6px_rgba(23,71,94,0.06),0_14px_32px_rgba(23,71,94,0.08)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-[14px] px-4 py-3.5 font-display text-[15px] font-medium leading-snug tracking-[-0.01em] text-navy sm:px-5 sm:text-[16px]">
        <span className="text-balance pr-2">{item.question}</span>
        <span
          aria-hidden
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fog text-accent transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-open:rotate-45"
        >
          <PlusIcon />
        </span>
      </summary>
      <div className="px-4 pb-4 sm:px-5">
        <p className="max-w-3xl text-[14px] leading-relaxed text-muted sm:text-[15px] whitespace-pre-line">
          {item.answer}
        </p>
      </div>
    </details>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

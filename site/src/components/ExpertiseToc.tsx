"use client"

import { useEffect, useRef, useState } from "react"

export interface ExpertiseTocItem {
  id: string
  label: string
  /** Pastille CTA (contact) */
  isCta?: boolean
}

const EASE = "cubic-bezier(0.2, 0, 0, 1)"
/** Header sticky + TOC + marge lecture */
const SCROLL_OFFSET = 150

/** Sommaire sticky expertise — pastilles courtes, état actif au scroll. */
export function ExpertiseToc({ items }: { items: ExpertiseTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || "")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  useEffect(() => {
    if (!items.length) return

    function update() {
      const ids = items.map((i) => i.id)
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= SCROLL_OFFSET) current = id
      }
      setActiveId(current)
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [items])

  useEffect(() => {
    const pill = pillRefs.current[activeId]
    const scroller = scrollerRef.current
    if (!pill || !scroller) return
    const pillLeft = pill.offsetLeft
    const pillWidth = pill.offsetWidth
    const target = pillLeft - scroller.clientWidth / 2 + pillWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
  }, [activeId])

  if (!items.length) return null

  return (
    <nav
      aria-label="Sommaire"
      className="sticky top-[68px] z-40 border-y border-white/40 bg-white/70 backdrop-blur-xl lg:top-[72px]"
    >
      <div
        ref={scrollerRef}
        className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3.5 scrollbar-none lg:px-8"
      >
        {items.map((t) => {
          const isActive = activeId === t.id
          const base =
            "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium leading-none tracking-[-0.01em] transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.96]"

          let tone: string
          if (isActive && t.isCta)
            tone = "bg-accent text-white shadow-[0_1px_2px_rgba(254,75,66,0.2)]"
          else if (isActive)
            tone = "bg-navy text-white shadow-[0_1px_2px_rgba(23,71,94,0.18)]"
          else if (t.isCta)
            tone =
              "bg-navy/[0.06] text-navy hover:bg-navy/[0.1]"
          else tone = "bg-navy/[0.04] text-navy/80 hover:bg-navy/[0.08] hover:text-navy"

          return (
            <a
              key={t.id}
              ref={(el) => {
                pillRefs.current[t.id] = el
              }}
              href={`#${t.id}`}
              aria-current={isActive ? "location" : undefined}
              title={t.label}
              className={`${base} ${tone}`}
              style={{ transitionTimingFunction: EASE }}
              onClick={(e) => {
                const el = document.getElementById(t.id)
                if (!el) return
                e.preventDefault()
                const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET + 8
                window.scrollTo({ top, behavior: "smooth" })
                setActiveId(t.id)
                history.replaceState(null, "", `#${t.id}`)
              }}
            >
              <span className="max-w-[14rem] truncate sm:max-w-none">{t.label}</span>
              <span
                className={
                  isActive
                    ? t.isCta
                      ? "text-white/85"
                      : "text-white/75"
                    : "text-accent"
                }
                aria-hidden
              >
                →
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

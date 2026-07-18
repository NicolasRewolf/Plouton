"use client"

import { useEffect, useRef, useState } from "react"

export interface ExpertiseTocItem {
  id: string
  label: string
  /** Pastille CTA (contact) */
  isCta?: boolean
}

const EASE = "cubic-bezier(0.2, 0, 0, 1)"
/** Header sticky + marge lecture */
const SCROLL_OFFSET = 140

/** Sommaire sticky expertise — pastille active au scroll + barre de progression. */
export function ExpertiseToc({ items }: { items: ExpertiseTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || "")
  const [progress, setProgress] = useState(0)
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

      const first = document.getElementById(ids[0])
      const last = document.getElementById(ids[ids.length - 1])
      if (!first || !last) return
      const start = first.offsetTop
      const end = last.offsetTop + last.offsetHeight - window.innerHeight * 0.45
      const span = Math.max(1, end - start)
      const raw = (window.scrollY + SCROLL_OFFSET - start) / span
      setProgress(Math.min(1, Math.max(0, raw)))
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
      className="sticky top-[68px] z-40 mt-8 border-y border-line/60 bg-[#f9f9f9]/95 backdrop-blur-md lg:top-[72px]"
    >
      <div
        ref={scrollerRef}
        className="mx-auto flex max-w-[1100px] gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
      >
        {items.map((t) => {
          const isActive = activeId === t.id
          const base =
            "inline-flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-2 text-[10px] font-medium tracking-wide transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.96]"
          let tone: string
          if (isActive && t.isCta)
            tone = "bg-accent font-semibold text-white shadow-[0_1px_3px_rgba(254,75,66,0.35)]"
          else if (isActive)
            tone = "bg-navy font-semibold text-white shadow-[0_1px_3px_rgba(23,71,94,0.25)]"
          else if (t.isCta)
            tone =
              "bg-white font-semibold text-navy shadow-sm ring-1 ring-navy/15 hover:text-accent"
          else tone = "bg-white text-navy shadow-sm hover:text-accent"

          return (
            <a
              key={t.id}
              ref={(el) => {
                pillRefs.current[t.id] = el
              }}
              href={`#${t.id}`}
              aria-current={isActive ? "location" : undefined}
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
              {t.label}
              <span className={isActive && t.isCta ? "text-white/90" : "text-accent"} aria-hidden>
                →
              </span>
            </a>
          )
        })}
      </div>

      {/* Barre d’avancement */}
      <div className="h-[2px] w-full bg-line/70" aria-hidden>
        <div
          className="h-full origin-left bg-accent transition-[transform] duration-150"
          style={{
            transform: `scaleX(${progress})`,
            transitionTimingFunction: EASE,
          }}
        />
      </div>
    </nav>
  )
}

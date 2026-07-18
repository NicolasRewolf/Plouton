"use client"

import { useEffect, useRef, useState } from "react"

export interface LegalTocItem {
  id: string
  label: string
}

const EASE = "cubic-bezier(0.2, 0, 0, 1)"
const SCROLL_OFFSET = 140

interface LegalTocProps {
  items: LegalTocItem[]
  /** bar = sticky mobile ; rail = colonne desktop */
  variant: "bar" | "rail"
}

/** Sommaire sticky pages légales — pastilles mobile ou rail vertical desktop. */
export function LegalToc({ items, variant }: LegalTocProps) {
  const [activeId, setActiveId] = useState(items[0]?.id || "")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  useEffect(() => {
    if (!items.length) return

    let raf = 0
    function update() {
      const ids = items.map((i) => i.id)
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= SCROLL_OFFSET) current = id
      }
      setActiveId((prev) => (prev === current ? prev : current))
    }

    function onScroll() {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        update()
      })
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [items])

  useEffect(() => {
    if (variant !== "bar") return
    const pill = pillRefs.current[activeId]
    const scroller = scrollerRef.current
    if (!pill || !scroller) return
    const target = pill.offsetLeft - scroller.clientWidth / 2 + pill.offsetWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
  }, [activeId, variant])

  if (!items.length) return null

  function scrollToId(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET + 8
    window.scrollTo({ top, behavior: "smooth" })
    setActiveId(id)
    history.replaceState(null, "", `#${id}`)
  }

  if (variant === "bar")
    return (
      <nav
        aria-label="Sommaire"
        className="sticky top-[68px] z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl lg:hidden"
      >
        <div
          ref={scrollerRef}
          className="flex gap-1 overflow-x-auto px-5 py-3 scrollbar-none"
        >
          {items.map((item) => {
            const isActive = activeId === item.id
            return (
              <a
                key={item.id}
                ref={(el) => {
                  pillRefs.current[item.id] = el
                }}
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId(item.id)
                }}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,transform] duration-200 active:scale-[0.96] ${
                  isActive
                    ? "bg-navy text-white"
                    : "bg-navy/[0.04] text-navy/75 hover:bg-navy/[0.08] hover:text-navy"
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                {item.label}
              </a>
            )
          })}
        </div>
      </nav>
    )

  return (
    <nav aria-label="Sommaire" className="sticky top-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        Sommaire
      </p>
      <ul className="mt-4 space-y-0.5 border-l border-line">
        {items.map((item) => {
          const isActive = activeId === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId(item.id)
                }}
                className={`relative -ml-px block border-l-2 py-2 pl-4 text-[14px] leading-snug tracking-[-0.01em] transition-[color,border-color] duration-200 ${
                  isActive
                    ? "border-accent font-medium text-navy"
                    : "border-transparent text-navy/55 hover:border-navy/20 hover:text-navy"
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

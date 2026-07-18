"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { MEGA_POLES, SIDE_LINKS, type NavPole } from "@/lib/nav"

const EASE = "cubic-bezier(0.2, 0, 0, 1)"
const OPEN_DELAY = 80
const CLOSE_DELAY = 180

interface HeaderProps {
  variant?: "home" | "site"
}

export function Header({ variant = "site" }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaId, setMegaId] = useState<string | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHome = variant === "home"
  const megaOpen = megaId !== null

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }, [])

  const scheduleOpen = useCallback(
    (id: string) => {
      clearTimers()
      openTimer.current = setTimeout(() => setMegaId(id), OPEN_DELAY)
    },
    [clearTimers]
  )

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => setMegaId(null), CLOSE_DELAY)
  }, [clearTimers])

  const openNow = useCallback(
    (id: string) => {
      clearTimers()
      setMegaId(id)
    },
    [clearTimers]
  )

  const closeNow = useCallback(() => {
    clearTimers()
    setMegaId(null)
  }, [clearTimers])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeNow()
        setMobileOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [closeNow])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={
          isHome && !megaOpen && !mobileOpen
            ? "absolute inset-x-0 top-0 z-50"
            : "sticky top-0 z-50 border-b border-line/80 bg-white/95 backdrop-blur-md"
        }
        onMouseLeave={scheduleClose}
      >
        <div className="relative mx-auto flex h-[68px] max-w-[1400px] items-center gap-3 px-5 lg:h-[72px] lg:px-8">
          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-80 active:scale-[0.96]"
            style={{ transitionTimingFunction: EASE }}
            aria-label="Cabinet Plouton — Accueil"
            onClick={closeNow}
          >
            <Image
              src="/brand/logo-mark.svg"
              alt=""
              width={28}
              height={21}
              className="h-[21px] w-auto"
              priority
            />
            <span className="font-display text-[15px] font-bold tracking-[0.14em] text-navy">
              PLOUTON
            </span>
          </Link>

          {/* Desktop mega triggers */}
          <nav
            className="ml-2 hidden min-w-0 flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex"
            aria-label="Pôles d’expertise"
            onMouseEnter={() => {
              if (closeTimer.current) {
                clearTimeout(closeTimer.current)
                closeTimer.current = null
              }
            }}
          >
            {MEGA_POLES.map((pole) => (
              <MegaTrigger
                key={pole.id}
                pole={pole}
                isActive={megaId === pole.id}
                onEnter={() => scheduleOpen(pole.id)}
                onFocus={() => openNow(pole.id)}
                onClick={() => (megaId === pole.id ? closeNow() : openNow(pole.id))}
              />
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 md:flex lg:gap-2">
            <nav className="mr-1 hidden items-center gap-0.5 lg:flex" aria-label="Secondaire">
              {SIDE_LINKS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={closeNow}
                  className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-navy/80 transition-[color,background-color,transform] duration-200 hover:bg-fog hover:text-navy active:scale-[0.96]"
                  style={{ transitionTimingFunction: EASE }}
                >
                  {s.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              aria-label="Recherche sur le site"
              className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition-[color,background-color,transform] duration-200 hover:bg-fog hover:text-accent active:scale-[0.96]"
              style={{ transitionTimingFunction: EASE }}
            >
              <SearchIcon />
            </button>

            <Link
              href="/honoraires-rendez-vous"
              onClick={closeNow}
              className="ml-1 inline-flex h-10 items-center rounded-full bg-navy px-4 text-[12px] font-semibold tracking-wide text-white shadow-[0_1px_2px_rgba(23,71,94,0.18)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-navy-soft hover:shadow-[0_4px_14px_rgba(23,71,94,0.2)] active:scale-[0.96]"
              style={{ transitionTimingFunction: EASE }}
            >
              Contact &amp; RDV
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => {
              closeNow()
              setMobileOpen((v) => !v)
            }}
            className="relative z-10 ml-auto flex h-11 w-11 items-center justify-center rounded-full text-navy transition-[background-color,transform] duration-200 hover:bg-fog active:scale-[0.96] lg:hidden"
            style={{ transitionTimingFunction: EASE }}
          >
            <span className="relative h-5 w-5">
              <span
                className={`absolute inset-0 transition-[opacity,transform,filter] duration-200 ${mobileOpen ? "opacity-0 scale-50 blur-[4px]" : "opacity-100 scale-100 blur-0"}`}
                style={{ transitionTimingFunction: EASE }}
              >
                <BurgerIcon />
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-200 ${mobileOpen ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-50 blur-[4px]"}`}
                style={{ transitionTimingFunction: EASE }}
              >
                <CloseIcon />
              </span>
            </span>
          </button>
        </div>

        {/* Mega panel */}
        <MegaPanel
          activeId={megaId}
          onEnter={() => {
            if (closeTimer.current) {
              clearTimeout(closeTimer.current)
              closeTimer.current = null
            }
          }}
          onLeave={scheduleClose}
          onNavigate={closeNow}
        />
      </header>

      {/* Scrim when mega open */}
      <div
        aria-hidden
        className={`fixed inset-0 z-40 bg-navy/20 transition-[opacity] duration-300 lg:block ${megaOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ transitionTimingFunction: EASE, top: 72 }}
        onMouseEnter={scheduleClose}
        onClick={closeNow}
      />

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

function MegaTrigger({
  pole,
  isActive,
  onEnter,
  onFocus,
  onClick,
}: {
  pole: NavPole
  isActive: boolean
  onEnter: () => void
  onFocus: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={isActive}
      aria-haspopup="true"
      onMouseEnter={onEnter}
      onFocus={onFocus}
      onClick={onClick}
      className={`group relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] transition-[color,background-color,transform] duration-200 active:scale-[0.96] xl:px-3.5 ${
        isActive ? "bg-fog text-navy" : "text-navy/85 hover:bg-fog/80 hover:text-navy"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      <span className="max-w-[11rem] truncate xl:max-w-none">{pole.shortLabel}</span>
      <span
        className={`inline-flex transition-transform duration-300 ${isActive ? "rotate-180 text-accent" : "rotate-0 text-navy/50 group-hover:text-accent"}`}
        style={{ transitionTimingFunction: EASE }}
      >
        <ChevronDown />
      </span>
      <span
        aria-hidden
        className={`absolute inset-x-3 -bottom-[1px] h-[2px] origin-left rounded-full bg-accent transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
        style={{ transitionTimingFunction: EASE }}
      />
    </button>
  )
}

function MegaPanel({
  activeId,
  onEnter,
  onLeave,
  onNavigate,
}: {
  activeId: string | null
  onEnter: () => void
  onLeave: () => void
  onNavigate: () => void
}) {
  const open = activeId !== null
  const pole = MEGA_POLES.find((p) => p.id === activeId) ?? MEGA_POLES[0]

  return (
    <div
      className={`absolute inset-x-0 top-full z-50 origin-top transition-[opacity,transform,visibility] duration-300 ${
        open
          ? "visible translate-y-0 opacity-100"
          : "invisible -translate-y-1 opacity-0 pointer-events-none"
      }`}
      style={{ transitionTimingFunction: EASE }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden={!open}
    >
      {/* hover bridge */}
      <div className="h-2 w-full" aria-hidden />
      <div className="border-b border-line/70 bg-white/98 shadow-[0_18px_50px_rgba(23,71,94,0.12),0_2px_8px_rgba(23,71,94,0.04)] backdrop-blur-md">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-[220px_1fr] lg:gap-12 lg:px-10 lg:py-10">
          <div
            key={pole.id + "-intro"}
            className="animate-[megaFade_320ms_cubic-bezier(0.2,0,0,1)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Expertise
            </p>
            <h2 className="mt-3 font-display text-[22px] font-medium leading-[1.15] tracking-[-0.02em] text-navy text-balance">
              {pole.label}
            </h2>
            <Link
              href={pole.href}
              onClick={onNavigate}
              className="group/cta mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-navy transition-colors duration-200 hover:text-accent"
              style={{ transitionTimingFunction: EASE }}
            >
              Voir le pôle
              <span className="inline-flex transition-transform duration-200 group-hover/cta:translate-x-0.5" style={{ transitionTimingFunction: EASE }}>
                <ArrowRight />
              </span>
            </Link>
          </div>

          <ul
            key={pole.id + "-list"}
            className="grid gap-1 sm:grid-cols-2"
            role="list"
          >
            {pole.children.map((child, i) => (
              <li
                key={child.href}
                className="animate-[megaFade_320ms_cubic-bezier(0.2,0,0,1)]"
                style={{ animationDelay: `${60 + i * 45}ms`, animationFillMode: "both" }}
              >
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className="group flex items-start gap-3 rounded-[16px] px-3.5 py-3.5 transition-[background-color,transform] duration-200 hover:bg-fog active:scale-[0.99]"
                  style={{ transitionTimingFunction: EASE }}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow-[0_1px_2px_rgba(23,71,94,0.06),0_4px_12px_rgba(23,71,94,0.05)] transition-[transform,background-color,color] duration-200 group-hover:bg-accent group-hover:text-white group-hover:scale-105" style={{ transitionTimingFunction: EASE }}>
                    <ArrowRight className="transition-transform duration-200 group-hover:translate-x-px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] font-medium leading-snug tracking-[-0.01em] text-navy transition-colors duration-200 group-hover:text-navy">
                      {child.label}
                    </span>
                    {child.hint ? (
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                        {child.hint}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(MEGA_POLES[0]?.id ?? null)
  const titleId = useId()

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-navy/25 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        style={{ transitionTimingFunction: EASE }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 right-0 flex w-[min(100%,420px)] flex-col bg-white shadow-[-12px_0_40px_rgba(23,71,94,0.12)] transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
          <p id={titleId} className="font-display text-sm font-semibold tracking-[0.12em] text-navy">
            Menu
          </p>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition-[background-color,transform] duration-200 hover:bg-fog active:scale-[0.96]"
            style={{ transitionTimingFunction: EASE }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1.5">
            {MEGA_POLES.map((pole) => {
              const isOpen = expanded === pole.id
              return (
                <div key={pole.id} className="rounded-[18px] bg-fog/60 p-1.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : pole.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-[14px] px-3.5 py-3 text-left transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.99]"
                    style={{ transitionTimingFunction: EASE }}
                  >
                    <span className="font-display text-[15px] font-medium tracking-[-0.01em] text-navy">
                      {pole.label}
                    </span>
                    <span
                      className={`text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      style={{ transitionTimingFunction: EASE }}
                    >
                      <ChevronDown />
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    style={{ transitionTimingFunction: EASE }}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-0.5 px-1.5 pb-2 pt-1">
                        {pole.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              onClick={onClose}
                              className="group flex items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-[14px] text-navy transition-[background-color,color,transform] duration-200 hover:bg-white hover:text-accent active:scale-[0.99]"
                              style={{ transitionTimingFunction: EASE }}
                            >
                              <span>{c.label}</span>
                              <span className="text-navy/30 transition-[transform,color,opacity] duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100 opacity-60" style={{ transitionTimingFunction: EASE }}>
                                <ArrowRight />
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-1 border-t border-line pt-5">
            {SIDE_LINKS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-[14px] px-3.5 py-3 text-[15px] font-medium text-navy transition-[background-color,transform] duration-200 hover:bg-fog active:scale-[0.99]"
                style={{ transitionTimingFunction: EASE }}
              >
                {s.label}
                <span className="text-navy/35">
                  <ArrowRight />
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="/honoraires-rendez-vous"
            onClick={onClose}
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-navy text-[14px] font-semibold text-white transition-[transform,background-color] duration-200 hover:bg-navy-soft active:scale-[0.96]"
            style={{ transitionTimingFunction: EASE }}
          >
            Contact &amp; RDV
          </Link>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BurgerIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden className="mx-auto mt-0.5">
      <path d="M1 1h18M1 7h18M1 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 4.25L6 7.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={className}>
      <path
        d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

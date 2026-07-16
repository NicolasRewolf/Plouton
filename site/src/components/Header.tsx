"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const poles = [
  {
    label: "Défense pénale",
    children: [
      { label: "Droit pénal", href: "/defense-penale/droit-penal" },
      { label: "Procès criminels", href: "/defense-penale/droit-penal" },
      { label: "Trafic de stupéfiants", href: "/defense-penale/droit-penal" },
      { label: "Violences conjugales et féminicides", href: "/defense-penale/droit-penal" },
      { label: "Droit pénal des affaires", href: "/defense-penale/droit-penal" },
    ],
  },
  {
    label: "Indemnisation des victimes",
    children: [
      { label: "Victimes de délits ou crimes", href: "/#expertises" },
      { label: "Accidents de la route", href: "/#expertises" },
      { label: "Droit et accidents du travail", href: "/#expertises" },
      { label: "Accidents et erreurs médicales", href: "/#expertises" },
      { label: "Accidents de la vie courante", href: "/#expertises" },
    ],
  },
  {
    label: "Droit des contrats et des personnes",
    children: [
      { label: "Droit des assurances", href: "/#expertises" },
      { label: "Défense des consommateurs", href: "/#expertises" },
      { label: "Droit de la famille", href: "/#expertises" },
      { label: "Divorce", href: "/#expertises" },
    ],
  },
]

const secondary = [
  { href: "/", label: "Accueil" },
  { href: "/contact", label: "Je prends rendez-vous" },
  { href: "/#equipe", label: "Équipe" },
  { href: "/#affaires", label: "Affaires" },
  { href: "/post/indemnisation-passager-accident-route", label: "Ressources" },
  { href: "/#medias", label: "Médias" },
]

const poleNav = [
  { label: "DÉFENSE PÉNALE", href: "/defense-penale/droit-penal" },
  { label: "INDEMNISATION DES VICTIMES", href: "/#expertises" },
  { label: "DROIT DES CONTRATS ET DES PERSONNES", href: "/#expertises" },
]

const sideNav = [
  { href: "/#affaires", label: "AFFAIRES" },
  { href: "/#medias", label: "MÉDIAS" },
  { href: "/post/indemnisation-passager-accident-route", label: "RESSOURCES" },
  { href: "/#equipe", label: "ÉQUIPE" },
]

interface HeaderProps {
  /** Accueil Wix = logo + loupe + burger. Autres pages = nav complète. */
  variant?: "home" | "site"
}

export function Header({ variant = "site" }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isHome = variant === "home"

  return (
    <>
      <header className={isHome ? "absolute inset-x-0 top-0 z-50" : "sticky top-0 z-50 border-b border-line bg-white"}>
        <div
          className={
            isHome
              ? "relative mx-auto flex h-[72px] max-w-[1400px] items-center px-5 lg:px-10"
              : "mx-auto flex h-[64px] max-w-[1400px] items-center gap-4 px-5 lg:px-8"
          }
        >
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2.5" aria-label="Cabinet Plouton — Accueil">
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

          {isHome ? (
            <>
              <button
                type="button"
                aria-label="Recherche sur le site"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 text-navy hover:text-accent"
              >
                <SearchIcon />
              </button>
              <button
                type="button"
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((v) => !v)}
                className="relative z-10 ml-auto p-2 text-navy hover:text-accent"
              >
                {isOpen ? <CloseIcon /> : <BurgerIcon />}
              </button>
            </>
          ) : (
            <>
              <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 xl:gap-7 lg:flex" aria-label="Pôles">
                {poleNav.map((p) => (
                  <Link
                    key={p.label}
                    href={p.href}
                    className="whitespace-nowrap text-[11px] font-semibold tracking-[0.06em] text-navy hover:text-accent"
                  >
                    {p.label}
                  </Link>
                ))}
              </nav>
              <nav className="ml-auto hidden items-center gap-4 md:flex" aria-label="Secondaire">
                {sideNav.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="text-[11px] font-semibold tracking-[0.08em] text-navy hover:text-accent"
                  >
                    {s.label}
                  </Link>
                ))}
                <button type="button" aria-label="Recherche sur le site" className="p-1 text-navy hover:text-accent">
                  <SearchIcon />
                </button>
                <Link
                  href="/contact"
                  className="rounded-full bg-navy px-4 py-2 text-[12px] font-semibold tracking-wide text-white hover:bg-navy-soft"
                >
                  Contact &amp; RDV
                </Link>
              </nav>
              <button
                type="button"
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((v) => !v)}
                className="ml-auto p-2 text-navy hover:text-accent lg:hidden"
              >
                {isOpen ? <CloseIcon /> : <BurgerIcon />}
              </button>
            </>
          )}
        </div>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-white pt-[72px]">
          <nav className="mx-auto max-w-3xl px-6 py-8" aria-label="Menu">
            <ul className="space-y-6">
              {secondary.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-2xl font-semibold text-navy hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-10 space-y-8 border-t border-line pt-8">
              {poles.map((pole) => (
                <div key={pole.label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {pole.label}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {pole.children.map((c) => (
                      <li key={c.label}>
                        <Link
                          href={c.href}
                          onClick={() => setIsOpen(false)}
                          className="text-[15px] text-navy hover:text-accent"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BurgerIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden>
      <path d="M0 1h22M0 8h22M0 15h22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

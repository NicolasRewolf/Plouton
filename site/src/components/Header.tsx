"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const poles = [
  {
    label: "Défense pénale",
    children: [
      { label: "Droit pénal", href: "/defense-penale/droit-penal" },
      { label: "Procès criminels", href: "/defense-penale/proces-criminel" },
      { label: "Trafic de stupéfiants", href: "/defense-penale/trafic-de-stupefiants" },
      {
        label: "Violences conjugales et féminicides",
        href: "/defense-penale/violences-conjugales-et-feminicides",
      },
      { label: "Droit pénal des affaires", href: "/defense-penale/droit-penal-des-affaires" },
    ],
  },
  {
    label: "Indemnisation des victimes",
    children: [
      {
        label: "Victimes de délits ou crimes",
        href: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
      },
      {
        label: "Accidents de la route",
        href: "/indemnisation-des-victimes/accidents-de-la-route",
      },
      {
        label: "Droit et accidents du travail",
        href: "/indemnisation-des-victimes/droit-et-accidents-du-travail",
      },
      {
        label: "Accidents et erreurs médicales",
        href: "/indemnisation-des-victimes/accidents-et-erreurs-medicales",
      },
      {
        label: "Accidents de la vie courante",
        href: "/indemnisation-des-victimes/accidents-de-la-vie-courante",
      },
    ],
  },
  {
    label: "Droit des contrats et des personnes",
    children: [
      {
        label: "Droit des assurances",
        href: "/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels",
      },
      {
        label: "Défense des consommateurs",
        href: "/droit-des-contrats-et-des-personnes/defense-des-consommateurs",
      },
      {
        label: "Droit de la famille",
        href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille",
      },
      {
        label: "Divorce",
        href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux",
      },
    ],
  },
]

const secondary = [
  { href: "/", label: "Accueil" },
  { href: "/honoraires-rendez-vous", label: "Je prends rendez-vous" },
  { href: "/notre-cabinet", label: "Équipe" },
  { href: "/nos-affaires", label: "Affaires" },
  { href: "/comprendre-le-droit", label: "Ressources" },
  { href: "/medias", label: "Médias" },
]

const poleNav = [
  { label: "DÉFENSE PÉNALE", href: "/defense-penale/droit-penal" },
  {
    label: "INDEMNISATION DES VICTIMES",
    href: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
  },
  {
    label: "DROIT DES CONTRATS ET DES PERSONNES",
    href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille",
  },
]

const sideNav = [
  { href: "/nos-affaires", label: "AFFAIRES" },
  { href: "/medias", label: "MÉDIAS" },
  { href: "/comprendre-le-droit", label: "RESSOURCES" },
  { href: "/notre-cabinet", label: "ÉQUIPE" },
]

interface HeaderProps {
  variant?: "home" | "site"
}

export function Header({ variant = "site" }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isHome = variant === "home"

  return (
    <>
      <header
        className={
          isHome
            ? "absolute inset-x-0 top-0 z-50"
            : "sticky top-0 z-50 border-b border-line bg-white"
        }
      >
        <div
          className={
            isHome
              ? "relative mx-auto flex h-[72px] max-w-[1400px] items-center px-5 lg:px-10"
              : "mx-auto flex h-[64px] max-w-[1400px] items-center gap-4 px-5 lg:px-8"
          }
        >
          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center gap-2.5"
            aria-label="Cabinet Plouton — Accueil"
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
              <nav
                className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-7"
                aria-label="Pôles"
              >
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
                <button
                  type="button"
                  aria-label="Recherche sur le site"
                  className="p-1 text-navy hover:text-accent"
                >
                  <SearchIcon />
                </button>
                <Link
                  href="/honoraires-rendez-vous"
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

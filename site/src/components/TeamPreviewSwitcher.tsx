"use client"

import Image from "next/image"
import { useState } from "react"
import { SiteCta } from "@/components/SiteCta"
import type { TeamMember } from "@/lib/content"

type Variant = "portraits" | "cine" | "typo"

const LABELS: { id: Variant; title: string; blurb: string }[] = [
  {
    id: "portraits",
    title: "1 · Portraits plein cadre",
    blurb: "Une grande section par personne — photo dominante, bio courte, détail au clic.",
  },
  {
    id: "cine",
    title: "2 · Grille ciné",
    blurb: "Portraits égaux, très peu de texte — la bio s’ouvre au clic.",
  },
  {
    id: "typo",
    title: "3 · Liste typographique",
    blurb: "Noms d’abord — la photo apparaît à droite quand tu sélectionnes quelqu’un.",
  },
]

export function TeamPreviewSwitcher({
  equipe,
  introTitle,
  introText,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
}) {
  const [variant, setVariant] = useState<Variant>("portraits")

  return (
    <div>
      <div className="sticky top-[68px] z-30 border-b border-line/80 bg-white/90 backdrop-blur-xl lg:top-[72px]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
            Preview — choisis ton layout
          </p>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setVariant(l.id)}
                className={
                  variant === l.id
                    ? "rounded-full bg-navy px-4 py-2 text-[13px] font-medium text-white"
                    : "rounded-full bg-navy/[0.06] px-4 py-2 text-[13px] font-medium text-navy/80 hover:bg-navy/[0.1]"
                }
              >
                {l.title}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-muted">
            {LABELS.find((l) => l.id === variant)?.blurb}
          </p>
        </div>
      </div>

      {variant === "portraits" ? (
        <LayoutPortraits equipe={equipe} introTitle={introTitle} introText={introText} />
      ) : null}
      {variant === "cine" ? (
        <LayoutCine equipe={equipe} introTitle={introTitle} introText={introText} />
      ) : null}
      {variant === "typo" ? (
        <LayoutTypo equipe={equipe} introTitle={introTitle} introText={introText} />
      ) : null}
    </div>
  )
}

function HeroSlim({ title, text }: { title: string; text: string }) {
  return (
    <header className="mx-auto max-w-3xl px-5 pb-6 pt-14 text-center lg:px-8 lg:pt-20">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
        Cabinet Plouton
      </p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-navy text-balance">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty text-navy/75">
        {text}
      </p>
      <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow className="mt-8">
        Prendre rendez-vous
      </SiteCta>
    </header>
  )
}

/** Direction 1 — portraits plein cadre */
function LayoutPortraits({
  equipe,
  introTitle,
  introText,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="bg-[#f6f7f8]">
      <HeroSlim title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl space-y-6 px-5 pb-24 lg:px-8">
        {equipe.map((m, i) => {
          const open = openId === m.id
          const reverse = i % 2 === 1
          return (
            <article
              key={m.id}
              className={`grid overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04),0_12px_32px_rgba(23,71,94,0.06)] lg:grid-cols-2 ${
                reverse ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative min-h-[320px] bg-fog lg:min-h-[480px]">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
                  {m.role}
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.6rem,2.5vw,2.15rem)] font-medium tracking-[-0.02em] text-navy">
                  {m.name}
                </h2>
                <p className="mt-4 text-[15px] leading-[1.7] text-pretty text-navy/80">
                  {m.short}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : m.id)}
                    className="text-[13px] font-medium text-navy underline-offset-4 hover:underline"
                  >
                    {open ? "Réduire" : "Lire le parcours"}
                  </button>
                  {m.linkedin ? (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-accent"
                    >
                      LinkedIn →
                    </a>
                  ) : null}
                </div>
                {open ? (
                  <div className="mt-6 space-y-3 border-t border-line/70 pt-6 text-[14px] leading-relaxed text-navy/80">
                    {m.bio.split(/\n\n+/).map((p, pi) => (
                      <p key={pi}>{p.trim()}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/** Direction 2 — grille ciné */
function LayoutCine({
  equipe,
  introTitle,
  introText,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = equipe.find((m) => m.id === openId)

  return (
    <div className="bg-white">
      <HeroSlim title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenId(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-fog shadow-[0_1px_2px_rgba(23,71,94,0.04),0_10px_28px_rgba(23,71,94,0.06)]">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[18px] outline outline-1 outline-[oklch(0_0_0_/_0.1)] -outline-offset-1"
                />
              </span>
              <span className="mt-4 block text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
                {m.role}
              </span>
              <span className="mt-1 block font-display text-[18px] font-medium tracking-[-0.015em] text-navy">
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="cine-drawer-title"
          onClick={() => setOpenId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
                  {open.role}
                </p>
                <h2
                  id="cine-drawer-title"
                  className="mt-2 font-display text-2xl font-medium text-navy"
                >
                  {open.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full bg-fog px-3 py-1.5 text-[13px] text-navy"
              >
                Fermer
              </button>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-navy/80">{open.short}</p>
            <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-navy/75">
              {open.bio.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            </div>
            {open.linkedin ? (
              <a
                href={open.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-[13px] font-medium text-accent"
              >
                LinkedIn →
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Direction 3 — liste typographique */
function LayoutTypo({
  equipe,
  introTitle,
  introText,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
}) {
  const [activeId, setActiveId] = useState(equipe[0]?.id || "")
  const active = equipe.find((m) => m.id === activeId) || equipe[0]

  return (
    <div className="bg-[#f4f6f7]">
      <HeroSlim title={introTitle} text={introText} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-8">
        <ul className="divide-y divide-navy/10 border-y border-navy/10">
          {equipe.map((m) => {
            const selected = m.id === activeId
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  onMouseEnter={() => setActiveId(m.id)}
                  className={`flex w-full items-baseline justify-between gap-4 py-5 text-left transition-colors ${
                    selected ? "text-navy" : "text-navy/45 hover:text-navy/70"
                  }`}
                >
                  <span className="font-display text-[clamp(1.25rem,2vw,1.65rem)] font-medium tracking-[-0.02em]">
                    {m.name}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold tracking-[0.1em] uppercase ${
                      selected ? "text-accent" : "text-navy/35"
                    }`}
                  >
                    {m.role}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {active ? (
          <div className="lg:sticky lg:top-36 lg:self-start">
            <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04),0_16px_40px_rgba(23,71,94,0.08)]">
              <div className="relative aspect-[4/5] bg-fog sm:aspect-[5/6]">
                {active.image ? (
                  <Image
                    src={active.image}
                    alt={active.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 480px"
                    priority
                  />
                ) : null}
              </div>
              <div className="px-6 py-6 sm:px-7">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
                  {active.role}
                </p>
                <h2 className="mt-2 font-display text-2xl font-medium text-navy">
                  {active.name}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-pretty text-navy/80">
                  {active.short}
                </p>
                {active.linkedin ? (
                  <a
                    href={active.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block text-[13px] font-medium text-accent"
                  >
                    LinkedIn →
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

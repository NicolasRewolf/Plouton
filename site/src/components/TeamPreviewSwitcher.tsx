"use client"

import Image from "next/image"
import { useState } from "react"
import { SiteCta } from "@/components/SiteCta"
import type { TeamMember } from "@/lib/content"

type Variant = "portraits" | "cine" | "typo" | "maison" | "mosaic" | "lookbook"

const LABELS: { id: Variant; title: string; blurb: string }[] = [
  {
    id: "portraits",
    title: "1 · Portraits",
    blurb: "Une grande section par personne — classique magazine.",
  },
  {
    id: "cine",
    title: "2 · Grille ciné",
    blurb: "Portraits égaux, bio au clic — galerie contemporaine.",
  },
  {
    id: "typo",
    title: "3 · Typo",
    blurb: "Noms d’abord, photo à droite — annuaire prestige.",
  },
  {
    id: "maison",
    title: "4 · Maison",
    blurb: "Inspiré maisons / cabinets boutique : le fondateur en héros, l’équipe en frise discrète.",
  },
  {
    id: "mosaic",
    title: "5 · Mosaïque",
    blurb: "Inspiré musées / studios d’archi : grandes et petites cases asymétriques.",
  },
  {
    id: "lookbook",
    title: "6 · Lookbook",
    blurb: "Inspiré marques luxe / cabinets cinématiques : défilement horizontal de portraits.",
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
      {variant === "maison" ? (
        <LayoutMaison equipe={equipe} introTitle={introTitle} introText={introText} />
      ) : null}
      {variant === "mosaic" ? (
        <LayoutMosaic equipe={equipe} introTitle={introTitle} introText={introText} />
      ) : null}
      {variant === "lookbook" ? (
        <LayoutLookbook equipe={equipe} introTitle={introTitle} introText={introText} />
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

/** Direction 4 — Maison (fondateur héros) — cabinets boutique / maisons */
function LayoutMaison({
  equipe,
  introTitle,
  introText,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const founder = equipe[0]
  const rest = equipe.slice(1)
  const open = equipe.find((m) => m.id === openId)

  if (!founder) return null

  return (
    <div className="bg-[#f7f8f9]">
      <header className="relative isolate min-h-[78vh] overflow-hidden bg-navy text-white">
        {founder.image ? (
          <Image
            src={founder.image}
            alt=""
            fill
            priority
            className="object-cover object-[center_20%] opacity-55"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/20" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 lg:px-8 lg:pb-20">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
            {founder.role}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.4rem,6vw,4.2rem)] font-medium leading-[1.02] tracking-[-0.03em] text-balance">
            {founder.name}
          </h1>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/80">
            {founder.short}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setOpenId(founder.id)}
              className="text-[13px] font-medium text-white underline-offset-4 hover:underline"
            >
              Parcours →
            </button>
            <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow>
              Prendre rendez-vous
            </SiteCta>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
              L’équipe
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium text-navy">{introTitle}</h2>
            <p className="mt-2 max-w-md text-[14px] text-muted">{introText}</p>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {rest.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenId(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden bg-fog">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top grayscale transition-[filter,transform] duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
                    sizes="200px"
                  />
                ) : null}
              </span>
              <span className="mt-3 block font-display text-[15px] font-medium text-navy">
                {m.name.replace(/^Me\s+/, "")}
              </span>
              <span className="mt-0.5 block text-[11px] tracking-wide text-muted uppercase">
                {m.role}
              </span>
            </button>
          ))}
        </div>
      </section>

      {open ? <MemberDrawer member={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  )
}

/** Direction 5 — Mosaïque musée / studio */
function LayoutMosaic({
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
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-4 sm:gap-4 lg:auto-rows-[260px]">
          {equipe.map((m, i) => {
            const featured = i === 0
            const tall = i === 2 || i === 5
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpenId(m.id)}
                className={`group relative overflow-hidden bg-fog text-left ${
                  featured ? "col-span-2 row-span-2" : tall ? "row-span-2" : ""
                }`}
              >
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]"
                    sizes={featured ? "50vw" : "25vw"}
                  />
                ) : null}
                <span className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="block text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">
                    {m.role}
                  </span>
                  <span className="mt-1 block font-display text-[16px] font-medium text-white sm:text-[18px]">
                    {m.name}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {open ? <MemberDrawer member={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  )
}

/** Direction 6 — Lookbook horizontal luxe */
function LayoutLookbook({
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
    <div className="bg-[#0f2a38] text-white">
      <header className="mx-auto max-w-6xl px-5 pb-4 pt-16 lg:px-8 lg:pt-20">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
          Cabinet Plouton
        </p>
        <h1 className="mt-3 max-w-xl font-display text-[clamp(2rem,4vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {introTitle}
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">{introText}</p>
        <p className="mt-8 text-[12px] tracking-wide text-white/40 uppercase">
          Faire défiler →
        </p>
      </header>

      <div className="scrollbar-none flex gap-5 overflow-x-auto px-5 pb-20 pt-6 lg:px-8">
        {equipe.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpenId(m.id)}
            className="group w-[72vw] max-w-[380px] shrink-0 text-left sm:w-[340px]"
          >
            <span className="relative block aspect-[3/4] overflow-hidden bg-navy-soft">
              {m.image ? (
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="380px"
                />
              ) : null}
              <span className="absolute inset-0 bg-gradient-to-t from-[#0f2a38]/90 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="block text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">
                  {m.role}
                </span>
                <span className="mt-1 block font-display text-[22px] font-medium tracking-[-0.02em]">
                  {m.name}
                </span>
              </span>
            </span>
            <span className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-white/55">
              {m.short}
            </span>
          </button>
        ))}
        <div className="w-4 shrink-0" aria-hidden />
      </div>

      <div className="border-t border-white/10 px-5 py-10 lg:px-8">
        <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow>
          Prendre rendez-vous
        </SiteCta>
      </div>

      {open ? <MemberDrawer member={open} onClose={() => setOpenId(null)} dark /> : null}
    </div>
  )
}

function MemberDrawer({
  member,
  onClose,
  dark,
}: {
  member: TeamMember
  onClose: () => void
  dark?: boolean
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-sm sm:items-center ${
        dark ? "bg-black/50" : "bg-navy/40"
      }`}
      role="dialog"
      aria-modal
      aria-labelledby="member-drawer-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
              {member.role}
            </p>
            <h2
              id="member-drawer-title"
              className="mt-2 font-display text-2xl font-medium text-navy"
            >
              {member.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-fog px-3 py-1.5 text-[13px] text-navy"
          >
            Fermer
          </button>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-navy/80">{member.short}</p>
        <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-navy/75">
          {member.bio.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p.trim()}</p>
          ))}
        </div>
        {member.linkedin ? (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-[13px] font-medium text-accent"
          >
            LinkedIn →
          </a>
        ) : null}
      </div>
    </div>
  )
}

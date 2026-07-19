"use client"

import Image from "next/image"
import { useState } from "react"
import { SiteCta } from "@/components/SiteCta"
import type { TeamMember } from "@/lib/content"

/**
 * 6 déclinaisons autour de la DA « grille ciné »
 * (portraits égaux, galerie prestige, bio au clic).
 */
type Variant =
  | "classique"
  | "overlay"
  | "reveal"
  | "studio"
  | "cadre"
  | "hierarchy"

const LABELS: { id: Variant; title: string; blurb: string }[] = [
  {
    id: "classique",
    title: "A · Classique",
    blurb: "La grille que tu as aimée : 3 colonnes égales, légende sous la photo, bio au clic.",
  },
  {
    id: "overlay",
    title: "B · Légende sur photo",
    blurb: "Nom + rôle gravés sur l’image — encore plus ciné, moins de texte autour.",
  },
  {
    id: "reveal",
    title: "C · Révélation hover",
    blurb: "Au survol, un court résumé monte sur la photo. Clic = parcours complet.",
  },
  {
    id: "studio",
    title: "D · Studio sombre",
    blurb: "Fond navy, portraits un peu désaturés — ambiance cabinet prestige / studio photo.",
  },
  {
    id: "cadre",
    title: "E · Mur blanc",
    blurb: "Mur blanc galerie — au survol : « Lire le parcours » pour ouvrir la bio.",
  },
  {
    id: "hierarchy",
    title: "F · Duo + rangée",
    blurb: "Toujours ciné, mais les 2 premiers plus grands, le reste en frise — hiérarchie douce.",
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
  const [variant, setVariant] = useState<Variant>("classique")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = equipe.find((m) => m.id === openId)

  return (
    <div>
      <div className="sticky top-[68px] z-30 border-b border-line/80 bg-white/90 backdrop-blur-xl lg:top-[72px]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
            DA Grille ciné — 6 déclinaisons
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

      {variant === "classique" ? (
        <CineClassique
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}
      {variant === "overlay" ? (
        <CineOverlay
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}
      {variant === "reveal" ? (
        <CineReveal
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}
      {variant === "studio" ? (
        <CineStudio
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}
      {variant === "cadre" ? (
        <CineCadre
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}
      {variant === "hierarchy" ? (
        <CineHierarchy
          equipe={equipe}
          introTitle={introTitle}
          introText={introText}
          onOpen={setOpenId}
        />
      ) : null}

      {open ? <MemberDrawer member={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  )
}

function HeroLight({ title, text }: { title: string; text: string }) {
  return (
    <header className="mx-auto max-w-3xl px-5 pb-8 pt-14 text-center lg:px-8 lg:pt-20">
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

function HeroDark({ title, text }: { title: string; text: string }) {
  return (
    <header className="mx-auto max-w-3xl px-5 pb-8 pt-14 text-center text-white lg:px-8 lg:pt-20">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
        Cabinet Plouton
      </p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-balance">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty text-white/65">
        {text}
      </p>
      <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow className="mt-8">
        Prendre rendez-vous
      </SiteCta>
    </header>
  )
}

/** A — classique (ta grille ciné) */
function CineClassique({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  return (
    <div className="bg-white">
      <HeroLight title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-fog shadow-[0_1px_2px_rgba(23,71,94,0.04),0_10px_28px_rgba(23,71,94,0.06)]">
                <Portrait m={m} />
                <Frame />
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
    </div>
  )
}

/** B — légende sur la photo */
function CineOverlay({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  return (
    <div className="bg-[#f5f6f7]">
      <HeroLight title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group relative aspect-[3/4] overflow-hidden rounded-[4px] bg-fog text-left"
            >
              <Portrait m={m} />
              <span className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="block text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">
                  {m.role}
                </span>
                <span className="mt-1 block font-display text-[20px] font-medium text-white">
                  {m.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** C — révélation hover */
function CineReveal({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  return (
    <div className="bg-white">
      <HeroLight title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-fog">
                <Portrait m={m} />
                <span className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/55" />
                <span className="absolute inset-x-0 bottom-0 translate-y-3 p-5 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="line-clamp-3 text-[13px] leading-relaxed text-white/90">
                    {m.short}
                  </span>
                  <span className="mt-3 block text-[12px] font-medium text-accent">
                    Voir le parcours →
                  </span>
                </span>
              </span>
              <span className="mt-4 block font-display text-[17px] font-medium text-navy">
                {m.name}
              </span>
              <span className="mt-0.5 block text-[12px] text-muted">{m.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** D — studio sombre */
function CineStudio({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  return (
    <div className="bg-[#122f3d]">
      <HeroDark title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden bg-[#0d2430]">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover object-top opacity-90 saturate-[0.85] transition-[transform,filter,opacity] duration-500 group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : null}
              </span>
              <span className="mt-4 block text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
                {m.role}
              </span>
              <span className="mt-1 block font-display text-[18px] font-medium text-white">
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** E — mur blanc galerie */
function CineCadre({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  return (
    <div className="bg-[#fafafa]">
      <HeroLight title={introTitle} text={introText} />
      <div className="mx-auto max-w-5xl px-5 pb-28 lg:px-8">
        <p className="mb-10 text-center text-[13px] text-navy/45">
          Cliquez sur un portrait pour lire le parcours
        </p>
        <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[3/4] overflow-hidden bg-fog outline outline-1 outline-[oklch(0_0_0_/_0.08)] -outline-offset-1 transition-[outline-color,box-shadow] duration-300 group-hover:outline-[oklch(0_0_0_/_0.18)] group-hover:shadow-[0_12px_32px_rgba(23,71,94,0.1)]">
                <Portrait m={m} slow />
                {/* Voile + invitation au clic */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/35"
                />
                <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-center p-5 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold tracking-wide text-navy shadow-sm">
                    Lire le parcours →
                  </span>
                </span>
              </span>
              <span className="mt-5 block text-center font-display text-[15px] font-medium tracking-[-0.01em] text-navy transition-colors group-hover:text-accent">
                {m.name}
              </span>
              <span className="mt-1 block text-center text-[11px] tracking-[0.08em] text-navy/45 uppercase">
                {m.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** F — duo + rangée (hiérarchie douce) */
function CineHierarchy({
  equipe,
  introTitle,
  introText,
  onOpen,
}: {
  equipe: TeamMember[]
  introTitle: string
  introText: string
  onOpen: (id: string) => void
}) {
  const lead = equipe.slice(0, 2)
  const rest = equipe.slice(2)

  return (
    <div className="bg-white">
      <HeroLight title={introTitle} text={introText} />
      <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {lead.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m.id)}
              className="group text-left"
            >
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-fog shadow-[0_1px_2px_rgba(23,71,94,0.04),0_12px_32px_rgba(23,71,94,0.07)]">
                <Portrait m={m} />
                <Frame />
              </span>
              <span className="mt-4 block text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
                {m.role}
              </span>
              <span className="mt-1 block font-display text-[22px] font-medium text-navy">
                {m.name}
              </span>
              <span className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-navy/70">
                {m.short}
              </span>
            </button>
          ))}
        </div>

        {rest.length ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpen(m.id)}
                className="group text-left"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-[16px] bg-fog">
                  <Portrait m={m} />
                  <Frame />
                </span>
                <span className="mt-3 block font-display text-[16px] font-medium text-navy">
                  {m.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted uppercase tracking-wide">
                  {m.role}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Portrait({ m, slow }: { m: TeamMember; slow?: boolean }) {
  if (!m.image) return null
  return (
    <Image
      src={m.image}
      alt={m.name}
      fill
      className={`object-cover object-top transition-transform ${
        slow
          ? "duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.02]"
          : "duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03]"
      }`}
      sizes="(max-width: 640px) 100vw, 33vw"
    />
  )
}

function Frame() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] outline outline-1 outline-[oklch(0_0_0_/_0.1)] -outline-offset-1"
    />
  )
}

function MemberDrawer({
  member,
  onClose,
}: {
  member: TeamMember
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="cine-drawer-title"
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
              id="cine-drawer-title"
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

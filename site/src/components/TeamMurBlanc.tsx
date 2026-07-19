"use client"

import Image from "next/image"
import { useState } from "react"
import type { TeamMember } from "@/lib/content"

/** Grille mur blanc (DA E) — hover « Lire le parcours », bio en panneau. */
export function TeamMurBlanc({ equipe }: { equipe: TeamMember[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = equipe.find((m) => m.id === openId)

  return (
    <>
      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="mb-10 text-center text-[13px] text-navy/45">
            Cliquez sur un portrait pour lire le parcours
          </p>
          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {equipe.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpenId(m.id)}
                className="group text-left"
              >
                <span className="relative block aspect-[3/4] overflow-hidden bg-fog outline outline-1 outline-[oklch(0_0_0_/_0.08)] -outline-offset-1 transition-[outline-color,box-shadow] duration-300 group-hover:outline-[oklch(0_0_0_/_0.18)] group-hover:shadow-[0_12px_32px_rgba(23,71,94,0.1)]">
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : null}
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
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="team-bio-title"
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
                  id="team-bio-title"
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
            {open.short ? (
              <p className="mt-4 text-[15px] leading-relaxed text-navy/80">{open.short}</p>
            ) : null}
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
    </>
  )
}

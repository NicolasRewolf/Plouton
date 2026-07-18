import Image from "next/image"
import Link from "next/link"
import type { LoadedPoleHub } from "@/lib/pole-hub"

interface PoleHubProps {
  hub: LoadedPoleHub
}

/** Gabarit hub pôle — intro + grille expertises (données JSON + registry). */
export function PoleHub({ hub }: PoleHubProps) {
  const { page, cards } = hub

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f5f7f8_42%,#eef2f4_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(ellipse_at_top,_rgba(23,71,94,0.06),_transparent_60%)]"
      />

      <div className="relative mx-auto max-w-[1140px] px-5 pb-20 pt-12 sm:px-8 lg:pt-16">
        <header className="max-w-3xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-accent">
            Pôle
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-navy text-balance">
            {page.title}
          </h1>
          {page.intro ? (
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-pretty text-muted sm:text-[17px]">
              {page.intro}
            </p>
          ) : null}
        </header>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:gap-8">
          {cards.map((card) => (
            <li key={card.slug}>
              <Link
                href={card.href}
                className="group flex h-full flex-col overflow-hidden rounded-[6px] bg-white/70 outline-none ring-1 ring-navy/8 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(23,71,94,0.08)] focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-navy/5">
                  <Image
                    src={card.hero}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
                  <h2 className="font-display text-[1.2rem] font-medium tracking-[-0.02em] text-navy group-hover:text-accent">
                    {card.label}
                  </h2>
                  {card.hint ? (
                    <p className="mt-1 text-[13px] text-muted">{card.hint}</p>
                  ) : null}
                  {card.synthese ? (
                    <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-navy/80">
                      {card.synthese}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
                    Découvrir
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

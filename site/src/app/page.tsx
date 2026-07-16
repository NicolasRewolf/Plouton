import Image from "next/image"
import Link from "next/link"
import {
  getEquipe,
  getExpertiseCards,
  getSite,
  publishedArticles,
} from "@/lib/content"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { JsonLd, organizationSchema } from "@/lib/seo"

export default function HomePage() {
  const site = getSite()
  const cards = getExpertiseCards()
  const team = getEquipe()
  const posts = publishedArticles().slice(0, 12)
  const byPole = {
    Défense: cards.filter((c) => c.domaineFiltre === "Défense"),
    Indemnisation: cards.filter((c) => c.domaineFiltre === "Indemnisation"),
    Contrats: cards.filter((c) => c.domaineFiltre === "Contrats"),
  }

  const schemas = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      publisher: { "@id": site.cabinetId },
      inLanguage: "fr-FR",
    },
  ]

  return (
    <>
      <Header variant="home" />
      <JsonLd data={schemas} />

      {/* Hero centré — copie Wix pixel-close */}
      <section className="relative flex min-h-[100svh] flex-col bg-white">
        <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col items-center justify-center px-5 pb-28 pt-24 text-center">
          <div className="relative mb-8 aspect-[927/560] w-full max-w-[560px] sm:max-w-[640px]">
            <div className="mask-stripes absolute inset-0">
              <Image
                src="/brand/hero-home.jpg"
                alt=""
                fill
                priority
                className="object-cover object-[center_40%]"
                sizes="(max-width: 768px) 90vw, 640px"
              />
            </div>
          </div>

          <p className="text-[13px] tracking-wide text-muted">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${site.address.street}, ${site.address.postalCode} ${site.address.city}`)}`}
              className="hover:text-accent"
            >
              {site.address.street}, {site.address.postalCode} {site.address.city}
            </a>
            <span className="mx-2 text-line">—</span>
            <a href={site.phone.href} className="hover:text-accent">
              {site.phone.display}
            </a>
          </p>

          <h1 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.15rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
            <span className="block text-navy">Cabinet Plouton</span>
            <span className="block text-accent">Avocats pénalistes</span>
            <span className="block text-navy">à Bordeaux</span>
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#expertises" className="btn-pill text-navy">
              Domaines d&apos;expertises
              <span className="btn-pill-icon border-accent text-accent" aria-hidden>
                →
              </span>
            </Link>
            <Link href="/#affaires" className="btn-pill text-navy">
              Nos affaires
              <span className="btn-pill-icon border-accent text-accent" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Ticker ACTUALITÉS — bas du premier écran */}
        <div className="absolute inset-x-0 bottom-0 border-t border-line bg-fog">
          <div className="mx-auto flex max-w-[1400px] items-stretch px-3 py-2.5 sm:px-5">
            <div className="flex shrink-0 items-center pr-3 sm:pr-4">
              <span className="text-[11px] font-bold tracking-[0.12em] text-accent">ACTUALITÉS</span>
              <span className="ml-3 hidden h-4 w-px bg-line sm:block" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-white px-4 py-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
              <div className="flex gap-10 overflow-x-auto scrollbar-none">
                {posts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/post/${p.slug}`}
                    className="shrink-0 whitespace-nowrap text-[13px] text-navy hover:text-accent"
                  >
                    <span className="mr-2 text-muted">
                      {new Date(p.publishedAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </span>
                    {p.title.length > 90 ? `${p.title.slice(0, 90)}…` : p.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + expertises */}
      <section id="expertises" className="mx-auto max-w-[1100px] px-5 py-20 text-center lg:px-8">
        <h2 className="font-display text-[clamp(1.6rem,3vw,2.35rem)] font-semibold leading-snug tracking-tight text-navy">
          À vos côtés depuis 20 ans pour défendre vos droits et lutter contre «&nbsp;un certain
          sentiment d&apos;injustice&nbsp;»&nbsp;*
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
          Il y a des moments où tout bascule. Une accusation, un accident, un conflit qui menace de
          tout emporter. Dans ces moments, le Cabinet Plouton est à vos côtés. Implantés à Bordeaux
          depuis plus de 20 ans.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-20 lg:px-8">
        <div className="grid gap-16">
          {Object.entries(byPole).map(([pole, items], i) => (
            <div key={pole}>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Pôle {i + 1}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-navy md:text-3xl">
                {pole === "Défense"
                  ? "Défense pénale"
                  : pole === "Indemnisation"
                    ? "Indemnisation des victimes"
                    : "Droit des contrats et des personnes"}
              </h3>
              <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((card) => (
                  <Link key={card.url} href={card.url} className="group block">
                    <h4 className="font-display text-lg font-semibold text-navy group-hover:text-accent">
                      {card.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{card.synthese}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="equipe" className="border-y border-line bg-fog">
        <div className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-20">
          <h2 className="mx-auto max-w-3xl text-center font-display text-[clamp(1.5rem,2.5vw,2.1rem)] font-semibold leading-snug text-navy">
            Notre équipe d&apos;avocats pénalistes – des compétences complémentaires au service de
            votre défense.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {team.map((m) => (
              <div key={m.name} className="text-center sm:text-left">
                <p className="text-xs uppercase tracking-wider text-muted">{m.role}</p>
                <p className="mt-1 font-display text-lg font-semibold text-navy">{m.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="affaires" className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
          Les dernières affaires juridiques traitées par notre cabinet
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {posts.slice(0, 6).map((p) => (
            <Link key={p.slug} href={`/post/${p.slug}`} className="group block">
              <p className="text-xs text-muted">
                {new Date(p.publishedAt).toLocaleDateString("fr-FR")} · {p.categories.join(" · ")}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-navy group-hover:text-accent">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

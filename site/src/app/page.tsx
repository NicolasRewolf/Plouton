import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { AffaireCard } from "@/components/AffaireCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { SiteCta } from "@/components/SiteCta"
import { getAccueil, getEquipe, getSite } from "@/lib/content"
import { publishedIndex } from "@/lib/queries"
import { absoluteUrl, JsonLd, organizationSchema } from "@/lib/seo"


export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    url: absoluteUrl("/"),
    title: getSite().title,
    description: getSite().description,
    images: [{ url: "/brand/equipe-home.png" }],
  },
}

export default async function HomePage() {
  const site = getSite()
  const page = getAccueil()
  const team = getEquipe()
  const posts = await publishedIndex()
  const ticker = posts.slice(0, 24)

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
      {/* Desktop live = nav complète (pas burger) */}
      <Header variant="site" />
      <JsonLd data={schemas} />

      {/* Hero split — texte gauche / photo 3 barres droite */}
      <section className="relative bg-white">
        <div className="mx-auto grid min-h-[calc(100svh-64px-72px)] max-w-[1400px] items-center gap-10 px-6 pb-24 pt-10 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-6">
          <div>
            <h1 className="font-display text-[clamp(1.7rem,2.2vw,2.15rem)] font-medium leading-[1.2] tracking-[-0.03em]">
              {page.hero.titleLines.map((line) => (
                <span
                  key={line.text}
                  className={
                    line.color === "accent"
                      ? "block text-accent"
                      : "block text-navy-soft"
                  }
                >
                  {/* Espace insécable en fin de ligne : les <span> block se collent
                      dans le texte accessible (H1 lu « PloutonAvocats » sinon) */}
                  {line.text}{" "}
                </span>
              ))}
            </h1>

            <p className="mt-5 text-[14px] text-navy">
              <a href={site.phone.href} className="hover:text-accent">
                {page.hero.phone}
              </a>
              <span className="mx-2 text-muted">—</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(page.hero.address)}`}
                className="hover:text-accent"
              >
                {page.hero.address}
              </a>
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {page.hero.ctas.map((cta, i) => (
                <SiteCta
                  key={cta.label}
                  href={cta.href}
                  variant={i === 0 ? "primary" : "secondary"}
                  arrow
                >
                  {cta.label}
                </SiteCta>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-[927/560] w-full max-w-[720px] lg:mx-0 lg:max-w-none">
            <div className="mask-stripes absolute inset-0">
              <Image
                src="/brand/hero-home.jpg"
                alt="Cabinet Plouton — avocats à Bordeaux"
                fill
                priority
                className="object-cover object-[center_40%]"
                sizes="(max-width: 1024px) 90vw, 55vw"
              />
            </div>
          </div>
        </div>

        {/* Ticker ACTUALITÉS */}
        <div className="absolute inset-x-0 bottom-0 bg-fog">
          <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 lg:px-8">
            <span className="shrink-0 text-[16px] font-bold tracking-wide text-accent">
              {page.tickerLabel}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex gap-8 overflow-x-auto scrollbar-none">
                {ticker.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/post/${p.slug}`}
                      className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[14px] font-bold text-navy hover:text-accent"
                    >
                      <span className="text-muted">
                        {new Date(p.publishedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </span>
                      <span>{p.title}</span>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
                        Lire
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro — photo équipe découpée + texte
          Fond = blanc photo : le « carré » de la photo disparaît. */}
      <section className="bg-white px-6 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 xl:gap-16">
          <Image
            src={page.intro.image}
            alt={page.intro.imageAlt}
            width={1166}
            height={1500}
            className="mx-auto h-auto w-full max-w-[520px] lg:mx-0 lg:max-w-none"
            sizes="(max-width: 1024px) 80vw, 42vw"
            priority={false}
          />

          <div className="lg:py-6">
            <h2 className="font-display text-[clamp(1.55rem,2.4vw,2rem)] font-medium leading-[1.22] tracking-tight">
              {page.intro.headingLines.map((line) => (
                <span
                  key={line.text}
                  className={
                    line.color === "accent"
                      ? "block text-accent"
                      : "block text-navy"
                  }
                >
                  {line.text}
                  {line.color === "navy" ? (
                    <span className="text-accent" aria-hidden>
                      {" "}
                      *
                    </span>
                  ) : null}{" "}
                </span>
              ))}
            </h2>

            <p className="mt-7 text-[15px] leading-[1.75] text-navy">
              {renderBoldText(page.intro.body)}
            </p>

            <p className="mt-12 max-w-xl whitespace-pre-line text-[10px] leading-relaxed text-[#cfcfcf] lg:mt-16">
              <span className="text-accent">*</span>
              {page.intro.citation.replace(/^\*\s*/, " ")}
            </p>
          </div>
        </div>
      </section>

      {/* Expertises */}
      <section id="expertises" className="border-t border-line bg-white px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[12px] font-bold tracking-[0.14em] text-accent">
            {page.expertiseIntro.eyebrow}
          </p>
          <h2 className="mt-2 max-w-xl font-display text-[30px] font-normal leading-snug text-navy">
            {page.expertiseIntro.headingAccent.map((part) =>
              part.accent ? (
                <span key={part.text} className="text-accent">
                  {part.text}
                </span>
              ) : (
                <span key={part.text}>{part.text}</span>
              )
            )}
          </h2>

          <div className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-10">
            {page.poles.map((pole) => (
              <div key={pole.label}>
                <p className="text-[11px] font-bold tracking-[0.12em] text-accent">{pole.label}</p>
                <h3 className="mt-2 font-display text-[30px] font-normal text-navy">{pole.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-navy/80">{pole.intro}</p>
                <ul className="mt-6">
                  {pole.items.map((item) => (
                    <li key={item.title} className="border-b border-line">
                      <Link
                        href={item.href}
                        className="group flex items-center justify-between gap-3 py-3.5 text-[15px] text-navy transition-colors hover:text-accent"
                      >
                        <span>{item.title}</span>
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-accent text-[11px] leading-none text-accent transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise forgée */}
      <section className="border-t border-line px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="font-display text-[30px] font-normal leading-snug text-navy">
            {page.expertiseBlock.heading}
          </h2>
          <div>
            <p className="text-[16px] leading-relaxed text-navy">{page.expertiseBlock.body}</p>
            <Link
              href={page.expertiseBlock.cta.href}
              className="mt-8 inline-flex text-[15px] font-medium text-accent hover:underline"
            >
              {page.expertiseBlock.cta.label} →
            </Link>
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section id="equipe" className="border-t border-line bg-fog px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="max-w-3xl font-display text-[clamp(1.4rem,2.2vw,1.9rem)] font-normal leading-snug text-navy">
            {page.equipe.heading}
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
            {team.map((m) => (
              <div key={m.id}>
                {m.image ? (
                  <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-white">
                    <Image
                      src={m.image}
                      alt=""
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, 30vw"
                    />
                  </div>
                ) : null}
                <p className="text-[13px] text-muted">{m.role}</p>
                <p className="mt-1 font-display text-[18px] text-navy">{m.name}</p>
                {m.short ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-navy/80">{m.short}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affaires */}
      <section id="affaires" className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-normal text-navy">
              {page.affaires.heading}
            </h2>
            <Link href={page.affaires.cta.href} className="text-[14px] text-accent hover:underline">
              {page.affaires.cta.label} →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 9).map((p) => (
              <AffaireCard key={p.slug} article={p} titleAs="h3" />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-navy">
          {part.slice(2, -2)}
        </strong>
      )
    return <span key={i}>{part}</span>
  })
}

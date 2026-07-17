import Image from "next/image"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getAccueil, getEquipe, getSite, publishedArticles } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export default function HomePage() {
  const site = getSite()
  const page = getAccueil()
  const team = getEquipe()
  const posts = publishedArticles()
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
                  {line.text}
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
                <Link
                  key={cta.label}
                  href={cta.href}
                  className={`btn-pill ${i === 0 ? "text-accent" : "text-navy"}`}
                >
                  {cta.label}
                  <span className="btn-pill-icon border-accent text-accent" aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-[927/560] w-full max-w-[720px] lg:mx-0 lg:max-w-none">
            <div className="mask-stripes absolute inset-0">
              <Image
                src="/brand/hero-home.jpg"
                alt=""
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

      {/* Intro — textes complets live */}
      <section className="mx-auto grid max-w-[1100px] gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
        <h2 className="font-display text-[30px] font-normal leading-snug tracking-tight text-navy">
          {page.intro.heading}
        </h2>
        <div>
          <p className="text-[16px] leading-relaxed text-navy">{page.intro.body}</p>
          <p className="mt-8 whitespace-pre-line text-[12px] leading-relaxed text-citation">
            {page.intro.citation}
          </p>
        </div>
      </section>

      {/* Expertises */}
      <section id="expertises" className="border-t border-line bg-white px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[12px] font-bold tracking-[0.14em] text-muted">
            {page.expertiseIntro.eyebrow}
          </p>
          <h2 className="mt-2 max-w-xl font-display text-[30px] font-normal leading-snug text-navy">
            {page.expertiseIntro.heading}
          </h2>

          <div className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-10">
            {page.poles.map((pole) => (
              <div key={pole.label}>
                <p className="text-[11px] font-bold tracking-[0.12em] text-accent">{pole.label}</p>
                <h3 className="mt-2 font-display text-[30px] font-normal text-navy">{pole.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-navy">{pole.intro}</p>
                <ul className="mt-6 space-y-2">
                  {pole.items.map((item) => (
                    <li key={item.title}>
                      <Link href={item.href} className="text-[16px] text-navy hover:text-accent">
                        {item.title}
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
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 9).map((p) => (
              <Link key={p.slug} href={`/post/${p.slug}`} className="group block">
                <h3 className="font-display text-[18px] font-medium leading-snug text-navy group-hover:text-accent">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-muted">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

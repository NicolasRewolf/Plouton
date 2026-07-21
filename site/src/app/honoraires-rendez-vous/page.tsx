import type { Metadata } from "next"
import Image from "next/image"
import { ContactForm } from "@/components/ContactForm"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { SiteCta } from "@/components/SiteCta"
import { getSite, readPageJson } from "@/lib/content"
import { formObjets } from "@/lib/registry"
import { JsonLd, organizationSchema, withCanonicalOg } from "@/lib/seo"

const EASE = "cubic-bezier(0.2, 0, 0, 1)"

function splitTitleBody(raw: string) {
  const parts = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 1) return { title: null as string | null, body: raw.trim() }
  return { title: parts[0], body: parts.slice(1).join(" ") }
}

interface HonorairesPage {
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  honoraires: { heading: string; lead: string; body: string }
  horaires: { heading: string; body: string }
  acces: {
    heading: string
    adresseLabel: string
    voiture: string
    tram: string
  }
  convention: {
    heading: string
    lead: string
    criteres: string[]
    dommageCorporel: string
    parties: string[]
  }
  protection: { heading: string; body: string }
  mediateurUrl: string
}

export function generateMetadata(): Metadata {
  const page = readPageJson<HonorairesPage>("honoraires-rendez-vous")
  if (!page) return {}
  return withCanonicalOg({
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    path: "/honoraires-rendez-vous",
  })
}

export default function HonorairesRendezVousPage() {
  const page = readPageJson<HonorairesPage>("honoraires-rendez-vous")
  const site = getSite()
  if (!page) return null

  const addressLine = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addressLine)}`
  const voiture = splitTitleBody(page.acces.voiture)
  const tram = splitTitleBody(page.acces.tram)
  const protectionParas = page.protection.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: page.title,
      url: `${site.url}/honoraires-rendez-vous`,
      mainEntity: { "@id": site.cabinetId },
    },
  ]

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

      <div className="bg-fog/50">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center lg:px-8">
          <a
            href={site.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-navy-soft underline-offset-2 hover:underline"
          >
            <span aria-hidden>★</span>
            {site.rating.value.replace(".", ",")}/5 étoiles ({site.rating.count} avis) sur Google
          </a>
          <h1 className="mt-6 font-display text-[clamp(1.85rem,3.5vw,2.6rem)] font-semibold tracking-tight text-navy">
            {page.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-navy">
            {page.intro}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 lg:grid-cols-2 lg:px-8">
          <div className="space-y-10 text-[15px] leading-relaxed text-navy">
            <section id="honoraires" className="scroll-mt-28">
              <h2 className="font-display text-2xl font-semibold">{page.honoraires.heading}</h2>
              <p className="mt-3 font-medium">{page.honoraires.lead}</p>
              {page.honoraires.body.split(/\n\n+/).map((p, i) => (
                <p key={i} className="mt-3 whitespace-pre-line">
                  {p}
                </p>
              ))}
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-accent">
                <a href="#convention" className="hover:underline">
                  → Convention d&apos;honoraires
                </a>
                <a href="#protection" className="hover:underline">
                  → Protection juridique &amp; défense recours
                </a>
              </div>
            </section>

            <section id="horaires" className="scroll-mt-28">
              <h2 className="font-display text-2xl font-semibold">{page.horaires.heading}</h2>
              <p className="mt-3">{page.horaires.body}</p>
              <p className="mt-4">
                <a href={site.phone.href} className="font-semibold text-accent hover:underline">
                  {site.phone.display}
                </a>
              </p>
              <p className="mt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {addressLine}
                </a>
              </p>
              <a href="#acces" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                → Accès
              </a>
            </section>
          </div>

          <div id="formulaire" className="scroll-mt-28 lg:sticky lg:top-24 lg:self-start">
            <ContactForm
              pageSource="honoraires-rendez-vous"
              defaultObjet="Droit Pénal"
              objets={formObjets()}
            />
          </div>
        </div>

        <section
          id="acces"
          className="scroll-mt-28 border-t border-line/70 bg-white px-5 py-14 lg:px-8 lg:py-16"
        >
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
            <div>
              <h2 className="font-display text-[clamp(1.5rem,2.4vw,1.85rem)] font-semibold tracking-tight text-navy">
                {page.acces.heading}
              </h2>
              <p className="mt-2 text-[15px] text-navy-soft">Cabinet principal · Bordeaux centre</p>

              <div className="mt-9 grid gap-8 sm:grid-cols-3 sm:gap-6">
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.06em] text-navy-soft uppercase">
                    {page.acces.adresseLabel}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block text-[15px] font-medium leading-snug text-navy underline-offset-2 transition-colors duration-200 hover:text-accent hover:underline"
                    style={{ transitionTimingFunction: EASE }}
                  >
                    {addressLine}
                  </a>
                </div>
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.06em] text-navy-soft uppercase">
                    {voiture.title ?? "En voiture"}
                  </p>
                  <p className="mt-3 text-[15px] leading-snug text-navy/90">{voiture.body}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.06em] text-navy-soft uppercase">
                    {tram.title ?? "En tramway"}
                  </p>
                  <p className="mt-3 text-[15px] leading-snug text-navy/90">{tram.body}</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto aspect-[5/6] w-full max-w-md overflow-hidden rounded-[22px] shadow-[0_1px_2px_rgba(23,71,94,0.04),0_14px_36px_rgba(23,71,94,0.08)] lg:mx-0 lg:max-w-none">
              <Image
                src="/brand/equipe-home.png"
                alt="L’équipe du Cabinet Plouton"
                fill
                className="object-cover object-[center_22%]"
                sizes="(max-width: 1024px) 90vw, 40vw"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-line/70 px-5 py-14 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-navy-soft uppercase">
              Informations complémentaires
            </p>
            <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
              <article id="convention" className="scroll-mt-28">
                <h2 className="font-display text-[1.35rem] font-semibold tracking-tight text-navy">
                  {page.convention.heading}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-navy/90">{page.convention.lead}</p>
                <ul className="mt-4 space-y-2.5">
                  {page.convention.criteres.map((c) => (
                    <li key={c} className="flex gap-3 text-[15px] text-navy">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[15px] leading-relaxed text-navy/90">
                  {page.convention.dommageCorporel}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {page.convention.parties.map((c) => (
                    <li key={c} className="flex gap-3 text-[15px] text-navy">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <SiteCta href="/notre-cabinet" variant="secondary" arrow className="mt-8">
                  Découvrir notre équipe
                </SiteCta>
              </article>

              <article id="protection" className="scroll-mt-28">
                <h2 className="font-display text-[1.35rem] font-semibold tracking-tight text-navy">
                  {page.protection.heading}
                </h2>
                {protectionParas.map((p, i) => {
                  if (p.startsWith("Médiateur"))
                    return (
                      <address
                        key={i}
                        className="mt-5 rounded-[18px] bg-white p-5 text-[14px] leading-relaxed text-navy not-italic shadow-[0_1px_2px_rgba(23,71,94,0.04),0_8px_22px_rgba(23,71,94,0.05)]"
                      >
                        <p className="whitespace-pre-line font-medium">{p}</p>
                        <a
                          href={page.mediateurUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
                          style={{ transitionTimingFunction: EASE }}
                        >
                          mediateur-consommation-avocat.fr →
                        </a>
                      </address>
                    )
                  return (
                    <p key={i} className="mt-4 text-[15px] leading-relaxed text-navy/90">
                      {p}
                    </p>
                  )
                })}
              </article>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}

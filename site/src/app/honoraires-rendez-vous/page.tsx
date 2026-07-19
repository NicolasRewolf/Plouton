import type { Metadata } from "next"
import Link from "next/link"
import { ContactForm } from "@/components/ContactForm"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getSite, readPageJson } from "@/lib/content"
import { formObjets } from "@/lib/registry"
import { JsonLd, organizationSchema, withCanonicalOg } from "@/lib/seo"

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
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${site.address.street}, ${site.address.postalCode} ${site.address.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {site.address.street}, {site.address.postalCode} {site.address.city}
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

        <div className="mx-auto max-w-3xl space-y-14 px-5 pb-20 lg:px-8">
          <section id="acces" className="scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold text-navy">{page.acces.heading}</h2>
            <p className="mt-4 text-sm font-semibold text-navy">{page.acces.adresseLabel}</p>
            <p className="mt-1 text-navy">
              {site.address.street}, {site.address.postalCode} {site.address.city}
            </p>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy">
              {page.acces.voiture}
            </p>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy">
              {page.acces.tram}
            </p>
          </section>

          <section id="convention" className="scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold text-navy">
              {page.convention.heading}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-navy">{page.convention.lead}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-navy">
              {page.convention.criteres.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-6 text-[15px] leading-relaxed text-navy">
              {page.convention.dommageCorporel}
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-navy">
              {page.convention.parties.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Link
              href="/notre-cabinet"
              className="mt-6 inline-flex text-sm font-medium text-accent hover:underline"
            >
              Découvrir notre équipe →
            </Link>
          </section>

          <section id="protection" className="scroll-mt-28">
            <h2 className="font-display text-2xl font-semibold text-navy">
              {page.protection.heading}
            </h2>
            {page.protection.body.split(/\n\n+/).map((p, i) => (
              <p key={i} className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy">
                {p}
              </p>
            ))}
            <p className="mt-4">
              <a
                href={page.mediateurUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                Site Internet
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </>
  )
}

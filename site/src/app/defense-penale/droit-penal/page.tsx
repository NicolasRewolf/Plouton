import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ContactForm } from "@/components/ContactForm"
import { FaqAccordion } from "@/components/FaqAccordion"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import {
  getExpertise,
  getFaq,
  getSite,
  publishedArticles,
} from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

const SLUG = "droit-penal"

export function generateMetadata(): Metadata {
  const expertise = getExpertise(SLUG)
  if (!expertise) return {}
  return {
    title: { absolute: expertise.metaTitle },
    description: expertise.metaDescription,
  }
}

export default function DroitPenalPage() {
  const expertise = getExpertise(SLUG)
  if (!expertise) notFound()
  const site = getSite()
  const faq = getFaq(SLUG)
  const related = publishedArticles()
    .filter((a) => a.categories.some((c) => expertise.blogCategories.includes(c)))
    .slice(0, 3)
  const pageUrl = `${site.url}/defense-penale/${expertise.slug}`

  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "LegalService",
      "@id": `${pageUrl}#service`,
      name: expertise.title,
      description: expertise.metaDescription,
      provider: { "@id": site.cabinetId },
      areaServed: "FR",
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: site.url },
        {
          "@type": "ListItem",
          position: 2,
          name: expertise.poleLabel,
          item: `${site.url}/${expertise.pole}`,
        },
        { "@type": "ListItem", position: 3, name: expertise.title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ]

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

      {/* Hero expertise — image en bandes + titre corail centré */}
      <section className="bg-white px-5 pb-10 pt-8 lg:px-8">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[720px] overflow-hidden">
          <div className="mask-slash-stripes absolute inset-0">
            <Image
              src="/brand/expertise-droit-penal.jpg"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm text-muted">Cabinet Plouton /</p>
          <h1 className="mt-1 font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-accent">
            Avocat droit pénal
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
            {expertise.intro}
          </p>
        </div>
      </section>

      {/* Contenu 2 colonnes — sommaire gauche comme le live */}
      <div className="mx-auto max-w-[1200px] px-5 pb-20 lg:px-8">
        <nav
          className="mb-10 flex gap-2 overflow-x-auto pb-2 lg:hidden"
          aria-label="Sommaire"
        >
          {expertise.toc.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[12px] text-navy"
            >
              {t.label}
            </a>
          ))}
          <a
            href="#contact"
            className="shrink-0 rounded-full bg-navy px-3.5 py-1.5 text-[12px] font-semibold text-white"
          >
            Je prends rendez-vous
          </a>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <ul className="sticky top-24 space-y-3.5 text-right text-[14px] text-muted">
              {expertise.toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="inline-flex items-center gap-2 hover:text-navy">
                    {t.label}
                    <span className="text-accent" aria-hidden>
                      →
                    </span>
                  </a>
                </li>
              ))}
              <li className="pt-3">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft"
                >
                  Je prends rendez-vous
                  <span aria-hidden>→</span>
                </a>
              </li>
            </ul>
          </aside>

          <div>
            {expertise.sections.map((section, idx) => (
              <section key={section.id} id={section.id} className="mb-14 scroll-mt-28">
                <h2 className="font-display text-[clamp(1.45rem,2.2vw,1.9rem)] font-semibold leading-snug tracking-tight">
                  {idx === 0 ? (
                    <>
                      <span className="text-accent">Défendre vos intérêts</span>{" "}
                      <span className="text-navy">à chaque étape de la procédure pénale</span>
                    </>
                  ) : (
                    <span className="text-navy">{section.title}</span>
                  )}
                </h2>
                <div className="mt-8 space-y-8">
                  {section.blocks.map((b) => (
                    <div key={b.heading}>
                      <h3 className="font-display text-xl font-semibold text-navy">{b.heading}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted">{b.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section id="faq" className="mb-14 scroll-mt-28">
              <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
                FAQ : droit pénal
              </h2>
              <div className="mt-6">
                <FaqAccordion items={faq} />
              </div>
            </section>

            <section id="affaires" className="mb-14 scroll-mt-28">
              <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
                Nos affaires : droit pénal
              </h2>
              <div className="mt-6 grid gap-4">
                {related.length === 0 ? (
                  <p className="text-sm text-muted">Aucun article lié en POC.</p>
                ) : (
                  related.map((p) => (
                    <Link key={p.slug} href={`/post/${p.slug}`} className="group block border-b border-line py-4">
                      <p className="font-medium text-navy group-hover:text-accent">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section id="contact" className="scroll-mt-28 border border-line bg-fog/50 p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-navy">Je prends rendez-vous</h2>
              <p className="mt-2 text-sm text-muted">
                Objet prérempli « {expertise.formObjet} ».
              </p>
              <div className="mt-6">
                <ContactForm defaultObjet={expertise.formObjet} pageSource={expertise.slug} />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Boutons flottants mail / téléphone */}
      <div className="fixed bottom-6 right-5 z-30 flex flex-col gap-2">
        <a
          href={`mailto:${site.email}`}
          aria-label="Écrire un e-mail"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-lg hover:bg-navy-soft"
        >
          ✉
        </a>
        <a
          href={site.phone.href}
          aria-label="Appeler le cabinet"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover"
        >
          ☎
        </a>
      </div>

      <Footer />
    </>
  )
}

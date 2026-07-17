import Image from "next/image"
import Link from "next/link"
import { ContactForm } from "@/components/ContactForm"
import { FaqAccordion } from "@/components/FaqAccordion"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import type { ExpertisePage, FaqItem, SiteConfig } from "@/lib/content"
import type { ArticleIndexItem } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

interface ExpertisePageViewProps {
  expertise: ExpertisePage
  site: SiteConfig
  faq: FaqItem[]
  related: ArticleIndexItem[]
  pageUrl: string
  heroImage?: string | null
}

export function ExpertisePageView({
  expertise,
  site,
  faq,
  related,
  pageUrl,
  heroImage,
}: ExpertisePageViewProps) {
  const intro = expertise.intro.replace(/^Cabinet Plouton\s*\/\s*/i, "").trim()

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
          item: `${site.url}${expertise.path || `/${expertise.pole}`}`,
        },
        { "@type": "ListItem", position: 3, name: expertise.title, item: pageUrl },
      ],
    },
    ...(faq.length
      ? [
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
      : []),
  ]

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

      <section className="bg-white px-5 pb-8 pt-6 lg:px-8">
        {heroImage ? (
          <div className="relative mx-auto aspect-[16/9] w-full max-w-[680px] overflow-hidden">
            <div className="mask-slash-stripes absolute inset-0">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 680px"
              />
            </div>
          </div>
        ) : null}
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm text-navy-soft">Cabinet Plouton /</p>
          <h1 className="mt-1 font-display text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tight text-accent">
            {expertise.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-navy">
            {intro}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 pb-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <ul className="sticky top-24 space-y-3.5 text-right text-[14px] text-muted">
              {expertise.toc.map((t) => (
                <li key={t.id}>
                  {t.id === "contact" ? (
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-soft"
                    >
                      {t.label}
                      <span aria-hidden>→</span>
                    </a>
                  ) : (
                    <a href={`#${t.id}`} className="inline-flex items-center gap-2 hover:text-navy">
                      {t.label}
                      <span className="text-accent" aria-hidden>
                        →
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          <div>
            {expertise.sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-16 scroll-mt-28">
                <h2 className="font-display text-[clamp(1.45rem,2.2vw,1.85rem)] font-semibold leading-snug tracking-tight">
                  {section.titleAccent ? (
                    <>
                      <span className="text-accent">{section.titleAccent}</span>{" "}
                      <span className="text-navy">
                        {section.title.replace(section.titleAccent, "").trim()}
                      </span>
                    </>
                  ) : (
                    <span className="text-navy">{section.title}</span>
                  )}
                </h2>
                {section.lead ? (
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy">
                    {section.lead}
                  </p>
                ) : null}
                <div className="mt-8 space-y-10">
                  {section.blocks.map((b, bi) => (
                    <div key={`${section.id}-${bi}-${b.heading}`}>
                      {b.heading ? (
                        <h3 className="font-display text-xl font-semibold text-navy">{b.heading}</h3>
                      ) : null}
                      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-navy">
                        {b.body.split(/\n\n+/).map((para, i) => (
                          <p key={i} className="whitespace-pre-line">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section id="contact" className="mb-16 scroll-mt-28 border border-line bg-fog/40 p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-navy">
                {expertise.contactAside?.title || "Je prends rendez-vous"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy">
                {expertise.contactAside?.text ||
                  "Les rendez-vous sont pris dans les 7 jours. En cas d’urgence, le rendez-vous peut être immédiat."}
              </p>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <ContactForm defaultObjet={expertise.formObjet} pageSource={expertise.slug} />
                <div className="space-y-4 text-sm text-navy">
                  <div>
                    <p className="font-semibold">Horaires d&apos;ouverture</p>
                    <p className="mt-1 text-muted">{site.hours}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Contact téléphonique</p>
                    <a href={site.phone.href} className="mt-1 block text-accent hover:underline">
                      {site.phone.display}
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold">Adresse</p>
                    <p className="mt-1 text-muted">
                      {site.address.street}, {site.address.postalCode} {site.address.city}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {faq.length ? (
              <section id="faq" className="mb-16 scroll-mt-28">
                <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
                  Foire Aux Questions
                </h2>
                <div className="mt-6">
                  <FaqAccordion items={faq} />
                </div>
              </section>
            ) : null}

            {related.length ? (
              <section id="affaires" className="scroll-mt-28">
                <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
                  Nos affaires
                </h2>
                <div className="mt-6 grid gap-4">
                  {related.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/post/${p.slug}`}
                      className="group block border-b border-line py-4"
                    >
                      <p className="font-medium text-navy group-hover:text-accent">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

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

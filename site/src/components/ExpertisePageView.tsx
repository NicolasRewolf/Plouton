import Image from "next/image"
import Link from "next/link"
import { ContactForm } from "@/components/ContactForm"
import { FaqAccordion } from "@/components/FaqAccordion"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import type { ArticleIndexItem, ExpertisePage, FaqItem, SiteConfig } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

interface ExpertisePageViewProps {
  expertise: ExpertisePage
  site: SiteConfig
  faq: FaqItem[]
  related: ArticleIndexItem[]
  pageUrl: string
  heroImage?: string | null
}

function accentSplit(title: string, titleAccent?: string | null) {
  if (titleAccent && title.includes(titleAccent)) {
    const rest = title.replace(titleAccent, "").trim()
    return { accent: titleAccent, rest }
  }
  return { accent: null, rest: title }
}

export function ExpertisePageView({
  expertise,
  site,
  faq,
  related,
  pageUrl,
  heroImage,
}: ExpertisePageViewProps) {
  const intro = expertise.intro
    .replace(/^Cabinet Plouton\s*\/\s*/i, "")
    .replace(/\u200b/g, "")
    .trim()

  const tocPrimary = expertise.toc.filter((t) => !["faq", "affaires"].includes(t.id))
  const tocSecondary = expertise.toc.filter((t) => ["faq", "affaires"].includes(t.id))

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
      <Header variant="home" />
      <JsonLd data={schema} />

      {/* Hero — image masquée + titre centré (comme le live) */}
      <section className="bg-white px-5 pt-20 pb-2 lg:px-8">
        {heroImage ? (
          <div className="relative mx-auto aspect-[3/2] w-full max-w-[680px] overflow-hidden">
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
        ) : (
          <div className="mx-auto h-48 max-w-[680px] bg-fog" aria-hidden />
        )}

        <div className="mx-auto mt-8 max-w-[720px] text-center">
          <p className="text-[14px] text-navy">Cabinet Plouton /</p>
          <h1 className="mt-1 font-display text-[clamp(1.85rem,3.2vw,2.35rem)] font-medium leading-tight tracking-tight text-accent">
            {expertise.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[680px] text-justify text-[14px] leading-[1.6] text-navy">
            {intro}
          </p>
        </div>
      </section>

      {/* TOC horizontale — pastilles blanches sur bandeau gris */}
      <nav
        aria-label="Sommaire"
        className="sticky top-0 z-20 mt-8 border-y border-line/60 bg-[#f9f9f9]"
      >
        <div className="mx-auto flex max-w-[1100px] gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {tocPrimary.map((t) =>
            t.id === "contact" ? (
              <a
                key={t.id}
                href="#contact"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] bg-navy px-3 py-2 text-[10px] font-semibold tracking-wide text-white shadow-sm hover:bg-navy-soft"
              >
                {t.label}
                <span className="text-accent" aria-hidden>
                  →
                </span>
              </a>
            ) : (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] bg-white px-3 py-2 text-[10px] font-medium tracking-wide text-navy shadow-sm hover:text-accent"
              >
                {t.label}
                <span className="text-accent" aria-hidden>
                  →
                </span>
              </a>
            )
          )}
        </div>
      </nav>

      {/* Corps — colonne unique centrée */}
      <div className="mx-auto max-w-[680px] px-5 py-14 lg:px-0">
        {expertise.sections.map((section) => {
          const { accent, rest } = accentSplit(section.title, section.titleAccent)
          return (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-28">
              <h2 className="font-display text-[clamp(1.25rem,2vw,1.4rem)] font-medium leading-snug tracking-tight">
                {accent ? (
                  <>
                    <span className="text-accent">{accent}</span>
                    {rest ? <span className="text-navy"> {rest}</span> : null}
                  </>
                ) : (
                  <span className="text-navy">{section.title}</span>
                )}
              </h2>
              {section.lead ? (
                <div className="mt-4 space-y-3 text-[14px] leading-[1.65] text-navy">
                  {section.lead
                    .replace(/\u200b/g, "")
                    .split(/\n\n+/)
                    .filter((p) => p.trim())
                    .map((para, i) => (
                      <p key={i} className="text-justify whitespace-pre-line">
                        {para.trim()}
                      </p>
                    ))}
                </div>
              ) : null}
              <div className="mt-8 space-y-10">
                {section.blocks.map((b, bi) => (
                  <div key={`${section.id}-${bi}`}>
                    {b.heading ? (
                      <h3 className="font-display text-[17px] font-medium leading-snug text-navy">
                        {b.heading}
                      </h3>
                    ) : null}
                    <div className="mt-3 space-y-3 text-[14px] leading-[1.65] text-navy">
                      {b.body
                        .replace(/\u200b/g, "")
                        .split(/\n\n+/)
                        .filter((p) => p.trim())
                        .map((para, i) => (
                          <p key={i} className="text-justify whitespace-pre-line">
                            {para.trim()}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        <section
          id="contact"
          className="mb-16 scroll-mt-28 border border-line bg-[#f9f9f9] p-6 md:p-8"
        >
          <h2 className="font-display text-[1.35rem] font-medium text-navy">
            {expertise.contactAside?.title || "Je prends rendez-vous"}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-navy">
            {expertise.contactAside?.text ||
              "Les rendez-vous sont pris dans les 7 jours. En cas d’urgence, le rendez-vous peut être immédiat."}
          </p>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <ContactForm defaultObjet={expertise.formObjet} pageSource={expertise.slug} />
            <div className="space-y-4 text-[14px] text-navy">
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
            <h2 className="font-display text-[1.35rem] font-medium text-navy">
              {tocSecondary.find((t) => t.id === "faq")?.label || "Foire Aux Questions"}
            </h2>
            <div className="mt-6">
              <FaqAccordion items={faq} />
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section id="affaires" className="scroll-mt-28">
            <h2 className="font-display text-[1.35rem] font-medium text-navy">
              {tocSecondary.find((t) => t.id === "affaires")?.label || "Nos affaires"}
            </h2>
            <div className="mt-6 grid gap-0">
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

      {/* FABs — comme le live */}
      <div className="fixed bottom-6 right-5 z-30 flex flex-col gap-3">
        <a
          href={`mailto:${site.email}`}
          aria-label="Écrire un e-mail"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:text-accent"
        >
          <MailIcon />
        </a>
        <a
          href={site.phone.href}
          aria-label="Appeler le cabinet"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:text-accent"
        >
          <PhoneIcon />
        </a>
      </div>

      <Footer />
    </>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3a2 2 0 01-2.2 2A16 16 0 014.5 5.7 2 2 0 016.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

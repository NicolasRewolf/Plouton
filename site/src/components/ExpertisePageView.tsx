import Image from "next/image"
import type { AffaireCardItem } from "@/components/AffaireCard"
import { AffairesCarousel } from "@/components/AffairesCarousel"
import { ContactForm } from "@/components/ContactForm"
import { ExpertiseBody } from "@/components/ExpertiseBody"
import { ExpertiseToc, type ExpertiseTocItem } from "@/components/ExpertiseToc"
import { FaqAccordion } from "@/components/FaqAccordion"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import type { ExpertisePage, FaqItem, SiteConfig } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

interface ExpertisePageViewProps {
  expertise: ExpertisePage
  site: SiteConfig
  faq: FaqItem[]
  related: AffaireCardItem[]
  pageUrl: string
  heroImage?: string | null
}

function isLegacyScrapedBlock(id: string, labelOrTitle?: string | null) {
  const key = `${id} ${labelOrTitle || ""}`.toLowerCase()
  if (id === "contact") return false
  return (
    id === "faq" ||
    id === "affaires" ||
    /foire-aux-questions|questions-frequentes|affaires-recentes|nos-affaires-recentes|les-dernieres-affaires|actualites|je-prends-rendez-vous|rendez-vous-maintenant|rendez-vous-pour/.test(
      id
    ) ||
    /foire aux questions|questions fr[eé]quentes|affaires r[eé]centes|nos affaires r[eé]centes|derni[eè]res? affaires|^actualit[eé]s|^je prends rendez-vous/.test(
      key
    )
  )
}

function buildTocItems({
  expertise,
  sections,
  hasFaq,
  hasAffaires,
}: {
  expertise: ExpertisePage
  sections: ExpertisePage["sections"]
  hasFaq: boolean
  hasAffaires: boolean
}): ExpertiseTocItem[] {
  const sectionIds = new Set(sections.map((s) => s.id))
  const items: ExpertiseTocItem[] = []

  for (const t of expertise.toc) {
    if (isLegacyScrapedBlock(t.id, t.label)) continue
    if (t.id === "contact") {
      items.push({
        id: "contact",
        label: t.shortLabel || "Je prends rendez-vous",
        isCta: true,
      })
      continue
    }
    if (!sectionIds.has(t.id)) continue
    items.push({ id: t.id, label: t.shortLabel || t.label })
  }

  if (!items.some((i) => i.id === "contact"))
    items.push({ id: "contact", label: "Je prends rendez-vous", isCta: true })

  if (hasFaq) items.push({ id: "faq", label: "FAQ" })
  if (hasAffaires) items.push({ id: "affaires", label: "Nos affaires" })

  return items
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

  const introParas = intro
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const sections = expertise.sections.filter((s) => !isLegacyScrapedBlock(s.id, s.title))
  const tocItems = buildTocItems({
    expertise,
    sections,
    hasFaq: faq.length > 0,
    hasAffaires: related.length > 0,
  })

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

      {/* Hero asymétrique — texte + photo slash + marque */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f7f9] via-white to-white">
        <div
          className="pointer-events-none absolute -right-16 top-8 hidden opacity-[0.07] lg:block"
          aria-hidden
        >
          <Image src="/brand/logo-mark.svg" alt="" width={320} height={240} className="h-auto w-[280px]" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14 lg:px-8 lg:pb-12 lg:pt-16">
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/logo-mark.svg"
                alt=""
                width={22}
                height={16}
                className="h-4 w-auto"
                priority
              />
              <p className="text-[13px] font-medium tracking-[0.04em] text-navy/70">
                Cabinet Plouton
              </p>
            </div>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {expertise.poleLabel}
            </p>
            <h1 className="mt-2.5 font-display text-[clamp(1.9rem,3.8vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-accent text-balance">
              {expertise.title}
            </h1>

            <div className="mt-6 space-y-3.5 text-[15px] leading-[1.65] text-pretty text-navy/85">
              {introParas.slice(0, 2).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end">
            {heroImage ? (
              <div className="relative aspect-[5/4] w-full">
                <div className="mask-slash-stripes absolute inset-0">
                  <Image
                    src={heroImage}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center outline outline-1 outline-black/10"
                    sizes="(max-width: 1024px) 90vw, 480px"
                  />
                </div>
                <div
                  className="absolute -bottom-3 -left-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(23,71,94,0.12)] sm:h-16 sm:w-16"
                  aria-hidden
                >
                  <Image
                    src="/brand/logo-mark.svg"
                    alt=""
                    width={28}
                    height={21}
                    className="h-[18px] w-auto sm:h-[21px]"
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-[5/4] w-full rounded-[4px] bg-fog" aria-hidden />
            )}
          </div>
        </div>
      </section>

      <ExpertiseToc items={tocItems} />

      <ExpertiseBody sections={sections} links={expertise.inlineLinks || []} />

      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
          <section id="contact" className="scroll-mt-36">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <ContactForm
                defaultObjet={expertise.formObjet}
                pageSource={expertise.slug}
                heading={expertise.contactAside?.title || "Je prends rendez-vous"}
                lead={
                  expertise.contactAside?.text ||
                  "Les rendez-vous sont pris dans les 7 jours. En cas d’urgence, le rendez-vous peut être immédiat."
                }
              />
              <aside className="rounded-[22px] bg-fog/70 p-6 sm:p-7 lg:sticky lg:top-28">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                  Le cabinet
                </p>
                <div className="mt-5 space-y-5 text-[14px] text-navy">
                  <div>
                    <p className="font-medium">Horaires</p>
                    <p className="mt-1 leading-relaxed text-muted">{site.hours}</p>
                  </div>
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <a
                      href={site.phone.href}
                      className="mt-1 block font-medium text-accent underline-offset-2 hover:underline decoration-from-font"
                    >
                      {site.phone.display}
                    </a>
                  </div>
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="mt-1 leading-relaxed text-muted">
                      {site.address.street}, {site.address.postalCode} {site.address.city}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {faq.length ? (
            <div className="mt-16">
              <FaqAccordion
                items={faq}
                title={`Foire aux questions : ${(expertise.blogCategories[0] || expertise.title).toLowerCase()}`}
              />
            </div>
          ) : null}

          {related.length ? (
            <div className="mt-16">
              <AffairesCarousel
                articles={related}
                categoryLabel={expertise.blogCategories[0]}
                title={`Nos affaires : ${(expertise.blogCategories[0] || "actualités").toLowerCase()}`}
              />
            </div>
          ) : null}
        </div>
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

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
import { getRegistryExpertise } from "@/lib/registry"
import { JsonLd } from "@/lib/seo"

interface ExpertisePageViewProps {
  expertise: ExpertisePage
  site: SiteConfig
  faq: FaqItem[]
  related: AffaireCardItem[]
  tocItems: ExpertiseTocItem[]
  sections: ExpertisePage["sections"]
  pageUrl: string
  heroImage?: string | null
  schema: Record<string, unknown>[]
}

/** Presentational expertise gabarit — data from loadExpertisePage. */
export function ExpertisePageView({
  expertise,
  site,
  faq,
  related,
  tocItems,
  sections,
  pageUrl: _pageUrl,
  heroImage,
  schema,
}: ExpertisePageViewProps) {
  void _pageUrl
  const intro = expertise.intro
    .replace(/^Cabinet Plouton\s*\/\s*/i, "")
    .replace(/\u200b/g, "")
    .trim()

  const introParas = intro
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

      {/* Hero asymétrique — texte + photo slash */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f7f9] via-white to-white">
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
                defaultObjet={
                  getRegistryExpertise(expertise.slug)?.formObjet ||
                  expertise.formObjet
                }
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

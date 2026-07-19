/**
 * Expertise page loader — assembles everything the presentational view needs.
 */
import type { AffaireCardItem } from "@/components/AffaireCard"
import type { ExpertiseTocItem } from "@/components/ExpertiseToc"
import {
  getExpertise,
  getSite,
  type ExpertisePage,
  type FaqItem,
  type SiteConfig,
} from "@/lib/content"
import { isLegacyScrapedBlock } from "@/lib/expertise-hygiene"
import { faqForExpertise, relatedForExpertise } from "@/lib/queries"
import { heroForSlug } from "@/lib/registry"
import { absoluteUrl, organizationSchema, pageOpenGraph } from "@/lib/seo"

const RELATED_LIMIT = 20

export interface LoadedExpertisePage {
  expertise: ExpertisePage
  site: SiteConfig
  faq: FaqItem[]
  related: AffaireCardItem[]
  tocItems: ExpertiseTocItem[]
  sections: ExpertisePage["sections"]
  pageUrl: string
  heroImage: string
  schema: Record<string, unknown>[]
}

function cleanSections(expertise: ExpertisePage): ExpertisePage["sections"] {
  return expertise.sections.filter((s) => !isLegacyScrapedBlock(s.id, s.title))
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

export async function loadExpertisePage(
  slug: string
): Promise<LoadedExpertisePage | null> {
  const expertise = getExpertise(slug)
  if (!expertise) return null

  const site = getSite()
  const faq = faqForExpertise(expertise)
  const relatedArticles = await relatedForExpertise(expertise, RELATED_LIMIT)
  const related: AffaireCardItem[] = relatedArticles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    categories: a.categories,
    coverImage: a.coverImage,
    minutesToRead: a.minutesToRead,
    viewCount: a.viewCount ?? 0,
  }))

  const sections = cleanSections(expertise)
  const tocItems = buildTocItems({
    expertise,
    sections,
    hasFaq: faq.length > 0,
    hasAffaires: related.length > 0,
  })


  const pagePath = expertise.path || `/${expertise.pole}/${expertise.slug}`
  const pageUrl = `${site.url}${pagePath}`
  const heroImage = heroForSlug(slug, expertise.pole)

  const schema: Record<string, unknown>[] = [
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
  ]
  if (faq.length) {
    schema.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    })
  }

  return {
    expertise,
    site,
    faq,
    related,
    tocItems,
    sections,
    pageUrl,
    heroImage,
    schema,
  }
}

export function expertiseMetadata(slug: string) {
  const expertise = getExpertise(slug)
  if (!expertise) return {}
  const path = expertise.path || `/${expertise.pole}/${expertise.slug}`
  return {
    title: { absolute: expertise.metaTitle },
    description: expertise.metaDescription,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: pageOpenGraph({
      path,
      title: expertise.metaTitle,
      description: expertise.metaDescription,
      image: heroForSlug(slug, expertise.pole) || undefined,
    }),
  }
}

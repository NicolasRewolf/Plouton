import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExpertisePageView } from "@/components/ExpertisePageView"
import {
  getExpertise,
  getFaq,
  getSite,
  publishedArticles,
} from "@/lib/content"

const HERO_BY_SLUG: Record<string, string> = {
  "droit-penal": "/brand/expertise-droit-penal.jpg",
}

export function expertiseMetadata(slug: string): Metadata {
  const expertise = getExpertise(slug)
  if (!expertise) return {}
  return {
    title: { absolute: expertise.metaTitle },
    description: expertise.metaDescription,
  }
}

export function ExpertiseRoutePage({ slug }: { slug: string }) {
  const expertise = getExpertise(slug)
  if (!expertise) notFound()
  const site = getSite()
  const faqKey = expertise.slug === "droit-penal" ? "droit-penal" : expertise.slug
  const faq = getFaq(faqKey)
  const matched = publishedArticles().filter((a) =>
    expertise.blogCategories.some((c) => a.categories.includes(c))
  )
  const related = (matched.length ? matched : publishedArticles()).slice(0, 6)
  const pagePath = expertise.path || `/${expertise.pole}/${expertise.slug}`
  const pageUrl = `${site.url}${pagePath}`

  return (
    <ExpertisePageView
      expertise={expertise}
      site={site}
      faq={faq}
      related={related}
      pageUrl={pageUrl}
      heroImage={HERO_BY_SLUG[slug] || null}
    />
  )
}

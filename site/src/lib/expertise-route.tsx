import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExpertisePageView } from "@/components/ExpertisePageView"
import {
  getExpertise,
  getFaq,
  getSite,
  publishedArticles,
} from "@/lib/content"

/** Heroes locaux (téléchargés depuis Wix). Fallback = droit pénal. */
const HERO_BY_SLUG: Record<string, string> = {
  "droit-penal": "/brand/expertises/droit-penal.jpg",
  "proces-criminel": "/brand/expertises/proces-criminel.jpg",
  "trafic-de-stupefiants": "/brand/expertises/trafic-de-stupefiants.jpg",
  "violences-conjugales-et-feminicides":
    "/brand/expertises/violences-conjugales-et-feminicides.jpg",
  "droit-penal-des-affaires": "/brand/expertises/droit-penal-des-affaires.jpg",
  "victimes-de-delits-ou-crimes": "/brand/expertises/victimes-de-delits-ou-crimes.jpg",
  "accidents-de-la-route": "/brand/expertises/accidents-de-la-route.jpg",
  "droit-et-accidents-du-travail":
    "/brand/expertises/droit-et-accidents-du-travail.jpg",
  "accidents-et-erreurs-medicales":
    "/brand/expertises/accidents-et-erreurs-medicales.jpg",
  "accidents-de-la-vie-courante": "/brand/expertises/accidents-de-la-vie-courante.jpg",
  "droit-assurances-particuliers-professionnels":
    "/brand/expertises/droit-assurances-particuliers-professionnels.jpg",
  "defense-des-consommateurs": "/brand/expertises/defense-des-consommateurs.jpg",
  "droit-de-la-famille": "/brand/expertises/droit-de-la-famille.jpg",
  divorce: "/brand/expertises/divorce.jpg",
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
    expertise.blogCategories.some((c) =>
      a.categories.some(
        (ac) => ac.toLowerCase() === c.toLowerCase() || ac.toLowerCase().includes(c.toLowerCase())
      )
    )
  )
  const related = matched.slice(0, 6)
  const pagePath = expertise.path || `/${expertise.pole}/${expertise.slug}`
  const pageUrl = `${site.url}${pagePath}`
  const hero =
    HERO_BY_SLUG[slug] ||
    (expertise.pole === "defense-penale"
      ? "/brand/expertises/droit-penal.jpg"
      : "/brand/hero-home.jpg")

  return (
    <ExpertisePageView
      expertise={expertise}
      site={site}
      faq={faq}
      related={related}
      pageUrl={pageUrl}
      heroImage={hero}
    />
  )
}

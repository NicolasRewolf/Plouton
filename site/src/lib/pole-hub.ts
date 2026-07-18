/**
 * Assemble hub pôle : JSON `pole-*.json` + registry (liens / heroes).
 * Couche données — garde queries.ts libre pour C5.
 */
import {
  readPageJson,
  type PoleHubCard,
  type PoleHubContent,
} from "@/lib/content"
import {
  getPolesRegistry,
  type RegistryExpertise,
  type RegistryPole,
} from "@/lib/registry"

const POLE_PAGE_FILES: Record<string, string> = {
  "defense-penale": "pole-defense-penale",
  "indemnisation-des-victimes": "pole-indemnisation-des-victimes",
  "droit-des-contrats-et-des-personnes":
    "pole-droit-des-contrats-et-des-personnes",
}

export interface PoleHubCardView {
  slug: string
  label: string
  href: string
  hint?: string
  synthese?: string
  hero: string
}

export interface LoadedPoleHub {
  pole: RegistryPole
  page: PoleHubContent
  cards: PoleHubCardView[]
}

function pathFromCardUrl(url: string): string | null {
  try {
    const u = url.startsWith("http") ? new URL(url).pathname : url
    return u.replace(/\/$/, "") || null
  } catch {
    return null
  }
}

function expertiseHref(pole: RegistryPole, e: RegistryExpertise): string {
  return e.path || `/${pole.slug}/${e.slug}`
}

function matchCard(
  cards: PoleHubCard[],
  pole: RegistryPole,
  e: RegistryExpertise
): PoleHubCard | undefined {
  const href = expertiseHref(pole, e)
  return cards.find((c) => {
    const path = pathFromCardUrl(c.url)
    if (!path) return false
    if (path === href) return true
    return path.endsWith(`/${e.slug}`) || path.includes(`/${e.slug}/`)
  })
}

export function loadPoleHub(poleSlug: string): LoadedPoleHub | null {
  const file = POLE_PAGE_FILES[poleSlug]
  if (!file) return null

  const pole = getPolesRegistry().poles.find((p) => p.slug === poleSlug)
  if (!pole) return null

  const page = readPageJson<PoleHubContent>(file)
  if (!page) return null

  const cards: PoleHubCardView[] = pole.expertises.map((e) => {
    const card = matchCard(page.cards || [], pole, e)
    return {
      slug: e.slug,
      label: e.label,
      href: expertiseHref(pole, e),
      hint: e.hint,
      synthese: card?.synthese,
      hero: e.hero,
    }
  })

  return { pole, page, cards }
}

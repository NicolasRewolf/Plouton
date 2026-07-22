/**
 * Pôle / expertise registry — single source of truth for nav, form objets, heroes.
 * Canonical JSON: contenu/reference/poles-registry.json (mirrored in src/data for client).
 */
import registry from "@/data/poles-registry.json"
import type { NavLink, NavPole } from "@/lib/nav-types"

export interface RegistryExpertise {
  slug: string
  label: string
  hint?: string
  path?: string
  formObjet: string
  hero: string
}

export interface RegistryPole {
  id: string
  slug: string
  label: string
  shortLabel: string
  href: string
  expertises: RegistryExpertise[]
}

interface PolesRegistry {
  poles: RegistryPole[]
  extraFormObjets: string[]
  sideLinks: NavLink[]
}

const data = registry as PolesRegistry

export function getPolesRegistry(): PolesRegistry {
  return data
}

export function listRegistryExpertises(): RegistryExpertise[] {
  return data.poles.flatMap((p) => p.expertises)
}

export function getRegistryExpertise(slug: string): RegistryExpertise | undefined {
  return listRegistryExpertises().find((e) => e.slug === slug)
}

/**
 * Chemin public d'une expertise — dérivé du registry, jamais tenu à la main.
 *
 * `revalidate-posts.ts` calculait déjà ces chemins pour son propre usage, mais
 * la route FAQ ne pouvait pas les atteindre : faute de savoir quelle page
 * montre une FAQ donnée, elle invalidait `/` en `layout`, c'est-à-dire le site
 * entier, à chaque écriture. Une seule question sur les 15 expertises périmait
 * les 422 articles et les 87 pages.
 *
 * `undefined` quand le slug est inconnu — c'est un cas que l'appelant doit
 * traiter, et le traiter par une invalidation large est la bonne réponse : on
 * préfère un cache trop froid à une page qui ne se met jamais à jour.
 */
export function expertisePathFor(slug: string): string | undefined {
  for (const pole of data.poles) {
    const hit = pole.expertises.find((e) => e.slug === slug)
    if (hit) return hit.path || `${pole.href}/${hit.slug}`
  }
  return undefined
}

/** Les chemins publics des 15 expertises. */
export function allExpertisePaths(): string[] {
  return data.poles.flatMap((pole) =>
    pole.expertises.map((e) => e.path || `${pole.href}/${e.slug}`)
  )
}

export function heroForSlug(slug: string, poleSlug?: string): string {
  const hit = getRegistryExpertise(slug)
  if (hit?.hero) return hit.hero
  if (poleSlug === "defense-penale") return "/brand/expertises/droit-penal.jpg"
  return "/brand/hero-home.jpg"
}

export function formObjets(): string[] {
  const fromRegistry = listRegistryExpertises().map((e) => e.formObjet)
  const seen = new Set<string>()
  const out: string[] = []
  for (const o of [...fromRegistry, ...data.extraFormObjets]) {
    if (seen.has(o)) continue
    seen.add(o)
    out.push(o)
  }
  return out
}

export function megaPolesFromRegistry(): NavPole[] {
  return data.poles.map((pole) => ({
    id: pole.id,
    label: pole.label,
    shortLabel: pole.shortLabel,
    href: pole.href,
    children: pole.expertises.map((e) => ({
      label: e.label,
      href:
        e.path ||
        `/${pole.slug}/${e.slug}`,
      hint: e.hint,
    })),
  }))
}

export function sideLinksFromRegistry(): NavLink[] {
  return data.sideLinks
}

export function isAllowedFormObjet(objet: string): boolean {
  return formObjets().includes(objet)
}

import type { Metadata } from "next"
import { getSite } from "@/lib/content"

/** URL absolue du site (canonical / OG). */
export function absoluteUrl(path = "/"): string {
  const base = getSite().url.replace(/\/$/, "")
  if (!path || path === "/") return base
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}

/** Métadonnées Open Graph de base pour une page publique. */
export function pageOpenGraph(opts: {
  path: string
  title?: string
  description?: string
  image?: string
}): NonNullable<Metadata["openGraph"]> {
  return {
    url: absoluteUrl(opts.path),
    ...(opts.title ? { title: opts.title } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    images: [{ url: opts.image || "/brand/equipe-home.png" }],
  }
}

/** Canonical + Open Graph pour les pages clés (chemins relatifs OK avec metadataBase). */
export function withCanonicalOg(opts: {
  title: string | { absolute: string }
  description?: string | null
  path: string
  type?: "website" | "article"
  image?: string
}): Metadata {
  const absoluteTitle =
    typeof opts.title === "string" ? opts.title : opts.title.absolute
  const description = opts.description || undefined
  return {
    title: opts.title,
    description,
    alternates: { canonical: absoluteUrl(opts.path) },
    openGraph: {
      type: opts.type ?? "website",
      title: absoluteTitle,
      description,
      url: absoluteUrl(opts.path),
      images: [{ url: opts.image || "/brand/equipe-home.png" }],
    },
  }
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function organizationSchema(site: {
  url: string
  name: string
  legalName: string
  phone: { e164: string }
  email: string
  address: {
    street: string
    postalCode: string
    city: string
    country: string
    /** Région administrative (SEO local) — ex. « Nouvelle-Aquitaine ». */
    region?: string
  }
  /** Coordonnées du cabinet (SEO local). Renseigner `geo` dans contenu/site.json. */
  geo?: { latitude: number; longitude: number }
  cabinetId: string
  founderId: string
  rating: { value: string; count: number }
  social?: {
    facebook?: string
    instagram?: string
    linkedin?: string
  }
}) {
  const sameAs = [
    site.social?.facebook,
    site.social?.instagram,
    site.social?.linkedin,
  ].filter(Boolean) as string[]

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LegalService"],
    "@id": site.cabinetId,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email,
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      ...(site.address.region ? { addressRegion: site.address.region } : {}),
      addressCountry: site.address.country,
    },
    ...(site.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: site.geo.latitude,
            longitude: site.geo.longitude,
          },
        }
      : {}),
    founder: {
      "@type": "Person",
      "@id": absoluteUrl("/auteur/julien-plouton#person"),
      name: "Julien Plouton",
      jobTitle: "Avocat au barreau de Bordeaux",
      url: absoluteUrl("/auteur/julien-plouton"),
    },
    // SEO local : zone desservie explicite (repris du live Wix, qui exposait
    // City + AdministrativeArea — signal perdu lors de la migration).
    areaServed: [
      { "@type": "City", name: site.address.city },
      ...(site.address.region
        ? [{ "@type": "AdministrativeArea", name: site.address.region }]
        : []),
      { "@type": "Country", name: "France" },
    ],
    priceRange: "€€",
  }
}

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
  address: { street: string; postalCode: string; city: string; country: string }
  cabinetId: string
  founderId: string
  rating: { value: string; count: number }
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LegalService"],
    "@id": site.cabinetId,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressCountry: site.address.country,
    },
    founder: {
      "@type": "Person",
      "@id": site.founderId,
      name: "Julien Plouton",
      jobTitle: "Avocat à la Cour",
    },
    areaServed: "FR",
    priceRange: "€€",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.rating.value,
      reviewCount: site.rating.count,
      bestRating: "5",
    },
  }
}

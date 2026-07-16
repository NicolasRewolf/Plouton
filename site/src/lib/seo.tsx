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

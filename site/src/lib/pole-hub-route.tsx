import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { PoleHub } from "@/components/PoleHub"
import { getSite } from "@/lib/content"
import { loadPoleHub } from "@/lib/pole-hub"
import { JsonLd, organizationSchema } from "@/lib/seo"

export function poleHubMetadata(poleSlug: string): Metadata {
  const loaded = loadPoleHub(poleSlug)
  if (!loaded) return { title: "Pôle" }
  const { page } = loaded
  return {
    title: { absolute: page.metaTitle || page.title },
    description: page.metaDescription || page.intro,
  }
}

export function PoleHubRoutePage({ poleSlug }: { poleSlug: string }) {
  const loaded = loadPoleHub(poleSlug)
  if (!loaded) {
    throw new Error(`Hub pôle manquant: ${poleSlug}`)
  }

  const site = getSite()
  const { page } = loaded

  return (
    <>
      <Header variant="site" />
      <JsonLd
        data={[
          organizationSchema(site),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.title,
            description: page.intro,
            url: `${site.url}${page.path || `/${poleSlug}`}`,
          },
        ]}
      />
      <PoleHub hub={loaded} />
      <Footer />
    </>
  )
}

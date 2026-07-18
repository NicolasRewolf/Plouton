import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { RessourcesHub } from "@/components/RessourcesHub"
import {
  readPageJson,
  getSite,
  type RessourcesHubContent,
} from "@/lib/content"
import { articlesBySlugs, mostViewedArticles } from "@/lib/queries"
import { JsonLd, organizationSchema } from "@/lib/seo"

function loadHub(): RessourcesHubContent {
  const hub = readPageJson<RessourcesHubContent>("comprendre-le-droit")
  if (!hub) throw new Error("contenu/pages/comprendre-le-droit.json manquant")
  return hub
}

export function generateMetadata(): Metadata {
  const hub = loadHub()
  return {
    title: { absolute: hub.metaTitle || hub.title },
    description: hub.metaDescription || hub.intro,
  }
}

export default function ComprendreLeDroitPage() {
  const hub = loadHub()
  const site = getSite()
  const mostConsulted = mostViewedArticles({
    limit: hub.mostConsulted.limit,
    categoryLabel: hub.mostConsulted.categoryLabel,
  })
  const sections = hub.sections.map((section) => ({
    section,
    articles: articlesBySlugs(section.slugs),
  }))

  return (
    <>
      <Header variant="site" />
      <JsonLd
        data={[
          organizationSchema(site),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: hub.h1 || hub.title,
            description: hub.intro,
            url: `${site.url}/comprendre-le-droit`,
          },
        ]}
      />
      <RessourcesHub hub={hub} mostConsulted={mostConsulted} sections={sections} />
      <Footer />
    </>
  )
}

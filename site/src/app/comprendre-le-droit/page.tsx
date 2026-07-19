import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { RessourcesHub } from "@/components/RessourcesHub"
import {
  readPageJson,
  getSite,
  type RessourcesHubContent,
} from "@/lib/content"
import {
  filterCategoryOptions,
  toGalleryItems,
} from "@/lib/gallery-filters"
import {
  articlesBySlugs,
  articlesMatchingLabels,
  mostViewedArticles,
} from "@/lib/queries"
import { JsonLd, organizationSchema, withCanonicalOg } from "@/lib/seo"

const AffairesGallery = dynamic(() =>
  import("@/components/AffairesGallery").then((m) => m.AffairesGallery)
)

const RESSOURCES_LABEL = "Ressources et notions juridiques"

function loadHub(): RessourcesHubContent {
  const hub = readPageJson<RessourcesHubContent>("comprendre-le-droit")
  if (!hub) throw new Error("contenu/pages/comprendre-le-droit.json manquant")
  return hub
}

export function generateMetadata(): Metadata {
  const hub = loadHub()
  return withCanonicalOg({
    title: { absolute: hub.metaTitle || hub.title },
    description: hub.metaDescription || hub.intro,
    path: "/comprendre-le-droit",
  })
}

export default async function ComprendreLeDroitPage() {
  const hub = loadHub()
  const site = getSite()
  const mostConsulted = await mostViewedArticles({
    limit: hub.mostConsulted.limit,
    categoryLabel: hub.mostConsulted.categoryLabel,
  })
  const sections = await Promise.all(
    hub.sections.map(async (section) => ({
      section,
      articles: await articlesBySlugs(section.slugs),
    }))
  )
  const allRessources = toGalleryItems(
    await articlesMatchingLabels([RESSOURCES_LABEL])
  )
  const categoryOptions = filterCategoryOptions(allRessources, [RESSOURCES_LABEL])

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
      <RessourcesHub
        hub={hub}
        mostConsulted={mostConsulted}
        sections={sections}
        allGallery={
          <AffairesGallery
            articles={allRessources}
            categories={categoryOptions}
            itemSingular="ressource"
            itemPlural="ressources"
            emptyMessage="Aucune ressource dans cette catégorie pour le moment."
            loadMoreLabel="Voir plus de ressources"
          />
        }
      />
      <Footer />
    </>
  )
}

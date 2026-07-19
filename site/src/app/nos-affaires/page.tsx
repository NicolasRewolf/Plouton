import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getContentPage, getSite } from "@/lib/content"
import {
  filterCategoryOptions,
  toGalleryItems,
} from "@/lib/gallery-filters"
import { publishedIndex } from "@/lib/queries"
import { JsonLd, organizationSchema, withCanonicalOg } from "@/lib/seo"

const AffairesGallery = dynamic(() =>
  import("@/components/AffairesGallery").then((m) => m.AffairesGallery)
)

const INTRO =
  "Derrière chaque affaire, une stratégie. Voici une sélection de dossiers traités par le cabinet — dans le respect du secret professionnel, pour éclairer nos méthodes et les décisions obtenues."

export function generateMetadata(): Metadata {
  const page = getContentPage("nos-affaires")
  return withCanonicalOg({
    title: { absolute: page?.metaTitle || "Nos affaires" },
    description:
      page?.metaDescription ||
      "Affaires et dossiers traités par le Cabinet Plouton à Bordeaux : droit pénal, victimes, famille.",
    path: "/nos-affaires",
  })
}

export default async function NosAffairesPage() {
  const page = getContentPage("nos-affaires")
  const site = getSite()

  const articles = toGalleryItems(await publishedIndex())
  const categoryOptions = filterCategoryOptions(articles)

  return (
    <>
      <Header variant="site" />
      <JsonLd
        data={[
          organizationSchema(site),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page?.title || "Nos affaires",
            url: `${site.url}/nos-affaires`,
          },
        ]}
      />

      <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f5f7f8_42%,#eef2f4_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(23,71,94,0.06),_transparent_60%)]"
        />

        <div className="relative mx-auto max-w-[1180px] px-5 pb-20 pt-12 sm:px-8 lg:pt-16">
          <header className="max-w-2xl">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-accent">
              Cabinet Plouton
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-navy text-balance">
              {page?.title || "Nos dernières affaires"}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-pretty text-muted sm:text-[17px]">
              {INTRO}
            </p>
          </header>

          <div className="mt-12 lg:mt-14">
            <AffairesGallery
              articles={articles}
              categories={categoryOptions}
              enableSort
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

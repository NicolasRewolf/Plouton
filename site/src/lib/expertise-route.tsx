import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExpertisePageView } from "@/components/ExpertisePageView"
import {
  expertiseMetadata as loadMeta,
  loadExpertisePage,
} from "@/lib/expertise-loader"

export function expertiseMetadata(slug: string): Metadata {
  return loadMeta(slug)
}

/** Thin App Router adapter — data assembly lives in expertise-loader. */
export function ExpertiseRoutePage({ slug }: { slug: string }) {
  const loaded = loadExpertisePage(slug)
  if (!loaded) notFound()

  return (
    <ExpertisePageView
      expertise={loaded.expertise}
      site={loaded.site}
      faq={loaded.faq}
      related={loaded.related}
      tocItems={loaded.tocItems}
      sections={loaded.sections}
      pageUrl={loaded.pageUrl}
      heroImage={loaded.heroImage}
      schema={loaded.schema}
    />
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalPageView } from "@/components/LegalPageView"
import { getLegalPage } from "@/lib/content"
import { absoluteUrl, pageOpenGraph } from "@/lib/seo"

export function generateMetadata(): Metadata {
  const page = getLegalPage("mentions-legales")
  if (!page) return { title: "Mentions légales" }
  const title = page.metaTitle || page.h1 || page.title
  return {
    title: { absolute: title },
    description: page.metaDescription,
    alternates: { canonical: absoluteUrl("/mentions-legales") },
    openGraph: pageOpenGraph({
      path: "/mentions-legales",
      title,
      description: page.metaDescription,
    }),
  }
}

export default function MentionsLegalesPage() {
  const page = getLegalPage("mentions-legales")
  if (!page) notFound()
  return <LegalPageView page={page} />
}

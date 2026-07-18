import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalPageView } from "@/components/LegalPageView"
import { getLegalPage } from "@/lib/content"

export function generateMetadata(): Metadata {
  const page = getLegalPage("politique-de-confidentialite")
  if (!page) return { title: "Politique de confidentialité" }
  return {
    title: { absolute: page.metaTitle || page.h1 || page.title },
    description: page.metaDescription,
    alternates: { canonical: "/politique-de-confidentialite" },
  }
}

export default function PolitiqueConfidentialitePage() {
  const page = getLegalPage("politique-de-confidentialite")
  if (!page) notFound()
  return <LegalPageView page={page} />
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalPageView } from "@/components/LegalPageView"
import { getLegalPage } from "@/lib/content"

export function generateMetadata(): Metadata {
  const page = getLegalPage("cookies")
  if (!page) return { title: "Cookies" }
  return {
    title: { absolute: page.metaTitle || page.h1 || page.title },
    description: page.metaDescription,
    alternates: { canonical: "/cookies" },
  }
}

export default function CookiesPage() {
  const page = getLegalPage("cookies")
  if (!page) notFound()
  return <LegalPageView page={page} />
}

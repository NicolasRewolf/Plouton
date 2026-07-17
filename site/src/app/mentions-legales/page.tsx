import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getContentPage, getSite } from "@/lib/content"

export function generateMetadata(): Metadata {
  const page = getContentPage("mentions-legales")
  return {
    title: { absolute: page?.metaTitle || "Mentions légales" },
    description: page?.metaDescription,
  }
}

export default function MentionsLegalesPage() {
  const page = getContentPage("mentions-legales")
  const site = getSite()
  const text = (page?.fullText || "").trim()

  return (
    <>
      <Header variant="site" />
      <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-navy">
          Mentions légales
        </h1>
        <div className="prose-plouton mt-8">
          {text
            ? text.split(/\n\n+/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))
            : (
              <p>
                {site.legalName} — {site.address.street}, {site.address.postalCode}{" "}
                {site.address.city}. Contact : {site.email} — {site.phone.display}.
              </p>
            )}
        </div>
      </div>
      <Footer />
    </>
  )
}

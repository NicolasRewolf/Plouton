import type { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getContentPage, getSite, publishedArticles } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export function generateMetadata(): Metadata {
  const page = getContentPage("nos-affaires")
  return {
    title: { absolute: page?.metaTitle || "Nos affaires" },
    description: page?.metaDescription || page?.intro,
  }
}

export default function NosAffairesPage() {
  const page = getContentPage("nos-affaires")
  const site = getSite()
  const articles = publishedArticles().slice(0, 48)

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
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-navy">
          {page?.title || "Nos dernières affaires"}
        </h1>
        {page?.intro ? (
          <p className="mt-5 text-[15px] leading-relaxed text-navy">{page.intro}</p>
        ) : null}
        <div className="mt-12 divide-y divide-line">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/post/${a.slug}`}
              className="group block py-5"
            >
              <p className="text-sm text-muted">
                {new Date(a.publishedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {a.categories[0] ? ` · ${a.categories[0]}` : null}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-navy group-hover:text-accent">
                {a.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}

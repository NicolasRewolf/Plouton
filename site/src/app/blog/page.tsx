import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { BlogListing } from "@/components/BlogListing"
import { publishedFull } from "@/lib/blog-pages"
import { getSite } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: { absolute: "Blog | Cabinet Plouton - Avocats pénalistes" },
  description:
    "Toutes les actualités, affaires et ressources juridiques du Cabinet Plouton — avocats pénalistes à Bordeaux.",
}

export default async function BlogPage() {
  const site = getSite()
  const articles = await publishedFull()
  return (
    <>
      <Header variant="site" />
      <JsonLd
        data={[
          organizationSchema(site),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `Blog — ${site.name}`,
            url: `${site.url}/blog`,
            inLanguage: "fr-FR",
            publisher: { "@id": site.cabinetId },
          },
        ]}
      />
      <BlogListing articles={articles} page={1} basePath="/blog" />
      <Footer />
    </>
  )
}

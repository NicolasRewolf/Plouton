import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { BlogListing } from "@/components/BlogListing"
import { articlesOfCategory, findCategory } from "@/lib/blog-pages"
import { getCategories, getSite } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export const dynamicParams = true

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = findCategory(slug)
  if (!category) return {}
  return {
    title: `${category.label} — Blog`,
    description:
      category.description ||
      `Articles ${category.label} du Cabinet Plouton, avocats à Bordeaux.`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = findCategory(slug)
  if (!category) notFound()
  const site = getSite()
  const articles = articlesOfCategory(category)
  const url = `${site.url}/blog/categories/${category.slug}`

  return (
    <>
      <Header variant="site" />
      <JsonLd
        data={[
          organizationSchema(site),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.label,
            description: category.description || undefined,
            url,
            inLanguage: "fr-FR",
            isPartOf: { "@type": "Blog", url: `${site.url}/blog` },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: site.url },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog` },
              { "@type": "ListItem", position: 3, name: category.label, item: url },
            ],
          },
        ]}
      />
      <div className="bg-page px-3 pt-8 sm:px-5">
        <div className="mx-auto max-w-[1140px]">
          <h1 className="font-display text-[27px] leading-snug text-ink sm:text-[33px]">
            {category.label}
          </h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-sm text-ink/80">{category.description}</p>
          ) : null}
        </div>
      </div>
      <BlogListing
        articles={articles}
        page={1}
        basePath={`/blog/categories/${category.slug}`}
        activeCategorySlug={category.slug}
      />
      <Footer />
    </>
  )
}

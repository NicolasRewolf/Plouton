import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { BlogListing, blogTotalPages } from "@/components/BlogListing"
import { articlesOfCategory, findCategory } from "@/lib/blog-pages"
import { getCategories } from "@/lib/content"

export const dynamicParams = true

export function generateStaticParams() {
  return getCategories().flatMap((c) => {
    const total = blogTotalPages(articlesOfCategory(c).length)
    return Array.from({ length: total - 1 }, (_, i) => ({
      slug: c.slug,
      n: String(i + 2),
    }))
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; n: string }>
}): Promise<Metadata> {
  const { slug, n } = await params
  const category = findCategory(slug)
  if (!category) return {}
  return {
    title: `${category.label} — page ${n}`,
    robots: { index: false, follow: true },
  }
}

export default async function CategoryPagedPage({
  params,
}: {
  params: Promise<{ slug: string; n: string }>
}) {
  const { slug, n } = await params
  const category = findCategory(slug)
  if (!category) notFound()
  const page = Number(n)
  const articles = articlesOfCategory(category)
  if (!Number.isInteger(page) || page < 2 || page > blogTotalPages(articles.length)) notFound()
  return (
    <>
      <Header variant="site" />
      <BlogListing
        articles={articles}
        page={page}
        basePath={`/blog/categories/${category.slug}`}
        activeCategorySlug={category.slug}
      />
      <Footer />
    </>
  )
}

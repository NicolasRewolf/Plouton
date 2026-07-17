import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { BlogListing, blogTotalPages } from "@/components/BlogListing"
import { publishedFull } from "@/lib/blog-pages"

export function generateStaticParams() {
  const total = blogTotalPages(publishedFull().length)
  return Array.from({ length: total - 1 }, (_, i) => ({ n: String(i + 2) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>
}): Promise<Metadata> {
  const { n } = await params
  return {
    title: `Blog — page ${n}`,
    robots: { index: false, follow: true },
  }
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ n: string }>
}) {
  const { n } = await params
  const page = Number(n)
  const articles = publishedFull()
  if (!Number.isInteger(page) || page < 2 || page > blogTotalPages(articles.length)) notFound()
  return (
    <>
      <Header variant="site" />
      <BlogListing articles={articles} page={page} basePath="/blog" />
      <Footer />
    </>
  )
}

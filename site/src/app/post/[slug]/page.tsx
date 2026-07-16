import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getArticle, getSite, publishedArticles } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export function generateStaticParams() {
  return publishedArticles().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article || article.status !== "published") return {}
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article || article.status !== "published") notFound()
  const site = getSite()
  const url = `${site.url}/post/${article.slug}`

  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: { "@type": "Person", name: article.author },
      publisher: { "@id": site.cabinetId },
      mainEntityOfPage: url,
      image: article.coverImage,
      inLanguage: "fr-FR",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: site.url },
        { "@type": "ListItem", position: 2, name: "Ressources", item: `${site.url}/blog` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ]

  return (
    <>
      <Header />
      <JsonLd data={schema} />
      <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span>Article</span>
        </nav>
        <p className="mb-3 text-sm text-muted">
          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {article.author}
          {article.minutesToRead ? ` · ${article.minutesToRead} min` : null}
        </p>
        <h1 className="font-display text-3xl leading-tight font-semibold md:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{article.excerpt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {article.categories.map((c) => (
            <span key={c} className="border border-line bg-fog px-2 py-1 text-xs">
              {c}
            </span>
          ))}
        </div>
        <div className="prose-plouton mt-10">
          {article.body.map((block, i) =>
            block.startsWith("## ") ? (
              <h2 key={i}>{block.replace(/^## /, "")}</h2>
            ) : (
              <p key={i}>{block}</p>
            )
          )}
        </div>
        <div className="mt-12 border-t border-line pt-8">
          <Link href="/contact" className="font-medium text-accent hover:underline">
            Échanger avec le cabinet →
          </Link>
        </div>
      </article>
      <Footer />
    </>
  )
}

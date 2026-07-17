import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getArticle, getSite, publishedArticles } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export const dynamicParams = true

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
      images: article.coverImage ? [article.coverImage] : undefined,
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
      dateModified: article.updatedAt || article.publishedAt,
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
        { "@type": "ListItem", position: 2, name: "Ressources", item: `${site.url}/#affaires` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ]

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />
      <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href="/nos-affaires" className="hover:text-accent">
            Affaires
          </Link>
        </nav>

        <p className="mb-3 text-sm text-muted">
          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {article.minutesToRead ? ` · ${article.minutesToRead} min` : null}
          {article.categories[0] ? ` · ${article.categories[0]}` : null}
        </p>

        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-navy md:text-4xl">
          {article.title}
        </h1>

        {article.excerpt ? (
          <p className="mt-4 text-lg leading-relaxed text-navy-soft">{article.excerpt}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {article.categories.map((c) => (
            <span key={c} className="border border-line bg-fog px-2 py-1 text-xs text-navy">
              {c}
            </span>
          ))}
        </div>

        {article.coverImage ? (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden">
            <Image
              src={article.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
            />
          </div>
        ) : null}

        {article.bodyHtml ? (
          <div
            className="prose-plouton mt-10"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        ) : (
          <div className="prose-plouton mt-10">
            {article.body.map((block, i) => (
              <p key={i}>{block}</p>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-line pt-8">
          <Link href="/honoraires-rendez-vous" className="font-medium text-accent hover:underline">
            Échanger avec le cabinet →
          </Link>
        </div>
      </article>
      <Footer />
    </>
  )
}

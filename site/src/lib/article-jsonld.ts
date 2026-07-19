/**
 * JSON-LD @graph article (brief #18 §4.1) — un seul bloc croisé par @id.
 */
import type { Article, Author, SiteConfig } from "@/lib/content"
import { absoluteUrl } from "@/lib/seo"
import { categoryPublicHref } from "@/lib/gallery-filters"
import { safeMetaDescription } from "@/lib/meta-description"

function toIsoDate(raw: string | undefined | null): string {
  if (!raw) return new Date().toISOString()
  if (raw.includes("T")) return raw
  // Date seule (YYYY-MM-DD) → midi Europe/Paris approximé en +02:00
  return `${raw.slice(0, 10)}T12:00:00+02:00`
}

function coverUrl(article: Article): string {
  if (article.coverImage?.startsWith("http")) return article.coverImage
  if (article.coverImage) return absoluteUrl(article.coverImage)
  return absoluteUrl("/brand/equipe-home.png")
}

function extractCitations(html: string | undefined): { name: string; url: string }[] {
  if (!html) return []
  const out: { name: string; url: string }[] = []
  const seen = new Set<string>()
  const re = /href="(https?:\/\/(?:www\.)?legifrance\.gouv\.fr[^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) && out.length < 12) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    out.push({ name: "Légifrance", url })
  }
  return out
}

function wordCountFromHtml(html: string | undefined): number | undefined {
  if (!html) return undefined
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!plain) return undefined
  return plain.split(" ").length
}

export function buildArticleGraph(opts: {
  article: Article
  site: SiteConfig
  author: Author | null
  url: string
}): Record<string, unknown> {
  const { article, site, author, url } = opts
  const authorSlug =
    author?.id || article.authorSlug || article.authorId || null
  const personId = authorSlug
    ? absoluteUrl(`/auteur/${authorSlug}#person`)
    : undefined
  const cover = coverUrl(article)
  const datePublished = toIsoDate(article.publishedAt)
  const dateModified = toIsoDate(
    article.updatedAt || article.publishedAt
  )
  const description =
    safeMetaDescription(article.metaDescription, article.excerpt) ||
    article.excerpt
  const words =
    article.minutesToRead && article.minutesToRead > 0
      ? undefined
      : wordCountFromHtml(article.bodyHtml)
  const wordCount = words
  const minutes =
    article.minutesToRead ||
    (wordCount ? Math.max(1, Math.round(wordCount / 250)) : undefined)
  const citations = extractCitations(article.bodyHtml)
  const section = article.categories || []

  const graph: Record<string, unknown>[] = []

  if (personId && author) {
    graph.push({
      "@type": "Person",
      "@id": personId,
      name: author.shortName,
      ...(author.legalName ? { alternateName: author.legalName } : {}),
      url: absoluteUrl(`/auteur/${author.id}`),
      ...(author.avatar
        ? {
            image: {
              "@type": "ImageObject",
              url: absoluteUrl(author.avatar),
            },
          }
        : {}),
      jobTitle: author.jobTitle || author.role || "Avocat à la Cour",
      worksFor: { "@id": site.cabinetId },
      ...(author.knowsAbout?.length ? { knowsAbout: author.knowsAbout } : {}),
      ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
      ...(author.bio ? { description: author.bio } : {}),
      ...(author.barAdmission
        ? {
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: "Inscription au barreau",
              recognizedBy: {
                "@type": "Organization",
                name: "Barreau de Bordeaux",
              },
            },
          }
        : {}),
    })
  }

  graph.push({
    "@type": "WebPage",
    "@id": url,
    url,
    name: article.metaTitle || article.title,
    isPartOf: { "@id": `${site.url}/#website` },
    primaryImageOfPage: { "@id": `${url}#cover` },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    inLanguage: "fr-FR",
    datePublished,
    dateModified,
    ...(article.reviewerSlug
      ? {
          reviewedBy: {
            "@id": absoluteUrl(`/auteur/${article.reviewerSlug}#person`),
          },
          ...(article.reviewedAt
            ? { lastReviewed: toIsoDate(article.reviewedAt) }
            : {}),
        }
      : {}),
  })

  graph.push({
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    isPartOf: { "@id": url },
    mainEntityOfPage: { "@id": url },
    url,
    headline: article.title.slice(0, 110),
    ...(article.metaTitle && article.metaTitle !== article.title
      ? { alternativeHeadline: article.metaTitle }
      : {}),
    description,
    image: {
      "@type": "ImageObject",
      "@id": `${url}#cover`,
      url: cover,
      width: 1200,
      height: 797,
    },
    ...(personId ? { author: { "@id": personId } } : {}),
    publisher: { "@id": site.cabinetId },
    datePublished,
    dateModified,
    ...(section.length ? { articleSection: section } : {}),
    ...(article.tags?.length ? { keywords: article.tags } : {}),
    ...(wordCount ? { wordCount } : {}),
    ...(minutes ? { timeRequired: `PT${minutes}M` } : {}),
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    ...(citations.length
      ? {
          citation: citations.map((c) => ({
            "@type": "WebPage",
            name: c.name,
            url: c.url,
          })),
        }
      : {}),
  })

  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: section[0] || "Ressources",
        item: absoluteUrl(categoryPublicHref(section[0] || "Ressources")),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  })

  return { "@context": "https://schema.org", "@graph": graph }
}

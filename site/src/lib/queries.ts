import {
  getArticle,
  getCategories,
  getFaq,
  getExpertise,
  listArticleIndex,
  listArticles,
  type Article,
  type ArticleIndexItem,
  type Category,
  type ExpertisePage,
  type FaqItem,
} from "@/lib/content"
import { labelEquals, labelsOverlap } from "@/lib/category-match"

/** Full JSON articles — use sparingly (admin, body, ricos). Prefer publishedIndex. */
export function publishedFull(): Article[] {
  return listArticles().filter((a) => a.status === "published")
}

/** Light index — listings, related, médias, nos-affaires (server-perf). */
export function publishedIndex(): ArticleIndexItem[] {
  return listArticleIndex()
}

/** Article matches a CMS category (id and/or label). */
export function articleMatchesCategory(
  article: Pick<Article, "categories" | "categoryIds"> | Pick<ArticleIndexItem, "categories">,
  category: Category
): boolean {
  const labels = article.categories || []
  if (labels.some((c) => labelEquals(c, category.label))) return true
  if ("categoryIds" in article && article.categoryIds?.includes(category.id)) return true
  return false
}

/** Article matches any of the given category labels (case-insensitive). */
export function articleMatchesLabels(
  article: Pick<Article, "categories"> | Pick<ArticleIndexItem, "categories">,
  labels: string[]
): boolean {
  return labelsOverlap(article.categories || [], labels)
}

export function articlesOfCategory(category: Category): ArticleIndexItem[] {
  return publishedIndex().filter((a) => articleMatchesCategory(a, category))
}

export function findCategoryBySlug(slugParam: string): Category | null {
  const target = decodeURIComponent(slugParam).normalize("NFC")
  return getCategories().find((c) => c.slug.normalize("NFC") === target) ?? null
}

export function articlesMatchingLabels(
  labels: string[],
  opts: { limit?: number; excludeSlug?: string } = {}
): ArticleIndexItem[] {
  const list = publishedIndex().filter((a) => {
    if (opts.excludeSlug && a.slug === opts.excludeSlug) return false
    return articleMatchesLabels(a, labels)
  })
  return opts.limit ? list.slice(0, opts.limit) : list
}

/** Related for expertise pages — same blogCategories labels. */
export function relatedForExpertise(
  expertise: ExpertisePage,
  limit = 16
): ArticleIndexItem[] {
  return articlesMatchingLabels(expertise.blogCategories || [], { limit })
}

/**
 * Related for a post — same category first, then recent (Wix behaviour).
 */
export function relatedForArticle(
  article: Pick<Article, "slug" | "categories">,
  limit = 2
): ArticleIndexItem[] {
  const others = publishedIndex().filter((a) => a.slug !== article.slug)
  const same = others.filter((a) =>
    a.categories.some((c) => article.categories.includes(c))
  )
  const rest = others.filter((a) => !same.includes(a))
  return [...same, ...rest].slice(0, limit)
}

export function mediasArticles(fallbackLimit = 24): ArticleIndexItem[] {
  const all = publishedIndex()
  const medias = all.filter((a) =>
    a.categories.some((c) => {
      const n = c.toLowerCase().normalize("NFC")
      return n.includes("média") || n.includes("media")
    })
  )
  return medias.length ? medias : all.slice(0, fallbackLimit)
}

/**
 * FAQ for an expertise — prefer slug file (contenu/faq/{slug}.json).
 * Falls back to faqExpertise only if it looks like a file key.
 */
export function faqForExpertise(expertise: ExpertisePage): FaqItem[] {
  const bySlug = getFaq(expertise.slug)
  if (bySlug.length) return bySlug

  const key = (expertise.faqExpertise || "").trim()
  if (!key) return []
  if (/^[a-z0-9-]+$/i.test(key) && !key.includes(" ")) {
    return getFaq(key)
  }
  return []
}

export function requireExpertise(slug: string): ExpertisePage {
  const e = getExpertise(slug)
  if (!e) throw new Error(`Expertise introuvable: ${slug}`)
  return e
}

export function getPublishedArticle(slug: string): Article | null {
  const a = getArticle(slug)
  if (!a || a.status !== "published") return null
  return a
}

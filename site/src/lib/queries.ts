import {
  getExpertise,
  getCategories,
  type Article,
  type ArticleIndexItem,
  type Category,
  type ExpertisePage,
  type FaqItem,
} from "@/lib/content"
import { labelEquals, labelsOverlap } from "@/lib/category-match"
import {
  resolvePublishedArticle,
  resolvePublishedIndex,
} from "@/lib/posts-public"

/** Light index — listings, related, médias, nos-affaires (C5 : DB). */
export async function publishedIndex(): Promise<ArticleIndexItem[]> {
  return resolvePublishedIndex()
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

export async function articlesOfCategory(category: Category): Promise<ArticleIndexItem[]> {
  const index = await publishedIndex()
  return index.filter((a) => articleMatchesCategory(a, category))
}

export function findCategoryBySlug(slugParam: string): Category | null {
  const target = decodeURIComponent(slugParam).normalize("NFC")
  return getCategories().find((c) => c.slug.normalize("NFC") === target) ?? null
}

export async function articlesMatchingLabels(
  labels: string[],
  opts: { limit?: number; excludeSlug?: string } = {}
): Promise<ArticleIndexItem[]> {
  const index = await publishedIndex()
  const list = index.filter((a) => {
    if (opts.excludeSlug && a.slug === opts.excludeSlug) return false
    return articleMatchesLabels(a, labels)
  })
  return opts.limit ? list.slice(0, opts.limit) : list
}

/** Related for expertise pages — same blogCategories labels. */
export async function relatedForExpertise(
  expertise: ExpertisePage,
  limit = 20
): Promise<ArticleIndexItem[]> {
  return articlesMatchingLabels(expertise.blogCategories || [], { limit })
}

/**
 * Related for a post — same category first, then recent (Wix behaviour).
 */
export async function relatedForArticle(
  article: Pick<Article, "slug" | "categories">,
  limit = 3
): Promise<ArticleIndexItem[]> {
  const index = await publishedIndex()
  const others = index.filter((a) => a.slug !== article.slug)
  const same = others.filter((a) =>
    a.categories.some((c) => article.categories.includes(c))
  )
  const rest = others.filter((a) => !same.includes(a))
  return [...same, ...rest].slice(0, limit)
}

export async function mediasArticles(fallbackLimit = 24): Promise<ArticleIndexItem[]> {
  const all = await publishedIndex()
  const medias = all.filter((a) =>
    a.categories.some((c) => {
      const n = c.toLowerCase().normalize("NFC")
      return n.includes("média") || n.includes("media")
    })
  )
  return medias.length ? medias : all.slice(0, fallbackLimit)
}

/** Affaires = hors guides « Ressources » (ceux-ci vivent sur `/comprendre-le-droit`). */
export async function affairesArticles(): Promise<ArticleIndexItem[]> {
  const all = await publishedIndex()
  return all.filter(
    (a) =>
      !a.categories.some((c) => {
        const n = c.toLowerCase().normalize("NFC")
        return n.includes("ressources et notions")
      })
  )
}

/** Résout une liste de slugs (ordre préservé) depuis l’index. */
export async function articlesBySlugs(slugs: string[]): Promise<ArticleIndexItem[]> {
  const index = await publishedIndex()
  const bySlug = new Map(index.map((a) => [a.slug.normalize("NFC"), a]))
  const out: ArticleIndexItem[] = []
  for (const raw of slugs) {
    const hit = bySlug.get(raw.normalize("NFC"))
    if (hit) out.push(hit)
  }
  return out
}

/** Articles les plus vus, optionnellement filtrés par catégorie.
 * Source unique : posts.view_count (réconcilié depuis stats-posts, brief #18). */
export async function mostViewedArticles(opts: {
  limit: number
  categoryLabel?: string
}): Promise<ArticleIndexItem[]> {
  let list = await publishedIndex()
  if (opts.categoryLabel)
    list = list.filter((a) => articleMatchesLabels(a, [opts.categoryLabel!]))
  list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  return list.slice(0, opts.limit)
}

/**
 * FAQ for an expertise — lit Supabase (`public.faq`).
 * Plus de JSON runtime (`contenu/faq/*.json` archivés).
 */
export async function faqForExpertise(
  expertise: ExpertisePage
): Promise<FaqItem[]> {
  const { getFaqForExpertise } = await import("@/lib/faq-db")
  return getFaqForExpertise(expertise.slug)
}

export function requireExpertise(slug: string): ExpertisePage {
  const e = getExpertise(slug)
  if (!e) throw new Error(`Expertise introuvable: ${slug}`)
  return e
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  return resolvePublishedArticle(slug)
}

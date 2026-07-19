import fs from "node:fs"
import path from "node:path"
import {
  contentRoot,
  getFaq,
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

/** Light index — listings, related, médias, nos-affaires (C5 : DB ∪ JSON). */
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
  limit = 16
): Promise<ArticleIndexItem[]> {
  return articlesMatchingLabels(expertise.blogCategories || [], { limit })
}

/**
 * Related for a post — same category first, then recent (Wix behaviour).
 */
export async function relatedForArticle(
  article: Pick<Article, "slug" | "categories">,
  limit = 2
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

/** Vues Wix (stats-posts.json) — pour hubs / tri « plus consultés ». */
function postViewCounts(): Record<string, number> {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(contentRoot, "stats-posts.json"), "utf8")
    ) as Record<string, { views?: number }>
    const out: Record<string, number> = {}
    for (const [slug, s] of Object.entries(raw)) out[slug] = s.views ?? 0
    return out
  } catch {
    return {}
  }
}

function withViews(
  item: ArticleIndexItem,
  views: Record<string, number>
): ArticleIndexItem {
  return { ...item, viewCount: views[item.slug] ?? item.viewCount ?? 0 }
}

/** Résout une liste de slugs (ordre préservé) depuis l’index. */
export async function articlesBySlugs(slugs: string[]): Promise<ArticleIndexItem[]> {
  const index = await publishedIndex()
  const bySlug = new Map(index.map((a) => [a.slug.normalize("NFC"), a]))
  const views = postViewCounts()
  const out: ArticleIndexItem[] = []
  for (const raw of slugs) {
    const hit = bySlug.get(raw.normalize("NFC"))
    if (hit) out.push(withViews(hit, views))
  }
  return out
}

/** Articles les plus vus, optionnellement filtrés par catégorie. */
export async function mostViewedArticles(opts: {
  limit: number
  categoryLabel?: string
}): Promise<ArticleIndexItem[]> {
  const views = postViewCounts()
  let list = (await publishedIndex()).map((a) => withViews(a, views))
  if (opts.categoryLabel)
    list = list.filter((a) => articleMatchesLabels(a, [opts.categoryLabel!]))
  list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  return list.slice(0, opts.limit)
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

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  return resolvePublishedArticle(slug)
}

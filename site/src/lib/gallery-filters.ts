import { categorySlug, type ArticleIndexItem } from "@/lib/content"
import { labelEquals } from "@/lib/category-match"

/** Options de chips = catégories présentes sur les articles, hors labels « hub ». */
export function filterCategoryOptions(
  articles: Pick<ArticleIndexItem, "categories">[],
  excludeLabels: string[] = []
): { label: string; slug: string }[] {
  return Array.from(
    new Map(
      articles.flatMap((a) =>
        a.categories
          .filter((label) => !excludeLabels.some((ex) => labelEquals(label, ex)))
          .map((label) => [label, { label, slug: categorySlug(label) }] as const)
      )
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, "fr"))
}

/** Hub public pour un libellé de catégorie (plus de fourre-tout `/blog`). */
export function categoryPublicHref(label: string): string {
  const n = label.toLowerCase().normalize("NFC")
  if (n.includes("média") || n.includes("media")) return "/medias"
  if (n.includes("ressources et notions")) return "/comprendre-le-droit"
  return "/nos-affaires"
}

export function toGalleryItems(
  articles: ArticleIndexItem[],
  extras?: { authorBySlug?: Record<string, string> }
) {
  return articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    categories: a.categories,
    coverImage: a.coverImage,
    minutesToRead: a.minutesToRead,
    viewCount: a.viewCount,
    authorName: extras?.authorBySlug?.[a.slug],
  }))
}

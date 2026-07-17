import {
  getCategories,
  listArticles,
  type Article,
  type Category,
} from "@/lib/content"

/** Articles publiés, triés récents d'abord (lecture complète — build/SSG). */
export function publishedFull(): Article[] {
  return listArticles().filter((a) => a.status === "published")
}

export function findCategory(slugParam: string): Category | null {
  const target = decodeURIComponent(slugParam).normalize("NFC")
  return (
    getCategories().find((c) => c.slug.normalize("NFC") === target) ?? null
  )
}

export function articlesOfCategory(category: Category): Article[] {
  return publishedFull().filter(
    (a) =>
      a.categoryIds?.includes(category.id) ||
      a.categories.includes(category.label)
  )
}

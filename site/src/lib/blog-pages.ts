import {
  articlesOfCategory,
  findCategoryBySlug,
  publishedIndex,
} from "@/lib/queries"
import type { ArticleIndexItem, Category } from "@/lib/content"

export { publishedIndex as publishedFull, articlesOfCategory }

export function findCategory(slugParam: string): Category | null {
  return findCategoryBySlug(slugParam)
}

export type { ArticleIndexItem as Article, Category }

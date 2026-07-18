import {
  articlesOfCategory,
  findCategoryBySlug,
  publishedFull,
} from "@/lib/queries"
import type { Article, Category } from "@/lib/content"

export { publishedFull, articlesOfCategory }

export function findCategory(slugParam: string): Category | null {
  return findCategoryBySlug(slugParam)
}

/** @deprecated prefer articlesOfCategory from queries */
export type { Article, Category }

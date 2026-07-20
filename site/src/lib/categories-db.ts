/**
 * Lecture `public.categories` + vue `category_post_counts` (docs/17 / P1-D).
 * Fallback : contenu/categories.json.
 */
import { defineCollection } from "@/lib/cms-collection"
import { adminClient } from "@/lib/supabase/admin"
import { getCategories, type Category } from "@/lib/content"

export const CATEGORIES_CACHE_TAG = "categories"

type CategoryRow = {
  id: string
  label: string
  slug: string
  description: string | null
  sort_order: number
  meta_title: string | null
  meta_description: string | null
  cover_image: string | null
}

type CountRow = {
  id: string
  post_count: number
}

function rowToCategory(r: CategoryRow, postCount: number): Category {
  return {
    id: r.id,
    label: r.label,
    slug: r.slug,
    description: r.description || "",
    postCount,
    url: `/blog/categories/${r.slug}`,
    coverImage: r.cover_image,
    language: "fr",
    metaTitle: r.meta_title || undefined,
    metaDescription: r.meta_description || undefined,
  }
}

async function fetchCategoriesFromDb(): Promise<Category[] | null> {
  const client = adminClient()
  if (!client) return null

  const [{ data: cats, error: cErr }, { data: counts, error: nErr }] =
    await Promise.all([
      client
        .from("categories")
        .select(
          "id, label, slug, description, sort_order, meta_title, meta_description, cover_image"
        )
        .order("sort_order", { ascending: true }),
      client.from("category_post_counts").select("id, post_count"),
    ])

  if (cErr) {
    console.warn(`[categories-db] ${cErr.message}`)
    return null
  }
  if (nErr) console.warn(`[categories-db] counts: ${nErr.message}`)
  if (!cats?.length) return null

  const byId = new Map(
    ((counts || []) as CountRow[]).map((c) => [c.id, c.post_count])
  )
  return (cats as CategoryRow[]).map((r) =>
    rowToCategory(r, byId.get(r.id) ?? 0)
  )
}

/** Rubriques (+ compteurs d'articles) — base puis instantané JSON. */
export const resolveCategories = defineCollection<Category[]>({
  tag: CATEGORIES_CACHE_TAG,
  key: ["categories-list"],
  fromDb: fetchCategoriesFromDb,
  fallback: getCategories,
})

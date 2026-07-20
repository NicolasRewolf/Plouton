import { revalidatePath, revalidateTag } from "next/cache"
import { POSTS_CACHE_TAG } from "@/lib/posts-db"
import { CATEGORIES_CACHE_TAG } from "@/lib/categories-db"
import { getPolesRegistry } from "@/lib/registry"

/**
 * Surfaces publiques qui lisent l'index des articles.
 *
 * L'ancienne liste était un tableau littéral de 9 chemins, tenu à la main.
 * Elle avait dérivé dans les deux sens : trois entrées ne servaient plus
 * (`/blog` et son layout sont redirigés en 301 par next.config ; `/admin` est
 * `force-dynamic`, donc sans entrée de cache à invalider), et cinq surfaces
 * qui lisent pourtant les articles n'y figuraient pas — les 15 pages
 * d'expertise (articles liés), les pages auteur, et le flux RSS.
 *
 * Les chemins d'expertise sont désormais DÉRIVÉS du registry : ajouter une
 * expertise suffit, on n'a plus à penser à revenir ici.
 */
function expertisePaths(): string[] {
  return getPolesRegistry().poles.flatMap((pole) =>
    pole.expertises.map((e) => e.path || `${pole.href}/${e.slug}`)
  )
}

const STATIC_SURFACES = [
  "/",
  "/nos-affaires",
  "/medias",
  "/comprendre-le-droit",
  "/sitemap.xml",
  "/rss.xml",
]

/** Invalide le cache public après save / publish admin. */
export function revalidatePostSurfaces(slug: string) {
  revalidateTag(POSTS_CACHE_TAG, "max")
  // Les compteurs d'articles par rubrique sont calculés dans le cache
  // `categories` : publier un article les périme aussi.
  revalidateTag(CATEGORIES_CACHE_TAG, "max")

  revalidatePath(`/post/${slug}`)
  for (const path of STATIC_SURFACES) revalidatePath(path)
  for (const path of expertisePaths()) revalidatePath(path)
  // Les pages auteur listent les articles publiés. L'auteur concerné a pu
  // changer au cours de la sauvegarde : on invalide le segment entier.
  revalidatePath("/auteur/[slug]", "page")
}

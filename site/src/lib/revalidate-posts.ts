import { revalidatePath, revalidateTag } from "next/cache"
import { POSTS_CACHE_TAG } from "@/lib/posts-db"

/** Invalide le cache public après save / publish admin. */
export function revalidatePostSurfaces(slug: string) {
  revalidateTag(POSTS_CACHE_TAG, "max")
  revalidatePath(`/post/${slug}`)
  revalidatePath("/blog")
  revalidatePath("/blog", "layout")
  revalidatePath("/nos-affaires")
  revalidatePath("/comprendre-le-droit")
  revalidatePath("/")
  revalidatePath("/sitemap.xml")
  revalidatePath("/admin")
}

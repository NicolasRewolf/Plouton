/**
 * Lecture `public.authors` (P1-A) — secret serveur, fallback JSON.
 * Filtre `is_author` : exclut assistantes / non-signatures.
 */
import { defineCollection } from "@/lib/cms-collection"
import { adminClient } from "@/lib/supabase/admin"
import { listAuthors, type Author } from "@/lib/content"

/**
 * Aucun `revalidateTag(AUTHORS_CACHE_TAG)` n'existe dans le dépôt, et c'est
 * normal : rien n'écrit `public.authors`. La table se modifie à la console
 * Supabase, et la fenêtre de revalidation de `defineCollection` suffit à
 * rattraper le changement. Le jour où un écran admin des auteurs apparaîtra,
 * c'est ici qu'il faudra venir invalider — d'où le tag, exporté d'avance.
 */
export const AUTHORS_CACHE_TAG = "authors"

type AuthorRow = {
  id: string
  wix_id: string | null
  display_name: string
  short_name: string
  legal_name: string | null
  avatar: string | null
  bio: string
  role: string | null
  job_title: string | null
  formation: string | null
  bar_admission: string | null
  knows_about: string[] | null
  is_author: boolean | null
  linkedin: string | null
  position: number
}

function rowToAuthor(r: AuthorRow): Author {
  return {
    id: r.id,
    wixId: r.wix_id || undefined,
    displayName: r.display_name,
    shortName: r.short_name,
    legalName: r.legal_name || r.display_name,
    avatar: r.avatar || "",
    bio: r.bio || "",
    role: r.role || undefined,
    jobTitle: r.job_title || r.role || undefined,
    formation: r.formation || undefined,
    barAdmission: r.bar_admission || undefined,
    knowsAbout: r.knows_about || undefined,
    isAuthor: r.is_author !== false,
    linkedin: r.linkedin,
  }
}

async function fetchAuthorsFromDb(): Promise<Author[] | null> {
  const client = adminClient()
  if (!client) return null
  const { data, error } = await client
    .from("authors")
    .select("*")
    .order("position", { ascending: true })
  if (error) {
    console.warn(`[authors-db] ${error.message}`)
    return null
  }
  if (!data?.length) return null
  return (data as AuthorRow[])
    .map(rowToAuthor)
    .filter((a) => a.isAuthor !== false)
}

/**
 * Auteurs — base puis instantané JSON.
 * `fetchAuthorsFromDb` renvoie déjà `null` sur table vide : une table
 * d'auteurs vide signifie « pas encore semée », pas « aucun auteur ».
 */
export const resolveAuthors = defineCollection<Author[]>({
  tag: AUTHORS_CACHE_TAG,
  key: ["authors-list"],
  fromDb: fetchAuthorsFromDb,
  fallback: () => listAuthors().filter((a) => a.isAuthor !== false),
})

export async function resolveAuthorBySlug(
  slug: string
): Promise<Author | null> {
  const authors = await resolveAuthors()
  return authors.find((a) => a.id === slug) ?? null
}

/** True si slug est une signature blog connue. */
export async function isKnownAuthorSlug(slug: string): Promise<boolean> {
  if (!slug.trim()) return false
  const authors = await resolveAuthors()
  return authors.some((a) => a.id === slug)
}

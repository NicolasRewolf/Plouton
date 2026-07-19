/**
 * Lecture `public.authors` (P1-A) — secret serveur, fallback JSON.
 * Filtre `is_author` : exclut assistantes / non-signatures.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { listAuthors, type Author } from "@/lib/content"

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

function secretClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
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
  const client = secretClient()
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

const cachedAuthors = unstable_cache(
  async () => fetchAuthorsFromDb(),
  ["authors-list"],
  { tags: [AUTHORS_CACHE_TAG] }
)

/** DB puis JSON (signatures blog uniquement). */
export async function resolveAuthors(): Promise<Author[]> {
  const fromDb = await cachedAuthors()
  if (fromDb?.length) return fromDb
  return listAuthors().filter((a) => a.isAuthor !== false)
}

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

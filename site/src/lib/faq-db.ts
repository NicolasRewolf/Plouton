/**
 * Lecture / écriture `public.faq` (FAQ unifiée).
 *
 * Public : `status = published` via clé secrète serveur
 * (`SUPABASE_SECRET_KEY`) — pas de RLS anon (comme posts C5).
 */

import { defineKeyedCollection } from "@/lib/cms-collection"
import { adminClient } from "@/lib/supabase/admin"
import type { FaqItem } from "@/lib/content"

export const FAQ_CACHE_TAG = "faq"

export type FaqStatus = "draft" | "published"

export interface FaqRow {
  id: string
  wix_id: string | null
  question: string
  answer: string
  expertise_slug: string
  sous_expertise: string | null
  likes: number
  status: FaqStatus
  sort_order: number | null
  created_at: string
  updated_at: string
}

export interface FaqAdminItem extends FaqItem {
  id: string
  expertiseSlug: string
  status: FaqStatus
  likes: number
  sortOrder: number | null
  wixId: string | null
  updatedAt: string
}

function hasSecretEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  )
}

export function isFaqConfigured(): boolean {
  return hasSecretEnv()
}

function rowToFaqItem(row: FaqRow): FaqItem {
  return {
    question: row.question,
    answer: row.answer,
    sousExpertise: row.sous_expertise || undefined,
  }
}

function rowToAdminItem(row: FaqRow): FaqAdminItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sousExpertise: row.sous_expertise || undefined,
    expertiseSlug: row.expertise_slug,
    status: row.status === "draft" ? "draft" : "published",
    likes: row.likes ?? 0,
    sortOrder: row.sort_order,
    wixId: row.wix_id,
    updatedAt: row.updated_at,
  }
}

/**
 * FAQ publiées pour une page expertise.
 *
 * Passe par `unstable_cache` porteur de FAQ_CACHE_TAG : la route
 * `/api/faq` appelait déjà `revalidateTag(FAQ_CACHE_TAG)`, mais aucune entrée
 * de cache ne portait ce tag — l'invalidation ne touchait rien. La fraîcheur
 * reposait en fait sur un `revalidatePath("/", "layout")` de secours, sauté
 * dès que la requête ne précisait pas d'expertise.
 */
export const getFaqForExpertise = defineKeyedCollection<FaqItem[]>({
  tag: FAQ_CACHE_TAG,
  key: ["faq-expertise"],
  fromDb: fetchFaqForExpertise,
  // La FAQ n'a pas d'instantané JSON (archivé, cf. queries.ts) : sans base,
  // une expertise s'affiche sans sa FAQ plutôt qu'avec une FAQ périmée.
  fallback: () => [],
})

async function fetchFaqForExpertise(slug: string): Promise<FaqItem[] | null> {
  const client = adminClient()
  if (!client) {
    console.warn("[faq] SUPABASE_SECRET_KEY absente — FAQ vide pour", slug)
    return null
  }

  const { data, error } = await client
    .from("faq")
    .select(
      "id, wix_id, question, answer, expertise_slug, sous_expertise, likes, status, sort_order, created_at, updated_at"
    )
    .eq("expertise_slug", slug)
    .eq("status", "published")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[faq] lecture expertise", slug, error.message)
    return null
  }

  return ((data || []) as FaqRow[]).map(rowToFaqItem)
}

export interface ListFaqAdminOpts {
  q?: string
  expertiseSlug?: string
  status?: FaqStatus | "all"
  page?: number
  pageSize?: number
}

export async function listFaqAdmin(
  opts: ListFaqAdminOpts = {}
): Promise<{ items: FaqAdminItem[]; total: number } | null> {
  const client = adminClient()
  if (!client) return null

  const page = Math.max(1, opts.page || 1)
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 40))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from("faq")
    .select(
      "id, wix_id, question, answer, expertise_slug, sous_expertise, likes, status, sort_order, created_at, updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (opts.expertiseSlug) query = query.eq("expertise_slug", opts.expertiseSlug)
  if (opts.status && opts.status !== "all") query = query.eq("status", opts.status)
  if (opts.q?.trim()) {
    const q = opts.q.trim().replace(/[%_,."()\\]/g, " ").slice(0, 80)
    if (q) query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%,sous_expertise.ilike.%${q}%`)
  }

  const { data, error, count } = await query
  if (error) {
    console.error("[faq] list admin", error.message)
    return null
  }

  return {
    items: ((data || []) as FaqRow[]).map(rowToAdminItem),
    total: count ?? 0,
  }
}

export async function getFaqById(id: string): Promise<FaqAdminItem | null> {
  const client = adminClient()
  if (!client) return null

  const { data, error } = await client
    .from("faq")
    .select(
      "id, wix_id, question, answer, expertise_slug, sous_expertise, likes, status, sort_order, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[faq] getById", error.message)
    return null
  }
  if (!data) return null
  return rowToAdminItem(data as FaqRow)
}

export interface FaqWriteInput {
  question: string
  answer: string
  expertiseSlug: string
  sousExpertise?: string | null
  status?: FaqStatus
  likes?: number
  sortOrder?: number | null
  wixId?: string | null
}

export async function createFaq(input: FaqWriteInput): Promise<FaqAdminItem | null> {
  const client = adminClient()
  if (!client) return null

  const { data, error } = await client
    .from("faq")
    .insert({
      question: input.question.trim(),
      answer: input.answer.trim(),
      expertise_slug: input.expertiseSlug.trim(),
      sous_expertise: input.sousExpertise?.trim() || null,
      status: input.status === "draft" ? "draft" : "published",
      likes: input.likes ?? 0,
      sort_order: input.sortOrder ?? null,
      wix_id: input.wixId || null,
    })
    .select(
      "id, wix_id, question, answer, expertise_slug, sous_expertise, likes, status, sort_order, created_at, updated_at"
    )
    .single()

  if (error) {
    console.error("[faq] create", error.message)
    return null
  }
  return rowToAdminItem(data as FaqRow)
}

export async function updateFaq(
  id: string,
  input: Partial<FaqWriteInput>
): Promise<FaqAdminItem | null> {
  const client = adminClient()
  if (!client) return null

  const patch: Record<string, unknown> = {}
  if (input.question !== undefined) patch.question = input.question.trim()
  if (input.answer !== undefined) patch.answer = input.answer.trim()
  if (input.expertiseSlug !== undefined)
    patch.expertise_slug = input.expertiseSlug.trim()
  if (input.sousExpertise !== undefined)
    patch.sous_expertise = input.sousExpertise?.trim() || null
  if (input.status !== undefined)
    patch.status = input.status === "draft" ? "draft" : "published"
  if (input.likes !== undefined) patch.likes = input.likes
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder
  if (input.wixId !== undefined) patch.wix_id = input.wixId || null

  const { data, error } = await client
    .from("faq")
    .update(patch)
    .eq("id", id)
    .select(
      "id, wix_id, question, answer, expertise_slug, sous_expertise, likes, status, sort_order, created_at, updated_at"
    )
    .single()

  if (error) {
    console.error("[faq] update", error.message)
    return null
  }
  return rowToAdminItem(data as FaqRow)
}

export async function deleteFaq(id: string): Promise<boolean> {
  const client = adminClient()
  if (!client) return false

  const { error } = await client.from("faq").delete().eq("id", id)
  if (error) {
    console.error("[faq] delete", error.message)
    return false
  }
  return true
}

/**
 * Lecture `content_singletons` clé `contact` (docs/17).
 * Fallback : contenu/site.json (getSite) pour les coordonnées.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { getSite } from "@/lib/content"

export const CONTACT_CACHE_TAG = "contact"

export interface ContactInfo {
  phone: { display: string; href: string; e164: string }
  email: string
  address: {
    street: string
    postalCode: string
    city: string
    region?: string
    country: string
  }
  hours: string
  rating: { value: string; count: number }
  googleReviewsUrl: string
}

type ContactRow = {
  key: string
  data: Partial<ContactInfo> | null
  status: string
}

function secretClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function fromSiteJson(): ContactInfo {
  const site = getSite()
  return {
    phone: site.phone,
    email: site.email,
    address: site.address,
    hours: site.hours,
    rating: site.rating,
    googleReviewsUrl: site.googleReviewsUrl,
  }
}

function mergeContact(data: Partial<ContactInfo> | null | undefined): ContactInfo {
  const base = fromSiteJson()
  if (!data || typeof data !== "object") return base
  return {
    phone: data.phone ?? base.phone,
    email: data.email ?? base.email,
    address: data.address ?? base.address,
    hours: data.hours ?? base.hours,
    rating: data.rating ?? base.rating,
    googleReviewsUrl: data.googleReviewsUrl ?? base.googleReviewsUrl,
  }
}

async function fetchContactFromDb(): Promise<ContactInfo | null> {
  const client = secretClient()
  if (!client) return null
  const { data, error } = await client
    .from("content_singletons")
    .select("key, data, status")
    .eq("key", "contact")
    .eq("status", "published")
    .maybeSingle()
  if (error) {
    console.warn(`[contact-db] ${error.message}`)
    return null
  }
  if (!data) return null
  return mergeContact((data as ContactRow).data)
}

const cachedContact = unstable_cache(
  async () => fetchContactFromDb(),
  ["contact-singleton"],
  { tags: [CONTACT_CACHE_TAG] }
)

/** DB puis site.json. */
export async function resolveContact(): Promise<ContactInfo> {
  const fromDb = await cachedContact()
  if (fromDb) return fromDb
  return fromSiteJson()
}

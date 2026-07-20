/**
 * Lecture `content_singletons` clé `contact` (docs/17).
 * Fallback : contenu/site.json (getSite) pour les coordonnées.
 */
import { defineCollection } from "@/lib/cms-collection"
import { adminClient } from "@/lib/supabase/admin"
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
  const client = adminClient()
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

/** Coordonnées du cabinet — base puis site.json. */
export const resolveContact = defineCollection<ContactInfo>({
  tag: CONTACT_CACHE_TAG,
  key: ["contact-singleton"],
  fromDb: fetchContactFromDb,
  fallback: fromSiteJson,
})

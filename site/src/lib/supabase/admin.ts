/**
 * Le client Supabase serveur — un seul.
 *
 * Cette construction existait en SIX exemplaires verbatim : `posts-db`,
 * `authors-db`, `categories-db`, `contact-db`, `faq-db`, `store`. Six copies,
 * c'est six endroits où corriger le jour où la politique change (un timeout,
 * un en-tête, une clé qui tourne) — et cinq occasions d'en oublier une.
 *
 * Ce client porte la clé SECRÈTE : il contourne RLS par construction. Il ne
 * doit jamais être importé depuis un composant client. Le nom du fichier
 * (`admin`) est là pour que ça se voie à l'import.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Les clés serveur sont-elles présentes ? (décision de source) */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  )
}

/** Client serveur, ou `null` si non configuré — jamais d'exception ici. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Variante stricte, pour les chemins d'ÉCRITURE : sans clé, une écriture qui
 * échoue en silence est pire qu'une exception.
 */
export function requireAdminClient(): SupabaseClient {
  const client = adminClient()
  if (!client)
    throw new Error(
      "Supabase : NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY manquants."
    )
  return client
}

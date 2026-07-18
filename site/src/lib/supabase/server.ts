import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Client Supabase lié à la session utilisateur (cookies) — pour l'admin.
 * Utilise la clé PUBLISHABLE : les droits viennent de la session + RLS
 * (policies « avocats » de la migration 0002), jamais de la clé.
 */
export async function supabaseServer() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key)
    throw new Error("Supabase : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquants.")
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Appel depuis un Server Component (lecture seule) : le proxy
          // rafraîchit les sessions, on peut ignorer l'écriture ici.
        }
      },
    },
  })
}

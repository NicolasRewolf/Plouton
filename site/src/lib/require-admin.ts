/**
 * Autorisation des routes d'écriture admin — un seul endroit.
 *
 * Cette fonction existait en cinq copies verbatim (posts, faq, authors,
 * versions, media). Aucune ne vérifiait l'allowlist `ADMIN_EMAILS` : celle-ci
 * ne vivait que dans `proxy.ts`, dont le matcher est `/admin/:path*` et qui
 * ne voit donc jamais `/api/*`. Un compte retiré de la liste restait bloqué à
 * l'écran mais pouvait continuer d'écrire par l'API — laquelle écrit avec la
 * clé secrète, sans RLS pour rattraper.
 *
 * Cinq copies, c'est cinq occasions d'oublier le contrôle. Une seule, c'est
 * un endroit à corriger le jour où la règle change.
 */
import { isAllowedAdminEmail } from "@/lib/admin-emails"
import { supabaseServer } from "@/lib/supabase/server"

/** L'utilisateur admin authentifié ET autorisé, sinon `null`. */
export async function requireAdmin() {
  try {
    const supabase = await supabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    if (!isAllowedAdminEmail(user.email)) return null
    return user
  } catch {
    return null
  }
}

/**
 * Corps JSON illisible → `null`, à traduire en 400 par l'appelant.
 * Sans cette garde, `await req.json()` laissait la promesse rejetée
 * s'échapper du handler : 500 opaque, sans forme d'erreur exploitable.
 */
export async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

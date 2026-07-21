/**
 * Les routes d'écriture admin — un seul échafaudage.
 *
 * `require-admin.ts` avait déjà supprimé les cinq copies du contrôle d'identité.
 * Mais chaque route réassemblait encore à la main les cinq étapes autour :
 * vérifier l'identité, lire le corps, valider, répondre une erreur, invalider le
 * cache. Le préambule d'autorisation seul était recopié **douze fois mot pour
 * mot** dans cinq fichiers, et les quatre autres étapes divergeaient.
 *
 * Ce que la divergence coûtait, mesuré :
 *
 *   `readJsonBody` existe précisément pour qu'un corps illisible devienne un 400
 *   propre plutôt qu'une promesse rejetée qui s'échappe en 500 opaque. Seule
 *   `/api/posts` l'appelait. Le même corps malformé envoyé à `/api/faq` ou à
 *   `/api/posts/versions` produisait donc un 500 sans forme exploitable, là où
 *   `/api/posts` répondait proprement.
 *
 *   Trois enveloppes d'erreur coexistaient — `{error}`, `{error, code, errors}`
 *   et `{ok: false, error}` — obligeant l'admin à brancher selon la route
 *   appelée. Deux écrans jetaient purement l'erreur du serveur et affichaient
 *   une chaîne écrite en dur à la place.
 *
 * Ici, la route ne décrit plus que son métier. L'identité est acquise avant
 * d'entrer, le corps est déjà lisible, et toute sortie — succès, refus, ou
 * exception non prévue — passe par la même forme.
 *
 * Ce qui reste volontairement dans chaque fichier : `export const runtime` et
 * la revalidation. Le premier est une exigence de Next (l'export doit être
 * statiquement visible dans le module de route). La seconde est du métier :
 * quelles surfaces publiques une écriture périme dépend de ce qu'elle écrit.
 *
 * Vérifié par `npm run check:admin-routes`.
 */

import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/require-admin"

/** La forme d'erreur, unique, de toutes les routes admin. */
export type CorpsErreur = {
  error: string
  code?: string
} & Record<string, unknown>

/**
 * Un refus formé, levé depuis un handler.
 *
 * On lève au lieu de renvoyer pour que le refus puisse partir du fond d'une
 * fonction d'aide sans que chaque appelant ait à se souvenir de propager la
 * réponse. C'est ce que l'ancien `assertAuthorSlug` faisait à la main, en
 * rendant `NextResponse | null` que l'appelant devait penser à tester.
 */
export class Refus extends Error {
  constructor(
    readonly statut: number,
    message: string,
    readonly code?: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "Refus"
  }
}

/** Interrompt le handler sur une erreur formée. Ne rend jamais la main. */
export function refus(
  statut: number,
  message: string,
  code?: string,
  details?: Record<string, unknown>
): never {
  throw new Refus(statut, message, code, details)
}

export const NON_AUTORISE: CorpsErreur = {
  error: "non autorisé",
  code: "NON_AUTORISE",
}

export type ContexteAdmin = {
  req: Request
  /** Authentifié ET présent dans l'allowlist `ADMIN_EMAILS`. */
  user: User
  params: URLSearchParams
  /**
   * Le corps JSON. Un corps illisible lève un refus 400 — il ne peut plus
   * s'échapper en 500 opaque, quelle que soit la route.
   */
  corps<T = unknown>(): Promise<T>
  /** Paramètre d'URL obligatoire ; absent, c'est un 400 formé. */
  requis(nom: string): string
}

/** Traduit un refus en réponse. Exporté pour que la garde le lise sans le recopier. */
export function reponseRefus(r: Refus): NextResponse {
  return NextResponse.json(
    { error: r.message, ...(r.code ? { code: r.code } : {}), ...(r.details ?? {}) },
    { status: r.statut }
  )
}

/**
 * Lit un corps JSON, ou refuse en 400.
 *
 * Séparé du reste pour être exerçable directement : le contrôle d'identité
 * passant avant la lecture du corps (et c'est le bon ordre), une garde ne peut
 * pas atteindre ce chemin à travers une route sans session.
 */
export async function lireCorps<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    return refus(400, "corps de requête illisible (JSON attendu)", "CORPS_ILLISIBLE")
  }
}

/**
 * Enveloppe une route d'écriture admin.
 *
 * Le handler reçoit une identité déjà vérifiée et rend la donnée à sérialiser
 * — ou une `Response` s'il a besoin d'en maîtriser la forme (un fichier, un
 * 201, un en-tête particulier).
 */
export function routeAdmin(
  handle: (ctx: ContexteAdmin) => Promise<unknown>
): (req: Request) => Promise<Response> {
  return async function routeEnveloppee(req: Request): Promise<Response> {
    const user = await requireAdmin()
    if (!user) return NextResponse.json(NON_AUTORISE, { status: 401 })

    const params = new URL(req.url).searchParams

    const ctx: ContexteAdmin = {
      req,
      user,
      params,
      corps: <T,>() => lireCorps<T>(req),
      requis(nom) {
        const v = params.get(nom)
        if (!v) return refus(400, `${nom} requis`, "PARAMETRE_MANQUANT")
        return v
      },
    }

    try {
      const resultat = await handle(ctx)
      if (resultat instanceof Response) return resultat
      return NextResponse.json(resultat ?? { ok: true })
    } catch (e) {
      if (e instanceof Refus) return reponseRefus(e)

      // Une exception non prévue vient de la base ou du stockage. On la trace
      // côté serveur — c'est là qu'elle est exploitable — et on répond une
      // forme utilisable. Le message est conservé : ces routes sont derrière
      // l'authentification ET l'allowlist, et c'est ce que l'avocat lit quand
      // sa sauvegarde échoue.
      const message = e instanceof Error ? e.message : "échec de l'enregistrement"
      console.error(`[admin] ${req.method} ${new URL(req.url).pathname} —`, e)
      return NextResponse.json(
        { error: message, code: "ERREUR_INTERNE" },
        { status: 500 }
      )
    }
  }
}

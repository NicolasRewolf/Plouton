import { NextResponse } from "next/server"
import { adminClient } from "@/lib/supabase/admin"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { todayIsoDate } from "@/lib/post-status"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * P1-I — Passe scheduled → published hors du rendu public.
 * Sécurisé par CRON_SECRET (Vercel Cron Authorization: Bearer …).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") || ""
  // Échouer FERMÉ. La garde s'écrivait `if (secret && auth !== …)` : sans
  // CRON_SECRET défini, la condition tombait et la route — qui publie en
  // masse — devenait appelable par n'importe qui. Un secret absent est une
  // erreur de configuration, pas une permission.
  if (!secret) {
    console.error("[cron] CRON_SECRET absente — route refusée")
    return NextResponse.json(
      { error: "cron non configuré (CRON_SECRET absente)" },
      { status: 503 }
    )
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 })
  }

  // Cette route construisait son propre `createClient` avec la clé secrète :
  // une septième copie, échappée au regroupement de `supabase/admin.ts`. Elle
  // aurait survécu à un changement de politique (rotation de clé, timeout,
  // en-tête) appliqué aux six autres. `adminClient()` rend `null` plutôt que de
  // lever, ce qui conserve ici le refus explicite quand l'environnement manque.
  const client = adminClient()
  if (!client) {
    return NextResponse.json({ error: "supabase manquant" }, { status: 500 })
  }

  const today = todayIsoDate()
  const { data, error } = await client
    .from("posts")
    .select("slug")
    .eq("status", "scheduled")
    .lte("published_at", today)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const slugs = (data || []).map((r) => r.slug as string)
  if (!slugs.length) {
    return NextResponse.json({ published: 0, slugs: [] })
  }

  const { error: upErr } = await client
    .from("posts")
    .update({ status: "published" })
    .in("slug", slugs)
    .eq("status", "scheduled")

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  for (const slug of slugs) revalidatePostSurfaces(slug)

  return NextResponse.json({ published: slugs.length, slugs })
}

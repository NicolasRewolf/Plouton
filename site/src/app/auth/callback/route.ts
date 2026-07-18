import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

/** Retour du lien magique : vérifie le token et pose la session (cookies). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = (url.searchParams.get("type") as EmailOtpType | null) ?? "email"
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") || "/admin/demandes"
  // Cible interne uniquement (pas de redirection ouverte).
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/admin/demandes"

  const supabase = await supabaseServer()
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(destination, url.origin))
    console.error("verifyOtp:", error.message)
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destination, url.origin))
    console.error("exchangeCodeForSession:", error.message)
  }
  return NextResponse.redirect(new URL("/admin/login?erreur=lien", url.origin))
}

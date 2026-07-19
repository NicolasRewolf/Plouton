import { NextResponse } from "next/server"
import { resolveAuthors } from "@/lib/authors-db"
import { listAuthors } from "@/lib/content"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

async function requireAdmin() {
  try {
    const supabase = await supabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return user
  } catch {
    return null
  }
}

/** Liste auteurs pour le select admin (P1-A). */
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })
  try {
    const authors = await resolveAuthors()
    return NextResponse.json(
      authors.map((a) => ({
        id: a.id,
        shortName: a.shortName,
        displayName: a.displayName,
      }))
    )
  } catch {
    return NextResponse.json(
      listAuthors().map((a) => ({
        id: a.id,
        shortName: a.shortName,
        displayName: a.displayName,
      }))
    )
  }
}

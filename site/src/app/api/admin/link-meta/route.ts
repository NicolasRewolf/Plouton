import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * Stub meta pour @editorjs/link — pas de scraping (hors scope).
 * Renvoie l’URL comme titre pour que le bloc lien soit enregistrable.
 */
export async function GET(req: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: 0 }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = (searchParams.get("url") || "").trim()
  if (!url || !/^https?:\/\//i.test(url))
    return NextResponse.json({ success: 0, message: "URL invalide" })

  return NextResponse.json({
    success: 1,
    meta: {
      title: url,
      description: "",
      image: { url: "" },
    },
  })
}

export async function POST(req: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: 0 }, { status: 401 })

  let url = ""
  try {
    const body = (await req.json()) as { url?: string }
    url = String(body.url || "").trim()
  } catch {
    return NextResponse.json({ success: 0, message: "corps invalide" })
  }
  if (!url || !/^https?:\/\//i.test(url))
    return NextResponse.json({ success: 0, message: "URL invalide" })

  return NextResponse.json({
    success: 1,
    meta: {
      title: url,
      description: "",
      image: { url: "" },
    },
  })
}

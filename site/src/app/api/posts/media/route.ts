import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/require-admin"

export const runtime = "nodejs"

const MAX_OCTETS = 5 * 1024 * 1024
const MIMES_OK = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])


function safeName(name: string): string {
  return (
    name
      .normalize("NFC")
      .replace(/[^\w.\-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(-80) || "cover.jpg"
  )
}

/**
 * Upload cover / image éditeur → bucket public `medias`.
 * Retourne l’URL publique. Auth admin obligatoire.
 */
export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    return NextResponse.json(
      {
        error:
          "Upload Storage indisponible — collez une URL d’image dans le champ couverture.",
        code: "NO_STORAGE",
      },
      { status: 503 }
    )
  }

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 })
  }

  const file = fd.get("file")
  if (!(file instanceof File) || !file.size)
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 })
  if (file.size > MAX_OCTETS)
    return NextResponse.json({ error: "Image trop lourde (5 Mo max)." }, { status: 400 })
  if (file.type && !MIMES_OK.has(file.type))
    return NextResponse.json(
      { error: "Format non accepté (JPEG, PNG, WebP, GIF)." },
      { status: 400 }
    )

  const folder = String(fd.get("folder") || "covers").replace(/[^\w\-]/g, "") || "covers"
  const objectPath = `${folder}/${Date.now()}-${safeName(file.name)}`

  const client = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await client.storage
    .from("medias")
    .upload(objectPath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    })
  if (error) {
    console.error("medias upload:", error)
    return NextResponse.json(
      { error: `Upload échoué : ${error.message}` },
      { status: 500 }
    )
  }

  const { data } = client.storage.from("medias").getPublicUrl(objectPath)
  return NextResponse.json({ ok: true, url: data.publicUrl, path: objectPath })
}

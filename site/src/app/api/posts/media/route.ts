import { refus, routeAdmin } from "@/lib/admin-route"
import { isAdminConfigured, requireAdminClient } from "@/lib/supabase/admin"

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
 *
 * Le corps est un `FormData`, pas du JSON : on lit `req.formData()` plutôt que
 * `corps()`.
 */
export const POST = routeAdmin(async ({ req }) => {
  if (!isAdminConfigured())
    refus(
      503,
      "Upload Storage indisponible — collez une URL d’image dans le champ couverture.",
      "NO_STORAGE"
    )

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    refus(400, "Formulaire invalide.", "CORPS_ILLISIBLE")
  }

  const file = fd.get("file")
  if (!(file instanceof File) || !file.size)
    refus(400, "Fichier manquant.", "CHAMP_MANQUANT")
  if (file.size > MAX_OCTETS)
    refus(400, "Image trop lourde (5 Mo max).", "FICHIER_TROP_LOURD")
  if (file.type && !MIMES_OK.has(file.type))
    refus(400, "Format non accepté (JPEG, PNG, WebP, GIF).", "FORMAT_REFUSE")

  const folder = String(fd.get("folder") || "covers").replace(/[^\w\-]/g, "") || "covers"
  const objectPath = `${folder}/${Date.now()}-${safeName(file.name)}`

  const client = requireAdminClient()
  const { error } = await client.storage
    .from("medias")
    .upload(objectPath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    })
  if (error) {
    console.error("medias upload:", error)
    refus(500, `Upload échoué : ${error.message}`, "UPLOAD_ECHOUE")
  }

  const { data } = client.storage.from("medias").getPublicUrl(objectPath)
  return { ok: true, url: data.publicUrl, path: objectPath }
})

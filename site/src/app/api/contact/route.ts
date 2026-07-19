import { NextResponse } from "next/server"
import { intakeDemande } from "@/lib/demande-intake"
import { notifyAccuseReception, notifyNouvelleDemande } from "@/lib/notify-demande"
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"

/** Limites pièces jointes — alignées sur l'UX du formulaire (5 × 10 Mo) et
 * sous le plafond du bucket `pieces-jointes` (25 Mo/objet). */
const FICHIERS_MAX = 5
const FICHIER_MAX_OCTETS = 10 * 1024 * 1024
const EXTENSIONS_OK = new Set(["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"])
const MIMES_OK = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

function fichierRefuse(f: File): string | null {
  if (f.size > FICHIER_MAX_OCTETS) return `« ${f.name} » dépasse 10 Mo.`
  const ext = (f.name.split(".").pop() || "").toLowerCase()
  if (!EXTENSIONS_OK.has(ext)) return `« ${f.name} » : format non accepté (PDF, images, Word).`
  if (f.type && !MIMES_OK.has(f.type)) return `« ${f.name} » : type non accepté.`
  return null
}

/** Honeypot rempli = bot — réponse OK silencieuse (pas d’insert). */
function isHoneypotFilled(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false
  const hp = (raw as Record<string, unknown>).website
  return typeof hp === "string" && hp.trim().length > 0
}

export async function POST(req: Request) {
  const ip = clientIpFromHeaders(req.headers)
  const limited = checkRateLimit(`contact:${ip}`)
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: limited.retryAfterSec
          ? { "Retry-After": String(limited.retryAfterSec) }
          : undefined,
      }
    )
  }

  const contentType = req.headers.get("content-type") || ""
  let raw: unknown
  let files: File[] = []

  if (contentType.includes("multipart/form-data")) {
    let fd: FormData
    try {
      fd = await req.formData()
    } catch {
      return NextResponse.json({ ok: false, error: "Formulaire invalide." }, { status: 400 })
    }
    const payload = fd.get("payload")
    if (typeof payload !== "string")
      return NextResponse.json({ ok: false, error: "Payload manquant." }, { status: 400 })
    try {
      raw = JSON.parse(payload)
    } catch {
      return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 })
    }
    files = fd.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0)
    if (files.length > FICHIERS_MAX)
      return NextResponse.json(
        { ok: false, error: `Trop de fichiers (${FICHIERS_MAX} maximum).` },
        { status: 400 }
      )
    for (const f of files) {
      const refus = fichierRefuse(f)
      if (refus) return NextResponse.json({ ok: false, error: refus }, { status: 400 })
    }
  } else {
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 })
    }
  }

  if (isHoneypotFilled(raw))
    return NextResponse.json({ ok: true, id: "ok" })

  const intake = intakeDemande(raw)
  if (!intake.ok)
    return NextResponse.json({ ok: false, error: intake.error }, { status: intake.status })

  let id: string
  try {
    ;({ id } = await getStore().createDemande(intake.data))
  } catch (e) {
    console.error("createDemande failed:", e)
    return NextResponse.json(
      { ok: false, error: "Enregistrement indisponible — appelez le cabinet." },
      { status: 503 }
    )
  }

  // Mails : best-effort — ne bloquent jamais la réponse OK.
  void notifyNouvelleDemande(id, intake.data).catch((e) =>
    console.error("notifyNouvelleDemande unhandled:", e)
  )
  void notifyAccuseReception(intake.data).catch((e) =>
    console.error("notifyAccuseReception unhandled:", e)
  )

  // La demande est enregistrée : un échec d'upload ne doit jamais la perdre.
  if (files.length) {
    try {
      const fichiers = await getStore().attachFichiers(id, files)
      return NextResponse.json({ ok: true, id, fichiers: fichiers.length })
    } catch (e) {
      console.error("attachFichiers failed:", e)
      return NextResponse.json({
        ok: true,
        id,
        fichiers: 0,
        warning:
          "Votre demande est bien enregistrée, mais les pièces jointes n'ont pas pu être transmises — envoyez-les par e-mail ou apportez-les au rendez-vous.",
      })
    }
  }

  return NextResponse.json({ ok: true, id })
}

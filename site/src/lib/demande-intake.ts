/**
 * Demande intake — validate + normalize before ContentStore.createDemande.
 */
import { isAllowedFormObjet } from "@/lib/registry"
import type { DemandeInput } from "@/lib/store"

export interface IntakeResult {
  ok: true
  data: DemandeInput
}

export interface IntakeError {
  ok: false
  error: string
  status: number
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function asUtm(v: unknown): Record<string, string> | undefined {
  if (!v || typeof v !== "object") return undefined
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string" && val.trim()) out[k] = val.trim().slice(0, 200)
  }
  return Object.keys(out).length ? out : undefined
}

function asCooked(v: unknown): { aid?: string; sid?: string } | undefined {
  if (!v || typeof v !== "object") return undefined
  const o = v as Record<string, unknown>
  const aid = asString(o.aid) || undefined
  const sid = asString(o.sid) || undefined
  if (!aid && !sid) return undefined
  return { aid, sid }
}

/** Validate raw JSON body from /api/contact. */
export function intakeDemande(raw: unknown): IntakeResult | IntakeError {
  if (!raw || typeof raw !== "object")
    return { ok: false, error: "Requête invalide.", status: 400 }

  const body = raw as Record<string, unknown>
  const prenom = asString(body.prenom)
  const nom = asString(body.nom)
  const email = asString(body.email)
  const telephone = asString(body.telephone)
  const message = asString(body.message)
  const objet = asString(body.objet) || "Autre / je ne sais pas encore"
  const page_source = asString(body.page_source) || "unknown"
  const entreprise = asString(body.entreprise) || undefined

  if (!prenom || !nom)
    return { ok: false, error: "Prénom et nom requis.", status: 400 }
  if (!email || !email.includes("@"))
    return { ok: false, error: "E-mail invalide.", status: 400 }
  if (!telephone)
    return { ok: false, error: "Téléphone requis.", status: 400 }
  if (!message || message.length < 10)
    return { ok: false, error: "Message trop court.", status: 400 }
  if (!isAllowedFormObjet(objet))
    return { ok: false, error: "Objet non reconnu.", status: 400 }

  return {
    ok: true,
    data: {
      prenom: prenom.slice(0, 80),
      nom: nom.slice(0, 80),
      entreprise: entreprise?.slice(0, 120),
      email: email.slice(0, 160),
      telephone: telephone.slice(0, 40),
      objet,
      message: message.slice(0, 8000),
      page_source: page_source.slice(0, 120),
      utm: asUtm(body.utm),
      cooked: asCooked(body.cooked),
    },
  }
}

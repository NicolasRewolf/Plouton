import { Resend } from "resend"
import type { DemandeInput } from "@/lib/store"

/**
 * Alerte e-mail après insert réussi d'une demande (C3).
 * Échec mail = log seulement — la demande reste enregistrée.
 *
 * Env :
 * - RESEND_API_KEY (obligatoire pour envoyer)
 * - RESEND_FROM — ex. `Cabinet Plouton <accueil@jplouton-avocat.fr>`
 *   une fois le domaine vérifié chez Resend ; sinon fallback onboarding@resend.dev
 * - NEXT_PUBLIC_SITE_ORIGIN — pour le lien admin
 */

const TO = "accueil@jplouton-avocat.fr"
const FROM_FALLBACK = "Cabinet Plouton <onboarding@resend.dev>"

function adminUrl(demandeId: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3000").replace(/\/$/, "")
  return `${origin}/admin/demandes/${demandeId}`
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function notifyNouvelleDemande(demandeId: string, data: DemandeInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("notifyNouvelleDemande: RESEND_API_KEY manquant — mail non envoyé.")
    return
  }

  const from = process.env.RESEND_FROM?.trim() || FROM_FALLBACK
  const nom =
    [data.prenom, data.nom].filter(Boolean).join(" ").trim() ||
    data.email ||
    "Sans nom"
  const objet = data.objet?.trim() || "Sans objet"
  const sujet = `[Plouton] Nouvelle demande — ${objet} — ${nom}`
  const lien = adminUrl(demandeId)

  const lignes = [
    `Nom : ${nom}`,
    data.email ? `E-mail : ${data.email}` : null,
    data.telephone ? `Tél. : ${data.telephone}` : null,
    data.entreprise ? `Entreprise : ${data.entreprise}` : null,
    `Objet : ${objet}`,
    data.page_source ? `Page : ${data.page_source}` : null,
    "",
    data.message?.trim() || "(pas de message)",
    "",
    `Ouvrir dans l'admin : ${lien}`,
  ].filter((l): l is string => l !== null)

  const html = `
    <p><strong>Nouvelle demande de contact</strong></p>
    <ul>
      <li><strong>Nom</strong> : ${esc(nom)}</li>
      ${data.email ? `<li><strong>E-mail</strong> : ${esc(data.email)}</li>` : ""}
      ${data.telephone ? `<li><strong>Tél.</strong> : ${esc(data.telephone)}</li>` : ""}
      ${data.entreprise ? `<li><strong>Entreprise</strong> : ${esc(data.entreprise)}</li>` : ""}
      <li><strong>Objet</strong> : ${esc(objet)}</li>
      ${data.page_source ? `<li><strong>Page</strong> : ${esc(data.page_source)}</li>` : ""}
    </ul>
    <p>${esc(data.message?.trim() || "(pas de message)").replace(/\n/g, "<br>")}</p>
    <p><a href="${esc(lien)}">Ouvrir dans l'admin</a></p>
  `.trim()

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [TO],
      subject: sujet,
      text: lignes.join("\n"),
      html,
    })
    if (error) console.error("notifyNouvelleDemande Resend:", error)
  } catch (e) {
    console.error("notifyNouvelleDemande failed:", e)
  }
}

/**
 * Accusé de réception au demandeur — best-effort, ne bloque jamais l’API.
 * Même clés Resend que l’alerte interne.
 */
export async function notifyAccuseReception(data: DemandeInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = data.email?.trim()
  if (!apiKey || !to || !to.includes("@")) return

  const from = process.env.RESEND_FROM?.trim() || FROM_FALLBACK
  const prenom = data.prenom?.trim() || ""
  const objet = data.objet?.trim() || "votre demande"
  const sujet = "Cabinet Plouton — nous avons bien reçu votre message"

  const text = [
    prenom ? `Bonjour ${prenom},` : "Bonjour,",
    "",
    `Nous avons bien reçu votre message concernant « ${objet} ».`,
    "L’équipe du Cabinet Plouton vous recontacte sous 24 à 48 heures ouvrées.",
    "",
    "En cas d’urgence, appelez le 05 56 44 35 96.",
    "",
    "— Cabinet Julien Plouton",
    "Place Sainte-Eulalie, Bordeaux",
  ].join("\n")

  const html = `
    <p>${prenom ? `Bonjour ${esc(prenom)},` : "Bonjour,"}</p>
    <p>Nous avons bien reçu votre message concernant <strong>${esc(objet)}</strong>.</p>
    <p>L’équipe du Cabinet Plouton vous recontacte sous 24 à 48&nbsp;heures ouvrées.</p>
    <p>En cas d’urgence, appelez le <a href="tel:+33556443596">05&nbsp;56&nbsp;44&nbsp;35&nbsp;96</a>.</p>
    <p>— Cabinet Julien Plouton<br>Place Sainte-Eulalie, Bordeaux</p>
  `.trim()

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: sujet,
      text,
      html,
    })
    if (error) console.error("notifyAccuseReception Resend:", error)
  } catch (e) {
    console.error("notifyAccuseReception failed:", e)
  }
}

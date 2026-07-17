"use client"

import { useState, type FormEvent } from "react"

interface ContactFormProps {
  defaultObjet?: string
  pageSource: string
}

const objets = [
  "Droit Pénal",
  "Droit pénal des affaires",
  "Accidents de la route",
  "Droit de la famille",
  "Nous rejoindre (candidature)",
  "Autre",
]

export function ContactForm({ defaultObjet = "Droit Pénal", pageSource }: ContactFormProps) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, page_source: pageSource }),
    })
    if (!res.ok) {
      setError("Envoi impossible — réessayez.")
      return
    }
    setSent(true)
  }

  if (sent)
    return (
      <p className="rounded border border-line bg-fog p-6 text-navy">
        Merci. Votre demande est enregistrée (POC local). En prod, elle arrivera chez{" "}
        <strong>accueil@jplouton-avocat.fr</strong> et dans le backoffice Demandes.
      </p>
    )

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Prénom *
          <input required name="first_name" className="border border-line bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Nom *
          <input required name="last_name" className="border border-line bg-white px-3 py-2" />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Nom de l&apos;entreprise (si concernée)
        <input name="company" className="border border-line bg-white px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Email *
          <input required type="email" name="email" className="border border-line bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Téléphone *
          <input required name="telephone" className="border border-line bg-white px-3 py-2" />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Objet de ma demande
        <select name="objet" defaultValue={defaultObjet} className="border border-line bg-white px-3 py-2">
          {objets.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Message *
        <textarea required name="message" rows={5} className="border border-line bg-white px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm">
        Pièce jointe (POC : nom de fichier seulement)
        <input type="file" name="fichier" className="border border-line bg-white px-3 py-2 text-sm" />
      </label>
      {error ? <p className="text-accent text-sm">{error}</p> : null}
      <button type="submit" className="bg-accent text-white px-5 py-3 font-medium hover:bg-accent-hover w-fit">
        Je prends rendez-vous
      </button>
    </form>
  )
}

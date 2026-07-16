"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

export default function NewPostPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get("title") || "")
    const slug =
      String(fd.get("slug") || "") ||
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    const body = String(fd.get("body") || "")
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        excerpt: fd.get("excerpt"),
        status: fd.get("status"),
        author: fd.get("author"),
        body,
      }),
    })
    if (!res.ok) {
      setError("Enregistrement impossible")
      return
    }
    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl mb-6">Nouvel article</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm">
          Titre *
          <input required name="title" className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Slug (URL)
          <input name="slug" placeholder="auto si vide" className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Extrait
          <textarea name="excerpt" rows={2} className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Auteur
          <input name="author" defaultValue="Cabinet Plouton" className="border border-line px-3 py-2 bg-white" />
        </label>
        <label className="grid gap-1 text-sm">
          Statut
          <select name="status" className="border border-line px-3 py-2 bg-white">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Corps (paragraphes séparés par une ligne vide ; ## pour un titre)
          <textarea required name="body" rows={12} className="border border-line px-3 py-2 bg-white font-mono text-sm" />
        </label>
        {error ? <p className="text-accent text-sm">{error}</p> : null}
        <div className="flex gap-3">
          <button type="submit" className="bg-accent text-white px-4 py-2 hover:bg-accent-hover">
            Enregistrer
          </button>
          <Link href="/admin" className="px-4 py-2 border border-line">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}

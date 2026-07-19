"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaqFormFields } from "@/components/admin/FaqFormFields"

interface FaqEditState {
  question: string
  answer: string
  expertiseSlug: string
  sousExpertise: string
  status: "draft" | "published"
}

export default function AdminFaqEditPage() {
  const params = useParams()
  const id = String(params.id || "")
  const router = useRouter()
  const [form, setForm] = useState<FaqEditState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/faq?id=${encodeURIComponent(id)}`)
        if (!res.ok) {
          if (!cancelled) setError("Question introuvable")
          return
        }
        const data = await res.json()
        if (cancelled) return
        setForm({
          question: data.question || "",
          answer: data.answer || "",
          expertiseSlug: data.expertiseSlug || "",
          sousExpertise: data.sousExpertise || "",
          status: data.status === "draft" ? "draft" : "published",
        })
      } catch {
        if (!cancelled) setError("Impossible de charger")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/faq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          question: form.question,
          answer: form.answer,
          expertiseSlug: form.expertiseSlug,
          sousExpertise: form.sousExpertise.trim() || null,
          status: form.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setMessage("Enregistré")
      router.refresh()
    } catch {
      setError("Réseau indisponible")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm("Supprimer définitivement cette question ?")) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/faq?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Suppression impossible")
        return
      }
      router.push("/admin/faq")
      router.refresh()
    } catch {
      setError("Réseau indisponible")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="text-[14px] text-muted">Chargement…</p>
      </main>
    )
  }

  if (!form) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p className="text-[14px] text-red-800">{error || "Introuvable"}</p>
        <Link href="/admin/faq" className="mt-4 inline-block text-[14px] text-navy underline">
          ← Retour FAQ
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
        <Link href="/admin/faq" className="hover:text-navy">
          FAQ
        </Link>{" "}
        · Édition
      </p>
      <h1 className="font-display mt-1 text-[28px] font-medium text-navy">
        Modifier la question
      </h1>

      <FaqFormFields
        question={form.question}
        setQuestion={(v) => setForm({ ...form, question: v })}
        answer={form.answer}
        setAnswer={(v) => setForm({ ...form, answer: v })}
        expertiseSlug={form.expertiseSlug}
        setExpertiseSlug={(v) => setForm({ ...form, expertiseSlug: v })}
        sousExpertise={form.sousExpertise}
        setSousExpertise={(v) => setForm({ ...form, sousExpertise: v })}
        status={form.status}
        setStatus={(v) => setForm({ ...form, status: v })}
      />

      {error ? (
        <p className="mt-4 rounded-[12px] bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-[12px] bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !form.question.trim() || !form.answer.trim()}
          className="admin-btn admin-btn-primary min-h-11 px-5 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin/faq" className="admin-btn inline-flex min-h-11 items-center px-4">
          Retour
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={saving}
          className="admin-btn min-h-11 px-4 text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Supprimer
        </button>
      </div>
    </main>
  )
}

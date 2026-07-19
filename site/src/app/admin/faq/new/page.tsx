"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FaqFormFields } from "@/components/admin/FaqFormFields"
import { FAQ_EXPERTISE_OPTIONS } from "@/lib/faq-expertises"

export default function AdminFaqNewPage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [expertiseSlug, setExpertiseSlug] = useState(FAQ_EXPERTISE_OPTIONS[0].slug)
  const [sousExpertise, setSousExpertise] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("published")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          expertiseSlug,
          sousExpertise: sousExpertise.trim() || null,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      router.push(`/admin/faq/${data.id}`)
      router.refresh()
    } catch {
      setError("Réseau indisponible")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
        <Link href="/admin/faq" className="hover:text-navy">
          FAQ
        </Link>{" "}
        · Nouvelle
      </p>
      <h1 className="font-display mt-1 text-[28px] font-medium text-navy">
        Nouvelle question
      </h1>

      <FaqFormFields
        question={question}
        setQuestion={setQuestion}
        answer={answer}
        setAnswer={setAnswer}
        expertiseSlug={expertiseSlug}
        setExpertiseSlug={setExpertiseSlug}
        sousExpertise={sousExpertise}
        setSousExpertise={setSousExpertise}
        status={status}
        setStatus={setStatus}
      />

      {error ? (
        <p className="mt-4 rounded-[12px] bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !question.trim() || !answer.trim()}
          className="admin-btn admin-btn-primary min-h-11 px-5 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin/faq" className="admin-btn inline-flex min-h-11 items-center px-4">
          Annuler
        </Link>
      </div>
    </main>
  )
}

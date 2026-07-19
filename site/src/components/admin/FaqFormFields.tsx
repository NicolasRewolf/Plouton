"use client"

import { FAQ_EXPERTISE_OPTIONS } from "@/lib/faq-expertises"

export function FaqFormFields({
  question,
  setQuestion,
  answer,
  setAnswer,
  expertiseSlug,
  setExpertiseSlug,
  sousExpertise,
  setSousExpertise,
  status,
  setStatus,
}: {
  question: string
  setQuestion: (v: string) => void
  answer: string
  setAnswer: (v: string) => void
  expertiseSlug: string
  setExpertiseSlug: (v: string) => void
  sousExpertise: string
  setSousExpertise: (v: string) => void
  status: "draft" | "published"
  setStatus: (v: "draft" | "published") => void
}) {
  return (
    <div className="mt-8 space-y-4 rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
      <label className="grid gap-1.5 text-[12px] font-medium text-navy">
        Question
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="admin-input min-h-11 text-[15px]"
          placeholder="Ex. Que faire en garde à vue ?"
        />
      </label>
      <label className="grid gap-1.5 text-[12px] font-medium text-navy">
        Réponse
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={10}
          className="admin-input text-[14px] leading-relaxed"
          placeholder="Texte clair, accessible…"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[12px] font-medium text-navy">
          Expertise
          <select
            value={expertiseSlug}
            onChange={(e) => setExpertiseSlug(e.target.value)}
            className="admin-input min-h-11 text-[14px]"
          >
            {FAQ_EXPERTISE_OPTIONS.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-[12px] font-medium text-navy">
          Sous-sujet (filtre page)
          <input
            value={sousExpertise}
            onChange={(e) => setSousExpertise(e.target.value)}
            className="admin-input min-h-11 text-[14px]"
            placeholder="Ex. Garde à vue"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-[12px] font-medium text-navy">
        Statut
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="admin-input min-h-11 max-w-xs text-[14px]"
        >
          <option value="published">Publié (visible sur le site)</option>
          <option value="draft">Brouillon</option>
        </select>
      </label>
    </div>
  )
}

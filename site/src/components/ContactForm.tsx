"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react"
import { formObjets } from "@/lib/registry"

interface ContactFormProps {
  defaultObjet?: string
  pageSource: string
  /** Titre affiché au-dessus du formulaire */
  heading?: string
  /** Sous-titre / promesse */
  lead?: string
}

const OBJETS = formObjets()

const MODES = [
  {
    id: "cabinet",
    label: "Au cabinet",
    hint: "Bordeaux · Place Sainte-Eulalie",
    icon: "pin" as const,
  },
  {
    id: "visio",
    label: "En visioconférence",
    hint: "France entière · Zoom / Teams",
    icon: "video" as const,
  },
  {
    id: "telephone",
    label: "Par téléphone",
    hint: "Échange rapide · 30 min",
    icon: "phone" as const,
  },
] as const

const STEPS = [
  { n: "1", label: "Vous écrivez" },
  { n: "2", label: "On vous rappelle" },
  { n: "3", label: "RDV sous 7 jours" },
]

const EASE = "cubic-bezier(0.2, 0, 0, 1)"
const MAX_FILES = 5
const MAX_SIZE_MB = 10

const inputClass =
  "min-h-12 w-full rounded-[12px] border-0 bg-white px-4 text-base text-navy shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.14)] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted/65 focus:shadow-[inset_0_0_0_2px_var(--color-navy)] sm:text-[15px]"

/** Formulaire de prise de rendez-vous — expérience claire, rassurante, complète. */
export function ContactForm({
  defaultObjet = "Droit Pénal",
  pageSource,
  heading = "Je prends rendez-vous",
  lead = "Exposez votre situation en toute confidentialité. Votre demande est traitée rapidement — un rendez-vous est fixé sous 7 jours, immédiat en urgence.",
}: ContactFormProps) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("cabinet")
  const [urgence, setUrgence] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [utm, setUtm] = useState<Record<string, string>>({})
  const [cooked, setCooked] = useState<{ aid?: string; sid?: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const nextUtm: Record<string, string> = {}
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
    ]) {
      const v = params.get(key)
      if (v) nextUtm[key] = v
    }
    setUtm(nextUtm)
    setCooked({
      aid: params.get("cooked_aid") || undefined,
      sid: params.get("cooked_sid") || undefined,
    })
  }, [])

  const fileLabel = useMemo(() => {
    if (!files.length) return null
    return files.map((f) => f.name).join(", ")
  }, [files])

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const next: File[] = [...files]
    for (const file of incoming) {
      if (next.length >= MAX_FILES) break
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`« ${file.name} » dépasse ${MAX_SIZE_MB} Mo.`)
        continue
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue
      next.push(file)
    }
    setFiles(next)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const prenom = String(fd.get("prenom") || "").trim()
    const nom = String(fd.get("nom") || "").trim()
    const messageRaw = String(fd.get("message") || "").trim()
    const modeLabel = MODES.find((m) => m.id === mode)?.label || mode
    const prefix = [
      urgence ? "⚠ Urgence signalée" : null,
      `Mode souhaité : ${modeLabel}`,
      fileLabel ? `Fichiers annoncés : ${fileLabel}` : null,
    ]
      .filter(Boolean)
      .join(" · ")

    const payload = {
      prenom,
      nom,
      entreprise: String(fd.get("entreprise") || "").trim() || undefined,
      email: String(fd.get("email") || "").trim(),
      telephone: String(fd.get("telephone") || "").trim(),
      objet: String(fd.get("objet") || defaultObjet),
      message: prefix ? `${prefix}\n\n${messageRaw}` : messageRaw,
      page_source: pageSource,
      utm: { ...utm, mode_rdv: mode, urgence: urgence ? "1" : "0" },
      cooked,
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setError("Envoi impossible pour le moment — appelez-nous au 05 56 44 35 96.")
        setIsSubmitting(false)
        return
      }
      setSent(true)
    } catch {
      setError("Connexion interrompue — réessayez, ou appelez le cabinet.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.05),0_18px_44px_rgba(23,71,94,0.1)]">
        <div className="bg-navy px-7 py-6 sm:px-9">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white">
            <CheckIcon />
          </div>
          <h3 className="mt-4 font-display text-[22px] font-medium leading-[1.15] tracking-[-0.02em] text-white text-balance">
            Demande bien reçue
          </h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-pretty text-white/75">
            Merci. L’équipe vous recontacte sous 24–48&nbsp;h ouvrées
            {urgence ? " — votre urgence a été signalée" : ""}.
          </p>
        </div>
        <div className="space-y-4 px-7 py-6 sm:px-9">
          <p className="text-[14px] leading-relaxed text-navy">
            En cas d’urgence immédiate, appelez le{" "}
            <a
              href="tel:+33556443596"
              className="font-semibold text-accent hover:underline decoration-from-font"
            >
              05&nbsp;56&nbsp;44&nbsp;35&nbsp;96
            </a>
            .
          </p>
          <ol className="grid gap-2 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="rounded-[14px] bg-fog/80 px-3 py-3 text-center text-[12px] font-medium text-navy"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                  Étape {s.n}
                </span>
                <span className="mt-1 block">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.05),0_18px_44px_rgba(23,71,94,0.1)]"
      noValidate
    >
      {/* Bandeau de confiance */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-gradient-to-br from-[#f7fafb] to-white px-6 py-4 sm:px-8">
        <a
          href="https://www.google.com/maps?cid=13977668972170869158"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-navy transition-[opacity] duration-200 hover:opacity-80"
        >
          <StarsRow />
          <span>
            4,6/5 · <span className="text-muted">193 avis Google</span>
          </span>
        </a>
        <p className="rounded-full bg-navy/5 px-3 py-1.5 text-[12px] font-medium text-navy">
          1<sup>er</sup> RDV · 30&nbsp;min · <span className="text-accent">180&nbsp;€&nbsp;TTC</span>
        </p>
      </div>

      <div className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Cabinet Plouton · Bordeaux
          </p>
          <h2 className="mt-2 font-display text-[26px] font-medium leading-[1.12] tracking-[-0.025em] text-navy text-balance sm:text-[28px]">
            {heading}
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-pretty text-muted sm:text-[15px]">
            {lead}
          </p>

          <ol className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-2">
            {STEPS.map((s, i) => (
              <li key={s.n} className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
                  {s.n}
                </span>
                <span className="text-[12px] font-medium text-navy sm:text-[13px]">{s.label}</span>
                {i < STEPS.length - 1 ? (
                  <span className="mx-1.5 hidden h-px w-5 bg-line sm:block" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        </header>

        <fieldset className="mt-8 space-y-4">
          <legend className="sr-only">Vos coordonnées</legend>
          <SectionLabel>Vos coordonnées</SectionLabel>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Prénom" name="prenom" required autoComplete="given-name" />
            <Field label="Nom" name="nom" required autoComplete="family-name" />
          </div>
          <Field
            label="Nom de l'entreprise"
            name="entreprise"
            optional
            hint="Si la demande concerne une société"
            autoComplete="organization"
            placeholder="Facultatif"
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" required autoComplete="email" />
            <Field
              label="Téléphone"
              name="telephone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              prefix="+33"
            />
          </div>
        </fieldset>

        <fieldset className="mt-8 space-y-3.5">
          <legend className="sr-only">Modalité de rendez-vous</legend>
          <SectionLabel>Comment préférez-vous échanger&nbsp;?</SectionLabel>
          <div className="grid gap-2.5">
            {MODES.map((m) => {
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex min-h-14 items-center gap-3.5 rounded-[16px] bg-navy px-4 py-3.5 text-left text-white shadow-[0_1px_2px_rgba(23,71,94,0.22)] transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.96]"
                      : "flex min-h-14 items-center gap-3.5 rounded-[16px] bg-fog/70 px-4 py-3.5 text-left text-navy shadow-[inset_0_0_0_1px_rgba(23,71,94,0.06)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-fog active:scale-[0.96]"
                  }
                  style={{ transitionTimingFunction: EASE }}
                >
                  <span
                    className={
                      active
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/12 text-white"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-navy shadow-[0_1px_3px_rgba(23,71,94,0.08)]"
                    }
                  >
                    <ModeIcon name={m.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold sm:text-[15px]">{m.label}</span>
                    <span className={`mt-0.5 block text-[12px] ${active ? "text-white/65" : "text-muted"}`}>
                      {m.hint}
                    </span>
                  </span>
                  <span
                    className={
                      active
                        ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white"
                        : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.2)]"
                    }
                    aria-hidden
                  >
                    {active ? <CheckTiny /> : null}
                  </span>
                </button>
              )
            })}
          </div>

          <label
            className={
              urgence
                ? "flex min-h-12 cursor-pointer items-start gap-3 rounded-[14px] bg-accent/[0.08] px-3.5 py-3.5 shadow-[inset_0_0_0_1.5px_rgba(254,75,66,0.35)] transition-[background-color,box-shadow] duration-200"
                : "flex min-h-12 cursor-pointer items-start gap-3 rounded-[14px] bg-fog/50 px-3.5 py-3.5 transition-[background-color,box-shadow] duration-200 hover:bg-fog"
            }
          >
            <input
              type="checkbox"
              checked={urgence}
              onChange={(e) => setUrgence(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
            />
            <span>
              <span className="block text-[14px] font-semibold text-navy">C’est urgent</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                Garde à vue, audience proche, délai critique — nous priorisons votre rappel.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="mt-8 space-y-3.5">
          <legend className="sr-only">Votre demande</legend>
          <SectionLabel>Votre situation</SectionLabel>
          <label className="grid gap-1.5">
            <span className="text-[13px] font-medium text-navy">
              Objet de ma demande{" "}
              <span className="font-normal text-muted">— ignorez si vous n’êtes pas sûr</span>
            </span>
            <select
              name="objet"
              defaultValue={defaultObjet}
              className={`${inputClass} appearance-none pr-10`}
              style={{
                transitionTimingFunction: EASE,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none'%3E%3Cpath d='M2.5 4.25 6 7.75l3.5-3.5' stroke='%2317475e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
              }}
            >
              {OBJETS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[13px] font-medium text-navy">
              Message <span className="text-accent">*</span>
            </span>
            <textarea
              required
              name="message"
              rows={5}
              placeholder="Décrivez brièvement les faits, les délais éventuels, et ce que vous attendez du cabinet…"
              className="w-full resize-y rounded-[12px] border-0 bg-white px-4 py-3.5 text-base leading-relaxed text-navy shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.14)] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted/65 focus:shadow-[inset_0_0_0_2px_var(--color-navy)] sm:text-[15px]"
              style={{ transitionTimingFunction: EASE }}
            />
          </label>
        </fieldset>

        <fieldset className="mt-8 space-y-3">
          <legend className="sr-only">Pièces jointes</legend>
          <div className="flex items-end justify-between gap-3">
            <SectionLabel>Pièces jointes</SectionLabel>
            <span className="text-[12px] text-muted">Optionnel</span>
          </div>
          <p className="text-[13px] leading-snug text-muted">
            Convocation, PV, échanges assureur, pièces médicales… PDF ou images, {MAX_SIZE_MB}&nbsp;Mo
            max.
          </p>
          <div
            onDragEnter={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={
              isDragging
                ? "rounded-[18px] bg-accent/[0.04] p-1 shadow-[inset_0_0_0_2px_var(--color-accent)]"
                : "rounded-[18px] bg-fog/40 p-1 shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.1)]"
            }
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-[14px] px-4 py-6 text-center transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.99]"
              style={{ transitionTimingFunction: EASE }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-accent shadow-[0_1px_3px_rgba(23,71,94,0.1)]">
                <PaperclipIcon />
              </span>
              <span className="text-[14px] font-semibold text-navy">
                Je joins des fichiers à mon dossier
              </span>
              <span className="text-[12px] text-muted">Glisser-déposer ou cliquer · jusqu’à {MAX_FILES} fichiers</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              name="fichier"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files)
                e.target.value = ""
              }}
            />
          </div>
          {files.length ? (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li
                  key={`${f.name}-${f.size}`}
                  className="flex items-center justify-between gap-3 rounded-[12px] bg-fog/70 px-3 py-2.5 text-[13px] text-navy"
                >
                  <span className="min-w-0 truncate font-medium">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Retirer ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                    className="shrink-0 rounded-full px-2.5 py-1 text-muted transition-colors hover:text-accent"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </fieldset>

        <label className="mt-7 flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 h-4 w-4 accent-[var(--color-navy)]"
          />
          <span className="text-[13px] leading-snug text-muted">
            J’accepte que le Cabinet Plouton traite mes données pour me recontacter au sujet de ma
            demande.{" "}
            <a
              href="/mentions-legales"
              className="text-navy underline-offset-2 hover:underline decoration-from-font"
            >
              Mentions légales
            </a>
            . <span className="text-accent">*</span>
          </span>
        </label>

        {error ? (
          <p
            className="mt-4 rounded-[12px] bg-accent/10 px-3.5 py-3 text-[13px] text-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-7 rounded-[18px] bg-fog/60 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(254,75,66,0.25),0_10px_24px_rgba(254,75,66,0.22)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-accent-hover hover:shadow-[0_4px_18px_rgba(254,75,66,0.3)] active:scale-[0.96] disabled:opacity-60 sm:w-auto"
              style={{ transitionTimingFunction: EASE }}
            >
              {isSubmitting ? "Envoi en cours…" : "Je prends rendez-vous"}
              {!isSubmitting ? <ArrowIcon /> : null}
            </button>
            <div className="text-center sm:text-right">
              <p className="text-[12px] text-muted">Besoin d’échanger tout de suite&nbsp;?</p>
              <a
                href="tel:+33556443596"
                className="mt-0.5 inline-block text-[14px] font-semibold text-navy underline-offset-2 hover:underline decoration-from-font"
              >
                05&nbsp;56&nbsp;44&nbsp;35&nbsp;96
              </a>
            </div>
          </div>
          <p className="mt-3 text-center text-[12px] leading-snug text-muted sm:text-left">
            Secret professionnel · Réponse sous 24–48&nbsp;h · Urgences prioritaires
          </p>
        </div>
      </div>
    </form>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/50">{children}</p>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
  optional,
  hint,
  placeholder,
  autoComplete,
  prefix,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  optional?: boolean
  hint?: string
  placeholder?: string
  autoComplete?: string
  prefix?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-medium text-navy">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {optional ? <span className="font-normal text-muted"> (optionnel)</span> : null}
      </span>
      {prefix ? (
        <span className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-muted">
            {prefix}
          </span>
          <input
            name={name}
            type={type}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className={`${inputClass} pl-14`}
            style={{ transitionTimingFunction: EASE }}
          />
        </span>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={inputClass}
          style={{ transitionTimingFunction: EASE }}
        />
      )}
      {hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
    </label>
  )
}

function StarsRow() {
  return (
    <span className="inline-flex gap-0.5 text-[#f5b400]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 0.8l1.45 3.2 3.5.35-2.65 2.35.8 3.4L6 8.4 2.9 10.1l.8-3.4L1.05 4.35l3.5-.35L6 .8z" />
        </svg>
      ))}
    </span>
  )
}

function ModeIcon({ name }: { name: "pin" | "video" | "phone" }) {
  if (name === "pin")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  if (name === "video")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6.5" width="12.5" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M15.5 10.5l5-2.5v8l-5-2.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.5 4.5h3l1.2 4-2 1.2a12 12 0 005.6 5.6l1.2-2 4 1.2v3a2 2 0 01-2.2 2A15.5 15.5 0 015.5 6.7a2 2 0 012-2.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l5 5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckTiny() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2l2.4 2.4 4.6-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 12.5l6.2-6.2a3.2 3.2 0 114.5 4.5l-7.8 7.8a4.5 4.5 0 11-6.4-6.4l7.1-7.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden className="ml-px">
      <path
        d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

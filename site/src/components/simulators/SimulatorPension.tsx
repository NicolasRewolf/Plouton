"use client"

import { useState, type FormEvent } from "react"
import { SiteCta } from "@/components/SiteCta"
import {
  CUSTODY_LABELS,
  estimatePensionAlimentaire,
  formatEuro,
  MINIMUM_VITAL_EUR,
  type CustodyMode,
} from "@/lib/simulators/pension-alimentaire"

const inputClass =
  "min-h-12 w-full rounded-[12px] border-0 bg-white px-4 text-base text-navy shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.14)] outline-none transition-[box-shadow] duration-200 placeholder:text-muted/65 focus:shadow-[inset_0_0_0_2px_var(--color-navy)] sm:text-[15px]"

const labelClass = "mb-1.5 block text-[13px] font-medium text-navy"

/**
 * Simulateur pension alimentaire — barème Ministère de la Justice (indicatif).
 * Monté seulement sur la page divorce (lazy via ExpertiseBody).
 */
export function SimulatorPension() {
  const [revenu, setRevenu] = useState("")
  const [enfants, setEnfants] = useState("1")
  const [garde, setGarde] = useState<CustodyMode>("classique")
  const [result, setResult] = useState<ReturnType<
    typeof estimatePensionAlimentaire
  > | null>(null)

  function onCalculate(e: FormEvent) {
    e.preventDefault()
    setResult(
      estimatePensionAlimentaire({
        revenuNetMensuel: Number(revenu.replace(",", ".")),
        enfants: Number(enfants),
        garde,
      })
    )
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.05),0_18px_44px_rgba(23,71,94,0.1)]">
      <div className="border-b border-line/60 bg-fog/40 px-5 py-4 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Barème officiel (indicatif)
        </p>
        <p className="mt-1 text-[14px] text-navy/80">
          Table de référence du Ministère de la Justice — estimation sans valeur
          juridique.
        </p>
      </div>

      <form onSubmit={onCalculate} className="grid gap-5 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-2">
        <div>
          <label htmlFor="pension-revenu" className={labelClass}>
            Revenu mensuel net du débiteur (€)
          </label>
          <input
            id="pension-revenu"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            required
            placeholder="Ex. 2 000"
            value={revenu}
            onChange={(e) => setRevenu(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pension-enfants" className={labelClass}>
            Nombre d&apos;enfants
          </label>
          <select
            id="pension-enfants"
            value={enfants}
            onChange={(e) => setEnfants(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} enfant{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="pension-garde" className={labelClass}>
            Type de garde
          </label>
          <select
            id="pension-garde"
            value={garde}
            onChange={(e) => setGarde(e.target.value as CustodyMode)}
            className={`${inputClass} appearance-none`}
          >
            {(Object.keys(CUSTODY_LABELS) as CustodyMode[]).map((key) => (
              <option key={key} value={key}>
                {CUSTODY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <button type="submit" className="btn-pill btn-pill-primary">
            Calculer mon estimation
            <span className="btn-pill-icon" aria-hidden>
              →
            </span>
          </button>
        </div>
      </form>

      {result ? (
        <div className="border-t border-line/60 bg-fog/30 px-5 py-6 sm:px-7">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
            Estimation
          </p>
          <p className="mt-2 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-medium tabular-nums tracking-[-0.02em] text-accent">
            {formatEuro(result.montantMensuel)}
          </p>
          <p className="mt-1 text-[14px] text-navy/75">pension mensuelle indicative</p>
          <p className="mt-3 text-[13px] leading-relaxed text-navy/65">
            Revenu disponible après minimum vital ({formatEuro(MINIMUM_VITAL_EUR)}) :{" "}
            {formatEuro(result.revenuDisponible)} · taux appliqué : {result.tauxLabel}
          </p>
        </div>
      ) : null}

      <div className="border-t border-line/60 px-5 py-5 sm:px-7">
        <p className="text-[13px] leading-relaxed text-navy/70">
          Estimation indicative, sans valeur juridique. Elle ne remplace pas le
          conseil d&apos;un avocat ni la décision d&apos;un juge.{" "}
          <a
            href="https://www.justice.fr/simulateurs/pension-alimentaire/bareme"
            target="_blank"
            rel="noopener noreferrer"
            className="link-inline font-medium"
          >
            Voir le barème officiel
          </a>
          .
        </p>
        <div className="mt-4">
          <SiteCta href="#contact" variant="primary" arrow>
            Parler à un avocat
          </SiteCta>
        </div>
      </div>
    </div>
  )
}

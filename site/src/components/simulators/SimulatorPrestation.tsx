"use client"

import { useState, type FormEvent } from "react"
import { SiteCta } from "@/components/SiteCta"
import {
  estimatePrestationCompensatoire,
  formatEuroCapital,
  HEALTH_LABELS,
  type HealthImpact,
} from "@/lib/simulators/prestation-compensatoire"

const inputClass =
  "min-h-12 w-full rounded-[12px] border-0 bg-white px-4 text-base text-navy shadow-[inset_0_0_0_1.5px_rgba(23,71,94,0.14)] outline-none transition-[box-shadow] duration-200 placeholder:text-muted/65 focus:shadow-[inset_0_0_0_2px_var(--color-navy)] sm:text-[15px]"

const labelClass = "mb-1.5 block text-[13px] font-medium text-navy"

const HEALTH_OPTIONS = Object.keys(HEALTH_LABELS) as HealthImpact[]

/**
 * Simulateur prestation compensatoire — méthodes doctrinales indicatives.
 * Champs alignés sur le live Wix divorce. Sans valeur juridique.
 */
export function SimulatorPrestation() {
  const [ageVous, setAgeVous] = useState("")
  const [ageConjoint, setAgeConjoint] = useState("")
  const [enfants, setEnfants] = useState("0")
  const [santeVous, setSanteVous] = useState<HealthImpact>("aucun")
  const [santeConjoint, setSanteConjoint] = useState<HealthImpact>("aucun")
  const [revenusVous, setRevenusVous] = useState("")
  const [revenusConjoint, setRevenusConjoint] = useState("")
  const [annees, setAnnees] = useState("")
  const [result, setResult] = useState<ReturnType<
    typeof estimatePrestationCompensatoire
  > | null>(null)

  function onCalculate(e: FormEvent) {
    e.preventDefault()
    setResult(
      estimatePrestationCompensatoire({
        ageVous: Number(ageVous),
        ageConjoint: Number(ageConjoint),
        enfants: Number(enfants),
        santeVous,
        santeConjoint,
        revenusVous: Number(revenusVous.replace(",", ".")),
        revenusConjoint: Number(revenusConjoint.replace(",", ".")),
        anneesMariage: Number(annees.replace(",", ".")),
      })
    )
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.05),0_18px_44px_rgba(23,71,94,0.1)]">
      <div className="border-b border-line/60 bg-fog/40 px-5 py-4 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Simulation indicative
        </p>
        <p className="mt-1 text-[14px] text-navy/80">
          Fourchette basée sur les méthodes courantes des praticiens — pas de
          barème légal.
        </p>
      </div>

      <form
        onSubmit={onCalculate}
        className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7 sm:py-7"
      >
        <div>
          <label htmlFor="pc-age-vous" className={labelClass}>
            Votre âge
          </label>
          <input
            id="pc-age-vous"
            type="number"
            min={18}
            max={100}
            required
            value={ageVous}
            onChange={(e) => setAgeVous(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pc-age-conjoint" className={labelClass}>
            Âge de votre conjoint(e)
          </label>
          <input
            id="pc-age-conjoint"
            type="number"
            min={18}
            max={100}
            required
            value={ageConjoint}
            onChange={(e) => setAgeConjoint(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pc-revenus-vous" className={labelClass}>
            Vos revenus mensuels (nets)
          </label>
          <input
            id="pc-revenus-vous"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            required
            placeholder="Ex. 2 200"
            value={revenusVous}
            onChange={(e) => setRevenusVous(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pc-revenus-conjoint" className={labelClass}>
            Revenus mensuels conjoint(e) (nets)
          </label>
          <input
            id="pc-revenus-conjoint"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            required
            placeholder="Ex. 3 500"
            value={revenusConjoint}
            onChange={(e) => setRevenusConjoint(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pc-enfants" className={labelClass}>
            Nombre d&apos;enfants communs
          </label>
          <select
            id="pc-enfants"
            value={enfants}
            onChange={(e) => setEnfants(e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pc-annees" className={labelClass}>
            Nombre d&apos;années de mariage
          </label>
          <input
            id="pc-annees"
            type="number"
            min={0}
            max={80}
            step={0.5}
            required
            value={annees}
            onChange={(e) => setAnnees(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pc-sante-vous" className={labelClass}>
            Votre état de santé impacte-t-il votre capacité à travailler
            aujourd&apos;hui ?
          </label>
          <select
            id="pc-sante-vous"
            value={santeVous}
            onChange={(e) => setSanteVous(e.target.value as HealthImpact)}
            className={`${inputClass} appearance-none`}
          >
            {HEALTH_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {HEALTH_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pc-sante-conjoint" className={labelClass}>
            L&apos;état de santé de votre conjoint(e) impacte-t-il sa capacité à
            travailler aujourd&apos;hui ?
          </label>
          <select
            id="pc-sante-conjoint"
            value={santeConjoint}
            onChange={(e) => setSanteConjoint(e.target.value as HealthImpact)}
            className={`${inputClass} appearance-none`}
          >
            {HEALTH_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {HEALTH_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
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
          {result.montant === 0 ? (
            <p className="mt-2 text-[15px] leading-relaxed text-navy/85">
              Selon ces éléments, aucune prestation compensatoire n&apos;est
              suggérée (pas de déséquilibre de revenus, ou durée nulle).
            </p>
          ) : (
            <>
              <p className="mt-2 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-medium tabular-nums tracking-[-0.02em] text-accent">
                {formatEuroCapital(result.montant)}
              </p>
              <p className="mt-1 text-[14px] text-navy/75">
                capital indicatif
                {result.vousCreancier
                  ? " (vous seriez créancier potentiel)"
                  : " (votre conjoint serait créancier potentiel)"}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-navy/65">
                Fourchette : {formatEuroCapital(result.fourchetteBasse)} –{" "}
                {formatEuroCapital(result.fourchetteHaute)}
              </p>
            </>
          )}
        </div>
      ) : null}

      <div className="border-t border-line/60 px-5 py-5 sm:px-7">
        <p className="text-[13px] leading-relaxed text-navy/70">
          Estimation indicative, sans valeur juridique. Elle ne remplace pas le
          conseil d&apos;un avocat ni la décision d&apos;un juge. Le juge fixe
          librement le montant selon l&apos;article 271 du Code civil.
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

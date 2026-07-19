/**
 * Estimation indicative — table de référence Ministère de la Justice
 * (justice.fr/simulateurs/pension-alimentaire/bareme, mise à jour 02/04/2024).
 *
 * Formule Wix introuvable dans les sources exportées : on reproduit le barème
 * officiel (pas une copie de JS Wix). Sans valeur juridique.
 *
 * Montant = max(0, revenuNet − minimumVital) × taux(enfants, garde)
 * Le taux est un % du revenu disponible pour le total des enfants (pas « par enfant »).
 */

export type CustodyMode = "reduit" | "classique" | "alterne"

/** Minimum vital retenu sur la table justice.fr (col. « MINIMUM VITAL »). */
export const MINIMUM_VITAL_EUR = 652

/**
 * Taux officiels (proportion du revenu disponible).
 * Index = nombre d’enfants (1…6). Au-delà de 6 → taux du 6ᵉ.
 */
const RATES: Record<CustodyMode, number[]> = {
  reduit: [0.18, 0.155, 0.133, 0.117, 0.106, 0.095],
  classique: [0.135, 0.115, 0.1, 0.088, 0.08, 0.072],
  alterne: [0.09, 0.078, 0.067, 0.059, 0.053, 0.048],
}

export const CUSTODY_LABELS: Record<CustodyMode, string> = {
  reduit: "Droit de visite et d'hébergement réduit",
  classique: "Droit de visite et d'hébergement classique",
  alterne: "Résidence alternée",
}

export interface PensionInput {
  revenuNetMensuel: number
  enfants: number
  garde: CustodyMode
}

export interface PensionResult {
  montantMensuel: number
  revenuDisponible: number
  taux: number
  tauxLabel: string
}

export function rateFor(enfants: number, garde: CustodyMode): number {
  const n = Math.max(1, Math.min(6, Math.floor(enfants)))
  return RATES[garde][n - 1]
}

export function estimatePensionAlimentaire({
  revenuNetMensuel,
  enfants,
  garde,
}: PensionInput): PensionResult {
  const revenu = Math.max(0, Number(revenuNetMensuel) || 0)
  const kids = Math.max(0, Math.floor(Number(enfants) || 0))
  const disponible = Math.max(0, revenu - MINIMUM_VITAL_EUR)

  if (kids < 1 || disponible <= 0) {
    return {
      montantMensuel: 0,
      revenuDisponible: disponible,
      taux: 0,
      tauxLabel: "0 %",
    }
  }

  const taux = rateFor(kids, garde)
  const montant = Math.round(disponible * taux * 100) / 100

  return {
    montantMensuel: montant,
    revenuDisponible: disponible,
    taux,
    tauxLabel: `${(taux * 100).toFixed(1).replace(".", ",")} %`,
  }
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

/**
 * Estimation indicative de prestation compensatoire.
 *
 * Aucune formule Wix / Velo trouvée dans contenu/sources (champs UI seulement).
 * Pas de barème légal officiel (art. 270–271 C. civ. — appréciation souveraine du juge).
 *
 * Méthode retenue (fourchette) — pratiques courantes des praticiens :
 * 1. Tiers / demi-durée : (Δ revenus annuels ÷ 3) × (années ÷ 2)
 * 2. 20 % × 8 : (Δ revenus annuels × 20 %) × 8
 * Puis correctifs âge / enfants / état de santé (UI alignée sur le live Wix).
 *
 * Sans valeur juridique — estimation pédagogique uniquement.
 */

export type HealthImpact = "aucun" | "modere" | "notable" | "severe"

export const HEALTH_LABELS: Record<HealthImpact, string> = {
  aucun: "Aucun impact (situation normale)",
  modere: "Limitation modérée (ALD / arrêts ponctuels)",
  notable: "Incapacité notable (invalidité cat. 1 / MDPH 25–49 %)",
  severe: "Incapacité sévère (invalidité cat. 2–3 / AAH / MDPH ≥ 50 %)",
}

/** Correctif créancier (augmente l’estimation). */
const HEALTH_CREDITOR: Record<HealthImpact, number> = {
  aucun: 0,
  modere: 0.08,
  notable: 0.15,
  severe: 0.25,
}

/** Correctif débiteur (diminue si santé dégradée). */
const HEALTH_DEBTOR: Record<HealthImpact, number> = {
  aucun: 0,
  modere: -0.05,
  notable: -0.12,
  severe: -0.2,
}

export interface PrestationInput {
  ageVous: number
  ageConjoint: number
  enfants: number
  santeVous: HealthImpact
  santeConjoint: HealthImpact
  revenusVous: number
  revenusConjoint: number
  anneesMariage: number
}

export interface PrestationResult {
  /** Moyenne des deux méthodes après correctifs. */
  montant: number
  /** Borne basse (min des deux méthodes). */
  fourchetteBasse: number
  /** Borne haute (max des deux méthodes). */
  fourchetteHaute: number
  /** true si vos revenus < conjoints → vous êtes créancier potentiel. */
  vousCreancier: boolean
  diffMensuel: number
}

export function estimatePrestationCompensatoire(
  input: PrestationInput
): PrestationResult {
  const revenusVous = Math.max(0, Number(input.revenusVous) || 0)
  const revenusConjoint = Math.max(0, Number(input.revenusConjoint) || 0)
  const annees = Math.max(0, Number(input.anneesMariage) || 0)
  const enfants = Math.max(0, Math.floor(Number(input.enfants) || 0))

  const vousCreancier = revenusVous < revenusConjoint
  const revenuCreancier = Math.min(revenusVous, revenusConjoint)
  const revenuDebiteur = Math.max(revenusVous, revenusConjoint)
  const diffMensuel = revenuDebiteur - revenuCreancier

  if (diffMensuel <= 0 || annees <= 0) {
    return {
      montant: 0,
      fourchetteBasse: 0,
      fourchetteHaute: 0,
      vousCreancier,
      diffMensuel: 0,
    }
  }

  const ageCreancier = vousCreancier ? input.ageVous : input.ageConjoint
  const santeCreancier = vousCreancier ? input.santeVous : input.santeConjoint
  const santeDebiteur = vousCreancier ? input.santeConjoint : input.santeVous

  const diffAnnuel = diffMensuel * 12
  const methodeTiers = (diffAnnuel / 3) * (annees / 2)
  const methode20x8 = diffAnnuel * 0.2 * 8

  // ±1 % / an autour de 45 ans, plafonné ±20 %
  const ageCorr = Math.max(-0.2, Math.min(0.2, (ageCreancier - 45) * 0.01))
  const enfantsCorr = enfants * 0.08
  const factor =
    1 +
    ageCorr +
    enfantsCorr +
    (HEALTH_CREDITOR[santeCreancier] ?? 0) +
    (HEALTH_DEBTOR[santeDebiteur] ?? 0)

  const low = Math.max(0, Math.round(Math.min(methodeTiers, methode20x8) * factor))
  const high = Math.max(0, Math.round(Math.max(methodeTiers, methode20x8) * factor))
  const mid = Math.round((low + high) / 2)

  return {
    montant: mid,
    fourchetteBasse: low,
    fourchetteHaute: high,
    vousCreancier,
    diffMensuel,
  }
}

export function formatEuroCapital(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount)
}

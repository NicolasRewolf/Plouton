/**
 * Pension alimentaire — aligné sur la table qui tourne en production.
 *
 * Montant = max(0, revenuNet − minimumVital) × taux(enfants, garde)
 * Le taux est un % du revenu disponible pour le total des enfants (pas « par enfant »).
 *
 * ⚠️ Ce fichier reproduit `contenu/sources/wix/simulateurs/pension.js`. Cette
 * source portait une TABLE de 44 lignes de revenu × 6 enfants × 3 modes de
 * garde, pas une formule. Vérifié : la table est exactement
 * `(revenu − 648) × taux`, à 0,004 € près sur 90 points de contrôle.
 *
 * L'en-tête précédent disait « Formule Wix introuvable dans les sources
 * exportées ». Elle a été retrouvée le 21/07/2026 ; ce fichier n'est plus une
 * reconstitution.
 *
 * Sans valeur juridique.
 */

export type CustodyMode = "reduit" | "classique" | "alterne"

/**
 * Minimum vital — 648 €, valeur du site en ligne.
 *
 * Ce fichier retenait 652 € en citant justice.fr au 02/04/2024. L'écart vaut
 * 4 € × taux, soit 0,54 €/mois pour un enfant en garde classique — constant à
 * tout revenu. **Lequel est juste reste ouvert** : 652 est peut-être la
 * révision plus récente, auquel cas c'est le site en ligne qui est périmé.
 * Décision du 21/07 : on reproduit l'existant. Si un avocat tranche pour 652,
 * c'est cette ligne, et elle seule, qui change.
 */
export const MINIMUM_VITAL_EUR = 648

/**
 * Plancher de la table officielle : elle commence à 700 € de revenu.
 * En dessous, le site en ligne ne verse rien plutôt que d'extrapoler.
 */
export const REVENU_PLANCHER_EUR = 700

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

  // Sous le plancher de la table, le site en ligne ne verse rien — il
  // n'extrapole pas sous le premier barreau du barème.
  if (revenu < REVENU_PLANCHER_EUR || kids < 1 || disponible <= 0) {
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

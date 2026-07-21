/**
 * Prestation compensatoire — portage fidèle du modèle « Grenoble prior ».
 *
 * ⚠️ Ce fichier reproduit le calcul qui tourne en production sur Wix
 * (`contenu/sources/wix/simulateurs/calc.web.js`, version 2.5.2). Ce n'est pas
 * une réécriture : chaque coefficient, chaque plafond et chaque refus vient de
 * là. Toute divergence est un défaut, pas une amélioration.
 *
 * Pourquoi cet avertissement. La version précédente de ce fichier portait
 * l'aveu « Aucune formule Wix / Velo trouvée dans contenu/sources » : faute de
 * source, un calcul avait été refait de zéro (tiers/demi-durée et 20 % × 8).
 * Comparé au modèle réel une fois celui-ci retrouvé, il annonçait jusqu'à
 * **38 % d'écart** — un mariage de 5 ans donnait 9 800 – 18 816 € au lieu de
 * 7 776 – 13 478 €. Décision de Nicolas le 21/07/2026 : c'est le modèle Wix
 * qui fait foi.
 *
 * Le modèle en une phrase : on estime un nombre d'ANNÉES de compensation (N),
 * puis on capitalise la disparité annuelle sur ces années.
 *
 *   N   = durée + âge + écart d'âge + enfants + bonus santé du bénéficiaire
 *   D   = (revenu du débiteur − revenu du créancier) × 0,90 × santé du débiteur
 *   cap = N × D × 12          puis trois scénarios : ×0,75, ×1,00, ×1,30
 *
 * Sans valeur juridique — art. 270-271 C. civ., appréciation souveraine du juge.
 *
 * Vérifié par `npm run check:baremes`, qui rejoue le modèle Wix ligne à ligne.
 */

export type HealthImpact = "aucun" | "modere" | "notable" | "severe"

export const HEALTH_LABELS: Record<HealthImpact, string> = {
  aucun: "Aucun impact (situation normale)",
  modere: "Limitation modérée (ALD / arrêts ponctuels)",
  notable: "Incapacité notable (invalidité cat. 1 / MDPH 25–49 %)",
  severe: "Incapacité sévère (invalidité cat. 2–3 / AAH / MDPH ≥ 50 %)",
}

/** Version du modèle porté — suit celle de la source Wix. */
export const MODELE_VERSION = "2.5.2-grenoble-prior"

/* ─────────────────────────── les coefficients ─────────────────────────── */

/** `DEFAULT_WEIGHTS` de `calc.web.js`. Ne pas ajuster sans avocat. */
const POIDS = {
  /** Une année de mariage vaut 0,12 année de compensation. */
  dureeVersAnnees: 0.12,
  /** Contribution maximale de l'âge, atteinte à 55 ans. */
  ageMax: 1.0,
  /** Contribution maximale de l'écart d'âge, avant amplification. */
  ecartAgeMax: 0.4,
  /** Poids d'un « enfant plein » (voir la décroissance ci-dessous). */
  enfantsParEnfant: 0.3,
} as const

/** `DEFAULT_CRITERIA` de `calc.web.js`. */
const CRITERES = {
  /** La disparité brute est minorée de 10 % — prudence du modèle. */
  adoucisseur: 0.9,
  /** Une compensation ne dépasse jamais 5 années, quoi qu'il arrive. */
  anneesMax: 5,
} as const

/** `SCENARIO_PROFILES.default`. Les profils `tight` / `wide` ne sont pas exposés. */
const SCENARIOS = { prudent: 0.75, median: 1.0, haut: 1.3 } as const

/** Santé du BÉNÉFICIAIRE → années de compensation ajoutées. */
const SANTE_BENEFICIAIRE_BONUS: Record<HealthImpact, number> = {
  aucun: 0,
  modere: 0.6,
  notable: 1.5,
  severe: 3.0,
}

/** Santé du DÉBITEUR → multiplicateur sur la disparité (elle diminue). */
const SANTE_DEBITEUR_FACTEUR: Record<HealthImpact, number> = {
  aucun: 1.0,
  modere: 0.97,
  notable: 0.9,
  severe: 0.82,
}

/* ──────────────────────────── les bornes d'entrée ─────────────────────── */

/**
 * Le modèle Wix REFUSE plutôt que de deviner.
 *
 * C'est la réponse à une question qu'on croyait ouverte : que faire d'un âge
 * absent ? La version réécrite laissait passer un champ vide, `NaN` traversait
 * les deux plafonds et ressortait en montant ; un `null` était lu comme
 * « zéro an » et rabotait 20 % en silence. Le site en ligne, lui, n'a jamais
 * eu ce défaut — il refuse. On refuse aussi.
 */
const BORNES = {
  anneesMariage: [0, 80],
  age: [16, 100],
  enfants: [0, 20],
} as const

/* ─────────────────────────────── le calcul ────────────────────────────── */

const borne = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))

/** `safeNum` de `calc.web.js` : une chaîne vide n'est pas zéro, c'est `NaN`. */
function nombre(v: unknown): number {
  if (typeof v === "number") return v
  if (v == null) return Number.NaN
  const s = String(v).replace(/\s+/g, "").trim()
  if (s === "") return Number.NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : Number.NaN
}

/** Durée : 1 pour 1 jusqu'à 30 ans, puis +20 % par année supplémentaire. */
function dureeSaturee(annees: number): number {
  const y = Math.max(0, Math.round(annees))
  return y <= 30 ? y : 30 + 1.2 * (y - 30)
}

/** Âge : cloche centrée sur 55 ans, nulle en dehors de 40–70. */
function contributionAge(agePlusVieux: number): number {
  if (!Number.isFinite(agePlusVieux)) return 0
  return borne(1 - Math.abs(agePlusVieux - 55) / 15, 0, 1) * POIDS.ageMax
}

/** Écart d'âge : plafonné à 20 ans, amplifié ×1→×2 entre 45 et 65 ans. */
function contributionEcartAge(ageA: number, ageB: number): number {
  if (!Number.isFinite(ageA) || !Number.isFinite(ageB)) return 0
  const ecart01 = borne(Math.abs(ageA - ageB) / 20, 0, 1)
  const amplification = 1 + borne((Math.max(ageA, ageB) - 45) / 20, 0, 1)
  return ecart01 * POIDS.ecartAgeMax * amplification
}

/** Enfants : 1er = 100 %, 2e = 50 %, 3e = 25 %, les suivants = 0. */
function contributionEnfants(enfants: number): number {
  const k = Math.max(0, Math.round(enfants))
  const facteurs = [0, 1.0, 0.5, 0.25]
  let somme = 0
  for (let i = 1; i <= k; i++) somme += facteurs[i] ?? 0
  return somme * POIDS.enfantsParEnfant
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
  /** `false` quand une entrée est hors bornes : rien n'est calculé. */
  ok: boolean
  /** Le message exact du modèle Wix, à afficher tel quel. */
  erreur?: string
  /** Scénario médian. */
  montant: number
  /** Scénario prudent (×0,75). */
  fourchetteBasse: number
  /** Scénario haut (×1,30). */
  fourchetteHaute: number
  /** `true` si VOS revenus sont les plus faibles — vous seriez créancier. */
  vousCreancier: boolean
  /** Disparité mensuelle après adoucisseur et santé du débiteur. */
  diffMensuel: number
  /** Le nombre d'années de compensation retenu — le cœur du modèle. */
  anneesCompensation: number
}

const REFUS = (erreur: string): PrestationResult => ({
  ok: false,
  erreur,
  montant: 0,
  fourchetteBasse: 0,
  fourchetteHaute: 0,
  vousCreancier: false,
  diffMensuel: 0,
  anneesCompensation: 0,
})

export function estimatePrestationCompensatoire(
  input: PrestationInput
): PrestationResult {
  const annees = nombre(input.anneesMariage)
  const revVous = nombre(input.revenusVous)
  const revConjoint = nombre(input.revenusConjoint)
  const ageVous = nombre(input.ageVous)
  const ageConjoint = nombre(input.ageConjoint)
  const enfants = nombre(input.enfants)

  // Les messages sont ceux de `calc.web.js`, mot pour mot : le justiciable qui
  // passe d'un site à l'autre doit lire la même phrase. Y compris l'apostrophe
  // typographique de « L’âge » et « d’enfants » — deux d'entre eux avaient été
  // recopiés avec l'apostrophe droite, ce que la garde a vu.
  const erreurs: string[] = []
  if (!Number.isFinite(revVous) || revVous < 0)
    erreurs.push("Votre revenu mensuel doit être un nombre positif.")
  if (!Number.isFinite(revConjoint) || revConjoint < 0)
    erreurs.push("Le revenu mensuel de votre conjoint doit être un nombre positif.")
  if (!Number.isFinite(annees) || annees < BORNES.anneesMariage[0] || annees > BORNES.anneesMariage[1])
    erreurs.push("Les années de mariage doivent être comprises entre 0 et 80.")
  if (!Number.isFinite(ageVous) || ageVous < BORNES.age[0] || ageVous > BORNES.age[1])
    erreurs.push("Votre âge doit être compris entre 16 et 100 ans.")
  if (!Number.isFinite(ageConjoint) || ageConjoint < BORNES.age[0] || ageConjoint > BORNES.age[1])
    erreurs.push("L’âge de votre conjoint doit être compris entre 16 et 100 ans.")
  if (!Number.isFinite(enfants) || enfants < BORNES.enfants[0] || enfants > BORNES.enfants[1])
    erreurs.push("Le nombre d’enfants doit être compris entre 0 et 20.")

  if (erreurs.length) return REFUS(erreurs.join(" "))

  // Auto-bénéficiaire : le créancier est celui aux revenus les plus faibles.
  // Côté Wix, cet échange est fait par la page (`AUTO_RECEIVER_MODE`) avant
  // l'appel ; ici il vit dans le modèle, pour qu'il n'y ait qu'un endroit où se
  // tromper.
  //
  // L'échange se lit sur `revConjoint < revVous`, et non sur « vous êtes
  // créancier ». Les deux ne se séparent qu'à revenus ÉGAUX : là, l'échange
  // Wix ne se déclenche pas et le bénéficiaire reste « vous », alors que
  // `vousCreancier` vaut déjà `false`. Faire porter le rôle par ce dernier
  // attribuait la santé du CONJOINT au créancier — sans un euro d'écart,
  // puisque la disparité est nulle, mais `anneesCompensation` en changeait, et
  // il est affiché. Écart relevé par la garde sur 2 454 des 25 920 points.
  const echange = revConjoint < revVous
  const vousCreancier = revVous < revConjoint
  const revCreancier = Math.min(revVous, revConjoint)
  const revDebiteur = Math.max(revVous, revConjoint)
  const santeCreancier = echange ? input.santeConjoint : input.santeVous
  const santeDebiteur = echange ? input.santeVous : input.santeConjoint

  // L'âge n'entre PAS par le rôle : le modèle lit le plus âgé des deux et leur
  // écart. Échanger les conjoints ne déplace donc pas ces deux contributions —
  // contrairement à la santé.
  const nDuree = dureeSaturee(annees) * POIDS.dureeVersAnnees
  const nAge = contributionAge(Math.max(ageVous, ageConjoint))
  const nEcartAge = contributionEcartAge(ageVous, ageConjoint)
  const nEnfants = contributionEnfants(enfants)
  const bonusSante = SANTE_BENEFICIAIRE_BONUS[santeCreancier] ?? 0

  const N = borne(nDuree + nAge + nEcartAge + nEnfants + bonusSante, 0, CRITERES.anneesMax)

  const facteurDebiteur = SANTE_DEBITEUR_FACTEUR[santeDebiteur] ?? 1
  const disparite = Math.max(0, revDebiteur - revCreancier) * CRITERES.adoucisseur * facteurDebiteur

  // L'ordre des multiplications suit `calc.web.js` — annualiser PUIS capitaliser.
  // En virgule flottante, `N × (d × 12)` et `(N × d) × 12` ne donnent pas
  // toujours le même dernier bit, et l'écart bascule un arrondi à l'euro une
  // fois sur mille. Mesuré : cet ordre-ci ramène l'écart à zéro sur 25 920
  // combinaisons.
  const annuel = disparite * 12
  const capital = N * annuel

  return {
    ok: true,
    montant: Math.round(SCENARIOS.median * capital),
    fourchetteBasse: Math.round(SCENARIOS.prudent * capital),
    fourchetteHaute: Math.round(SCENARIOS.haut * capital),
    vousCreancier,
    diffMensuel: disparite,
    anneesCompensation: N,
  }
}

/**
 * Arrondi d'affichage à 500 € — `bucket500` de la page Wix.
 *
 * Le calcul reste exact ; c'est l'AFFICHAGE qui est arrondi, pour qu'une
 * estimation ne se lise pas comme un chiffrage. Sous 250 €, on ne montre pas un
 * nombre du tout.
 */
export function arrondi500(montant: number): number | "< 500" {
  if (!Number.isFinite(montant)) return 0
  return montant < 250 ? "< 500" : Math.round(montant / 500) * 500
}

export function formatEuroCapital(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Ce que le justiciable lit — arrondi compris. */
export function afficherCapital(montant: number): string {
  const a = arrondi500(montant)
  return a === "< 500" ? "moins de 500 €" : formatEuroCapital(a)
}

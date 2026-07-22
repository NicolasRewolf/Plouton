#!/usr/bin/env node
/**
 * Épingle les barèmes des deux simulateurs
 * (`src/lib/simulators/pension-alimentaire.ts`,
 *  `src/lib/simulators/prestation-compensatoire.ts`).
 *
 * Ces deux fichiers calculent de l'argent qu'un justiciable lit sur le site.
 * La prestation reprend le modèle Wix « Grenoble prior » v2.5.2
 * (`contenu/sources/wix/simulateurs/calc.web.js`). La pension reprend
 * `pension.js` (minimum vital 648 €, plancher 700 €).
 *
 * Cette garde n'affirme pas que le barème est JUSTE — l'arbitrage appartient
 * à un avocat. Elle affirme que le barème d'aujourd'hui est celui d'hier, et
 * que le modèle REFUSE plutôt que de inventer un montant crédible.
 *
 * Usage : (depuis site/) npx tsx scripts/check-baremes.mjs
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const LIB = path.join(here, "..", "src", "lib", "simulators")

const pension = await import(path.join(LIB, "pension-alimentaire.ts"))
const prestation = await import(path.join(LIB, "prestation-compensatoire.ts"))

const {
  CUSTODY_LABELS,
  MINIMUM_VITAL_EUR,
  REVENU_PLANCHER_EUR,
  rateFor,
  estimatePensionAlimentaire,
  formatEuro,
} = pension
const {
  HEALTH_LABELS,
  MODELE_VERSION,
  estimatePrestationCompensatoire,
  formatEuroCapital,
  afficherCapital,
  arrondi500,
} = prestation

const pa = (revenuNetMensuel, enfants, mode) =>
  estimatePensionAlimentaire({ revenuNetMensuel, enfants, garde: mode })

/** Scénario de référence : 2 000 € d'écart, 10 ans, 45 ans, santé neutre. */
const REFERENCE = {
  ageVous: 45,
  ageConjoint: 45,
  enfants: 0,
  santeVous: "aucun",
  santeConjoint: "aucun",
  revenusVous: 1000,
  revenusConjoint: 3000,
  anneesMariage: 10,
}

const pc = (modifs = {}) =>
  estimatePrestationCompensatoire({ ...REFERENCE, ...modifs })

const FINE = "\u202f"
const INSEC = "\u00a0"

await garde("barèmes des simulateurs", async (t) => {
  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — constantes et modes")

  t.eq("minimum vital du site en ligne", MINIMUM_VITAL_EUR, 648)
  t.eq("plancher de la table officielle", REVENU_PLANCHER_EUR, 700)
  t.eq(
    "trois modes de garde, et pas un de plus",
    Object.keys(CUSTODY_LABELS).sort(),
    ["alterne", "classique", "reduit"]
  )
  await t.each(
    "chaque mode proposé a bien une ligne dans la table des taux",
    Object.keys(CUSTODY_LABELS),
    (mode) => Number.isFinite(rateFor(1, mode)) || `${mode} : aucun taux`
  )
  t.eq(
    "libellé — droit de visite réduit",
    CUSTODY_LABELS.reduit,
    "Droit de visite et d'hébergement réduit"
  )
  t.eq(
    "libellé — classique",
    CUSTODY_LABELS.classique,
    "Droit de visite et d'hébergement classique"
  )
  t.eq("libellé — résidence alternée", CUSTODY_LABELS.alterne, "Résidence alternée")

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — le calcul")

  t.eq("taux — 1 enfant, garde classique", rateFor(1, "classique"), 0.135)
  t.eq("taux — 2 enfants, garde classique", rateFor(2, "classique"), 0.115)
  t.eq("taux — au-delà de 6 → taux du 6ᵉ", rateFor(9, "classique"), rateFor(6, "classique"))

  const courant = pa(3000, 1, "classique")
  t.eq("cas courant — revenu disponible", courant.revenuDisponible, 3000 - 648)
  t.eq("cas courant — montant (arrondi centime)", courant.montantMensuel, 317.52)
  t.eq("cas courant — libellé du taux", courant.tauxLabel, "13,5 %")

  t.eq(
    "sous le plancher — aucune pension (pas d'extrapolation)",
    pa(699, 1, "classique").montantMensuel,
    0
  )
  t.eq(
    "pile au plancher — le barème s'applique",
    pa(700, 1, "classique").montantMensuel,
    7.02
  )
  t.eq("sans enfant — aucune pension", pa(3000, 0, "classique").montantMensuel, 0)
  t.eq(
    "sans enfant — le disponible reste affiché",
    pa(3000, 0, "classique").revenuDisponible,
    2352
  )

  const unEuroAuDessus = pa(649, 1, "classique")
  t.eq(
    "un euro au-dessus du minimum — disponible = 1 €",
    unEuroAuDessus.revenuDisponible,
    1
  )
  // 649 < 700 → plancher : toujours 0
  t.eq(
    "… mais sous le plancher table, montant nul",
    unEuroAuDessus.montantMensuel,
    0
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — identité du modèle")

  t.eq("version portée", MODELE_VERSION, "2.5.2-grenoble-prior")
  t.eq(
    "quatre degrés de santé, et pas un de plus",
    Object.keys(HEALTH_LABELS).sort(),
    ["aucun", "modere", "notable", "severe"]
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — scénario de référence")

  const ref = pc()
  t.ok("le calcul aboutit", ref.ok, ref.erreur)
  t.eq("vous seriez créancier (revenus plus faibles)", ref.vousCreancier, true)
  t.eq("disparité après adoucisseur 10 %", ref.diffMensuel, 1800)
  // N = 10×0,12 + contributionÂge(45) + 0 + 0 = 1,2 + (1−10/15) = 1,2 + ⅓
  t.eq("années de compensation", ref.anneesCompensation, 1.2 + 1 / 3)
  t.eq("scénario médian", ref.montant, 33120)
  t.eq("scénario prudent (×0,75)", ref.fourchetteBasse, 24840)
  t.eq("scénario haut (×1,30)", ref.fourchetteHaute, 43056)
  t.ok(
    "la fourchette encadre le médian",
    ref.fourchetteBasse <= ref.montant && ref.montant <= ref.fourchetteHaute
  )

  // Valeur d'écart documentée dans le commit de portage (ancien modèle vs Wix).
  const golden = pc({
    anneesMariage: 4,
    ageVous: 40,
    ageConjoint: 40,
    revenusVous: 1000,
    revenusConjoint: 3000,
  })
  t.eq("cas documenté — borne basse 7 776 €", golden.fourchetteBasse, 7776)
  t.eq("cas documenté — médian 10 368 €", golden.montant, 10368)
  t.eq("cas documenté — borne haute 13 478 €", golden.fourchetteHaute, 13478)

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — durée, âge, enfants, santé")

  const mariage5 = pc({ anneesMariage: 5 })
  t.ok("mariage plus court → capital plus bas", mariage5.montant < ref.montant)
  t.eq("mariage 5 ans — médian", mariage5.montant, 20160)

  const age55 = pc({ ageVous: 55, ageConjoint: 55 })
  t.ok("âge au pic (55) → plus d'années", age55.anneesCompensation > ref.anneesCompensation)

  const unEnfant = pc({ enfants: 1 })
  // 1er enfant = +0,3 année
  t.eq(
    "un enfant ajoute 0,3 année de compensation",
    unEnfant.anneesCompensation,
    ref.anneesCompensation + 0.3
  )

  const santeCreancier = pc({ santeVous: "modere" })
  t.eq(
    "santé créancier modérée — +0,6 année",
    santeCreancier.anneesCompensation,
    ref.anneesCompensation + 0.6
  )
  t.eq("… et le montant suit", santeCreancier.montant, 46080)

  const santeDebiteur = pc({ santeConjoint: "severe" })
  t.eq(
    "santé débiteur sévère — disparité ×0,82",
    santeDebiteur.diffMensuel,
    1800 * 0.82
  )

  // L'échange suit `revConjoint < revVous`, pas `vousCreancier` (égaux exclus).
  const echangeA = pc({
    revenusVous: 3000,
    revenusConjoint: 1000,
    santeVous: "severe",
    santeConjoint: "aucun",
  })
  const echangeB = pc({
    revenusVous: 1000,
    revenusConjoint: 3000,
    santeVous: "aucun",
    santeConjoint: "severe",
  })
  t.eq(
    "auto-bénéficiaire — la santé du débiteur suit le rôle, pas la case",
    echangeA.montant,
    echangeB.montant
  )
  t.eq("… et le créancier n'est plus « vous »", echangeA.vousCreancier, false)

  const egaux = pc({ revenusVous: 2000, revenusConjoint: 2000 })
  t.eq("revenus égaux — montant nul", egaux.montant, 0)
  t.eq("revenus égaux — personne n'est créancier", egaux.vousCreancier, false)
  // À égalité, l'échange Wix ne se déclenche pas : la santé « vous » reste
  // celle du bénéficiaire affiché (anneesCompensation).
  t.eq(
    "revenus égaux — pas d'échange de santé (bénéficiaire = vous)",
    pc({ revenusVous: 2000, revenusConjoint: 2000, santeVous: "severe" })
      .anneesCompensation,
    ref.anneesCompensation + 3.0
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — le refus, pas la conjecture")

  // C'était le défaut de l'ancien modèle : âge vide → NaN ou −20 % silencieux.
  // Le site Wix refuse. On refuse aussi.
  await t.each(
    "un âge inexploitable refuse le calcul — 0 € n'est pas une estimation",
    [undefined, null, "", " ", "quarante", Number.NaN, 0, 15, 101, -5],
    (age) => {
      const r = pc({ ageVous: age })
      return (
        (r.ok === false &&
          r.montant === 0 &&
          typeof r.erreur === "string" &&
          r.erreur.includes("âge")) ||
        `âge ${JSON.stringify(age)} → ok=${r.ok} montant=${r.montant} erreur=${r.erreur}`
      )
    }
  )
  t.eq(
    "message d'âge — vous",
    pc({ ageVous: "" }).erreur,
    "Votre âge doit être compris entre 16 et 100 ans."
  )
  t.eq(
    "message d'âge — conjoint (apostrophe typographique)",
    pc({ ageConjoint: 12 }).erreur,
    "L’âge de votre conjoint doit être compris entre 16 et 100 ans."
  )
  t.eq(
    "revenu négatif — refus",
    pc({ revenusVous: -10 }).ok,
    false
  )
  t.eq(
    "années hors bornes — refus",
    pc({ anneesMariage: 81 }).erreur,
    "Les années de mariage doivent être comprises entre 0 et 80."
  )
  t.eq(
    "enfants hors bornes — refus (apostrophe typographique)",
    pc({ enfants: 21 }).erreur,
    "Le nombre d’enfants doit être compris entre 0 et 20."
  )
  t.ok("âge valide 16 — accepté", pc({ ageVous: 16, ageConjoint: 16 }).ok)
  t.ok("âge valide 100 — accepté", pc({ ageVous: 100, ageConjoint: 100 }).ok)

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — propriétés sur un échantillon")

  const ages = [16, 30, 45, 55, 70, 100]
  const revenus = [0, 1000, 3000, 8000]
  const annees = [0, 5, 10, 30]
  const enfants = [0, 1, 2, 3]
  let echantillon = 0
  let tousPropres = true
  let premierDefaut = ""
  for (const ageVous of ages) {
    for (const ageConjoint of ages) {
      for (const revenusVous of revenus) {
        for (const revenusConjoint of revenus) {
          for (const anneesMariage of annees) {
            for (const nEnfants of enfants) {
              echantillon++
              const r = estimatePrestationCompensatoire({
                ageVous,
                ageConjoint,
                enfants: nEnfants,
                santeVous: "aucun",
                santeConjoint: "aucun",
                revenusVous,
                revenusConjoint,
                anneesMariage,
              })
              if (!r.ok) {
                tousPropres = false
                premierDefaut = `refus inattendu ${JSON.stringify({ ageVous, ageConjoint, revenusVous, revenusConjoint, anneesMariage, nEnfants })}`
                break
              }
              const vals = [r.fourchetteBasse, r.montant, r.fourchetteHaute]
              if (!vals.every(Number.isFinite) || !vals.every((n) => n >= 0)) {
                tousPropres = false
                premierDefaut = `montant absurde ${JSON.stringify(vals)}`
                break
              }
              if (
                r.fourchetteBasse > r.fourchetteHaute ||
                r.montant < r.fourchetteBasse ||
                r.montant > r.fourchetteHaute
              ) {
                tousPropres = false
                premierDefaut = `fourchette cassée ${JSON.stringify(vals)}`
                break
              }
            }
            if (!tousPropres) break
          }
          if (!tousPropres) break
        }
        if (!tousPropres) break
      }
      if (!tousPropres) break
    }
    if (!tousPropres) break
  }
  t.ok(
    `aucune fourchette négative, absurde ou illisible (${echantillon})`,
    tousPropres,
    premierDefaut
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("le formatage")

  t.eq("pension — un montant rond n'a pas de centimes", formatEuro(270), `270${INSEC}€`)
  t.eq("pension — un montant à centimes les garde", formatEuro(316.98), `316,98${INSEC}€`)
  t.eq("pension — zéro", formatEuro(0), `0${INSEC}€`)
  t.eq(
    "pension — les milliers sont séparés par une fine insécable",
    formatEuro(179882.64),
    `179${FINE}882,64${INSEC}€`
  )
  t.eq(
    "pension — un demi-centime affiche ses deux décimales",
    formatEuro(12345.5),
    `12${FINE}345,50${INSEC}€`
  )

  t.eq(
    "prestation — un capital n'a jamais de centimes",
    formatEuroCapital(12345),
    `12${FINE}345${INSEC}€`
  )
  t.eq(
    "prestation — et les décimales sont arrondies",
    formatEuroCapital(12345.6),
    `12${FINE}346${INSEC}€`
  )
  t.eq("prestation — zéro", formatEuroCapital(0), `0${INSEC}€`)
  t.eq(
    "prestation — million",
    formatEuroCapital(1_000_000),
    `1${FINE}000${FINE}000${INSEC}€`
  )

  t.eq("arrondi 500 — sous 250 → libellé", arrondi500(200), "< 500")
  t.eq("arrondi 500 — 12345 → 12500", arrondi500(12345), 12500)
  t.eq(
    "affichage justiciable — arrondi compris",
    afficherCapital(12345),
    formatEuroCapital(12500)
  )
  t.eq("affichage justiciable — petit montant", afficherCapital(200), "moins de 500 €")

  t.eq(
    "affichage complet d'une pension",
    formatEuro(pa(3000, 1, "classique").montantMensuel),
    `317,52${INSEC}€`
  )
  t.eq(
    "affichage complet d'une fourchette de prestation",
    `${formatEuroCapital(ref.fourchetteBasse)} – ${formatEuroCapital(ref.fourchetteHaute)}`,
    `24${FINE}840${INSEC}€ – 43${FINE}056${INSEC}€`
  )
})

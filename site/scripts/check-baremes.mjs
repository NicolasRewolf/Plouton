#!/usr/bin/env node
/**
 * Épingle les barèmes des deux simulateurs
 * (`src/lib/simulators/pension-alimentaire.ts`,
 *  `src/lib/simulators/prestation-compensatoire.ts`).
 *
 * Ces deux fichiers calculent de l'argent qu'un justiciable lit sur le site et
 * sur lequel il fonde une attente. Jusqu'ici rien n'épinglait une seule ligne
 * de leurs tables : un taux déplacé d'une colonne, un minimum vital revalorisé
 * à la main, un correctif recopié de travers passaient sans un mot — le site
 * annonçait simplement un autre montant, et personne n'avait de quoi dire
 * lequel des deux était l'ancien.
 *
 * Cette garde n'affirme pas que le barème est JUSTE. Ce n'est pas son office :
 * la table de la pension vient de justice.fr, celle de la prestation
 * compensatoire est une convention de praticiens sans valeur légale, et
 * l'arbitrage de l'une comme de l'autre appartient à un avocat. Elle affirme
 * seulement que le barème d'aujourd'hui est celui d'hier — et fait donc du
 * moindre changement de chiffre une décision consciente, prise par quelqu'un.
 *
 * Les correctifs de santé et d'âge ne sont pas exportés. On ne les recopie pas
 * pour autant : on les lit à travers un scénario de référence dont le facteur
 * vaut 1, et dont la borne haute est donc le multiplicateur lui-même.
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
  rateFor,
  estimatePensionAlimentaire,
  formatEuro,
} = pension
const { HEALTH_LABELS, estimatePrestationCompensatoire, formatEuroCapital } =
  prestation

/** Raccourci : la pension pour un revenu, un nombre d'enfants, un mode. */
const pa = (revenuNetMensuel, enfants, mode) =>
  estimatePensionAlimentaire({ revenuNetMensuel, enfants, garde: mode })

/**
 * Scénario de référence de la prestation compensatoire : 2 000 € d'écart
 * mensuel, 10 ans de mariage, créancier de 45 ans, aucun enfant, deux
 * conjoints en bonne santé. Tous les correctifs y sont neutres, donc le
 * facteur vaut exactement 1 et les deux méthodes donnent 38 400 € et 40 000 €.
 */
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
const REFERENCE_HAUTE = 40000

const pc = (modifs = {}) =>
  estimatePrestationCompensatoire({ ...REFERENCE, ...modifs })

/**
 * Le multiplicateur qu'une variante applique au scénario de référence.
 * C'est ainsi qu'on lit les correctifs sans recopier les tables privées.
 */
const facteur = (modifs) => pc(modifs).fourchetteHaute / REFERENCE_HAUTE

await garde("barèmes des simulateurs", async (t) => {
  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — les modes de garde")

  // Un mode listé dans le menu déroulant mais absent de la table des taux
  // ferait planter le calcul en production, pas ici : on vérifie que les deux
  // jeux de clés coïncident, dans les deux sens.
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
    "libellé — droit de visite classique",
    CUSTODY_LABELS.classique,
    "Droit de visite et d'hébergement classique"
  )
  t.eq("libellé — résidence alternée", CUSTODY_LABELS.alterne, "Résidence alternée")

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — la table des taux")

  // Barème justice.fr du 02/04/2024. Ces trois lignes SONT le barème : si
  // l'une bouge, le site verse autre chose. Elles sont écrites en clair pour
  // qu'un avocat puisse les relire ligne à ligne contre la table officielle.
  const taux = (mode) => [1, 2, 3, 4, 5, 6].map((n) => rateFor(n, mode))

  t.eq(
    "droit de visite réduit — 1 à 6 enfants",
    taux("reduit"),
    [0.18, 0.155, 0.133, 0.117, 0.106, 0.095]
  )
  t.eq(
    "droit de visite classique — 1 à 6 enfants",
    taux("classique"),
    [0.135, 0.115, 0.1, 0.088, 0.08, 0.072]
  )
  t.eq(
    "résidence alternée — 1 à 6 enfants",
    taux("alterne"),
    [0.09, 0.078, 0.067, 0.059, 0.053, 0.048]
  )

  // Le taux est une part du revenu disponible pour l'ENSEMBLE des enfants,
  // pas par enfant : il doit donc décroître à mesure qu'ils sont nombreux.
  await t.each(
    "le taux décroît à chaque enfant supplémentaire",
    Object.keys(CUSTODY_LABELS),
    (mode) => {
      const l = taux(mode)
      for (let i = 1; i < l.length; i++) {
        if (!(l[i] < l[i - 1])) {
          return `${mode} : ${l[i - 1]} → ${l[i]} au ${i + 1}ᵉ enfant`
        }
      }
      return true
    }
  )

  // Moins l'enfant réside chez le débiteur, plus le débiteur verse.
  await t.each(
    "réduit > classique > alterné, à nombre d'enfants égal",
    [1, 2, 3, 4, 5, 6],
    (n) =>
      (rateFor(n, "reduit") > rateFor(n, "classique") &&
        rateFor(n, "classique") > rateFor(n, "alterne")) ||
      `${n} enfant(s) : ${rateFor(n, "reduit")} / ${rateFor(n, "classique")} / ${rateFor(n, "alterne")}`
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — au-delà de six enfants")

  // La table officielle s'arrête à six. Le code fige le taux du 6ᵉ au lieu de
  // refuser de répondre : c'est un choix, il doit rester visible.
  await t.each(
    "le taux se fige sur celui du 6ᵉ enfant",
    Object.keys(CUSTODY_LABELS),
    (mode) => {
      const six = rateFor(6, mode)
      for (const n of [7, 8, 12, 100]) {
        if (rateFor(n, mode) !== six) {
          return `${mode} : ${n} enfants → ${rateFor(n, mode)} au lieu de ${six}`
        }
      }
      return true
    }
  )
  t.eq(
    "sept enfants versent autant que six",
    pa(3000, 7, "reduit").montantMensuel,
    pa(3000, 6, "reduit").montantMensuel
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — le minimum vital")

  t.eq("minimum vital retenu", MINIMUM_VITAL_EUR, 652)

  // Le plancher se lit à l'euro près : au minimum vital exactement, rien
  // n'est dû ; un euro au-dessus, le barème s'applique à cet euro-là.
  t.eq("au minimum vital pile, rien n'est dû", pa(652, 3, "reduit").montantMensuel, 0)
  t.eq("un euro en dessous, rien n'est dû", pa(651, 1, "reduit").montantMensuel, 0)
  t.eq(
    "un euro au-dessus, le barème s'applique à cet euro",
    pa(653, 1, "reduit"),
    { montantMensuel: 0.18, revenuDisponible: 1, taux: 0.18, tauxLabel: "18,0 %" }
  )

  // Le revenu disponible n'est pas arrondi : il porte les centimes du revenu.
  t.eq("le revenu disponible garde ses centimes", pa(652.5, 1, "reduit").revenuDisponible, 0.5)
  t.eq("le montant, lui, est arrondi au centime", pa(652.5, 1, "reduit").montantMensuel, 0.09)

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — les bornes")

  t.eq(
    "sans enfant, aucune pension — mais le revenu disponible reste affiché",
    pa(5000, 0, "classique"),
    { montantMensuel: 0, revenuDisponible: 4348, taux: 0, tauxLabel: "0 %" }
  )
  t.eq("revenu nul", pa(0, 2, "alterne"), {
    montantMensuel: 0,
    revenuDisponible: 0,
    taux: 0,
    tauxLabel: "0 %",
  })
  t.eq("revenu négatif ramené à zéro", pa(-500, 2, "alterne").revenuDisponible, 0)
  t.eq("revenu absent ou illisible traité comme nul", pa(Number.NaN, 2, "classique").montantMensuel, 0)
  t.eq("nombre d'enfants négatif traité comme zéro", pa(3000, -3, "classique").montantMensuel, 0)
  t.eq("nombre d'enfants fractionnaire tronqué vers le bas", pa(3000, 2.9, "classique").taux, 0.115)

  t.eq("cas courant — 3 000 €, un enfant, garde classique", pa(3000, 1, "classique"), {
    montantMensuel: 316.98,
    revenuDisponible: 2348,
    taux: 0.135,
    tauxLabel: "13,5 %",
  })
  t.eq(
    "revenu très élevé — le barème reste proportionnel, sans plafond",
    pa(1_000_000, 1, "reduit"),
    {
      montantMensuel: 179882.64,
      revenuDisponible: 999348,
      taux: 0.18,
      tauxLabel: "18,0 %",
    }
  )

  // Un montant négatif, un NaN ou une pension supérieure au revenu disponible
  // seraient tous affichés tels quels au justiciable. On balaie le domaine.
  const grille = []
  for (const mode of Object.keys(CUSTODY_LABELS)) {
    for (let n = 0; n <= 8; n++) {
      for (const r of [0, 1, 651, 652, 653, 1000, 3000, 25000, 1_000_000]) {
        grille.push([r, n, mode])
      }
    }
  }
  await t.each("aucun montant négatif, absurde ou illisible", grille, ([r, n, mode]) => {
    const res = pa(r, n, mode)
    if (!Number.isFinite(res.montantMensuel)) return `${r}/${n}/${mode} : montant illisible`
    if (res.montantMensuel < 0) return `${r}/${n}/${mode} : montant négatif`
    if (res.revenuDisponible < 0) return `${r}/${n}/${mode} : disponible négatif`
    if (res.montantMensuel > res.revenuDisponible) {
      return `${r}/${n}/${mode} : pension ${res.montantMensuel} > disponible ${res.revenuDisponible}`
    }
    // Le montant doit être arrondi au centime. On le compare au centime le
    // plus proche RECONSTRUIT de la même façon (`round(x·100)/100`) et non au
    // produit `x·100` : ce produit n'est pas entier en virgule flottante —
    // 4382.64 × 100 vaut 438263.99999999994 — et le test naïf accusait à tort
    // quinze montants pourtant justes.
    if (res.montantMensuel !== Math.round(res.montantMensuel * 100) / 100) {
      return `${r}/${n}/${mode} : ${res.montantMensuel} n'est pas un montant en centimes`
    }
    return true
  })

  // ────────────────────────────────────────────────────────────────────────
  t.section("pension — le libellé du taux")

  // Le pourcentage est affiché à côté du montant : une décimale, virgule
  // française. C'est ce que le justiciable recopie dans sa requête.
  t.eq(
    "libellés — droit de visite réduit",
    [1, 2, 3, 4, 5, 6].map((n) => pa(10000, n, "reduit").tauxLabel),
    ["18,0 %", "15,5 %", "13,3 %", "11,7 %", "10,6 %", "9,5 %"]
  )
  t.eq(
    "libellés — droit de visite classique",
    [1, 2, 3, 4, 5, 6].map((n) => pa(10000, n, "classique").tauxLabel),
    ["13,5 %", "11,5 %", "10,0 %", "8,8 %", "8,0 %", "7,2 %"]
  )
  t.eq(
    "libellés — résidence alternée",
    [1, 2, 3, 4, 5, 6].map((n) => pa(10000, n, "alterne").tauxLabel),
    ["9,0 %", "7,8 %", "6,7 %", "5,9 %", "5,3 %", "4,8 %"]
  )
  // Quand rien n'est dû, le libellé est « 0 % » — sans décimale, contrairement
  // aux autres. La différence est voulue : elle se voit à l'écran.
  t.eq("aucune pension due — le libellé n'a pas de décimale", pa(0, 1, "reduit").tauxLabel, "0 %")

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — l'état de santé")

  t.eq(
    "quatre degrés d'atteinte, et pas un de plus",
    Object.keys(HEALTH_LABELS).sort(),
    ["aucun", "modere", "notable", "severe"]
  )
  t.eq(
    "libellé — aucun impact",
    HEALTH_LABELS.aucun,
    "Aucun impact (situation normale)"
  )
  t.eq(
    "libellé — limitation modérée",
    HEALTH_LABELS.modere,
    "Limitation modérée (ALD / arrêts ponctuels)"
  )
  t.eq(
    "libellé — incapacité notable",
    HEALTH_LABELS.notable,
    "Incapacité notable (invalidité cat. 1 / MDPH 25–49 %)"
  )
  t.eq(
    "libellé — incapacité sévère",
    HEALTH_LABELS.severe,
    "Incapacité sévère (invalidité cat. 2–3 / AAH / MDPH ≥ 50 %)"
  )

  // Les deux tables de correctifs sont privées. On les lit par leur effet sur
  // le scénario de référence, ce qui vaut mieux que de les recopier : si elles
  // changent, c'est le montant versé qui le dit.
  t.eq("santé du créancier — aucun impact : +0 %", facteur({ santeVous: "aucun" }), 1)
  t.eq("santé du créancier — limitation modérée : +8 %", facteur({ santeVous: "modere" }), 1.08)
  t.eq("santé du créancier — incapacité notable : +15 %", facteur({ santeVous: "notable" }), 1.15)
  t.eq("santé du créancier — incapacité sévère : +25 %", facteur({ santeVous: "severe" }), 1.25)

  t.eq("santé du débiteur — aucun impact : −0 %", facteur({ santeConjoint: "aucun" }), 1)
  t.eq("santé du débiteur — limitation modérée : −5 %", facteur({ santeConjoint: "modere" }), 0.95)
  t.eq("santé du débiteur — incapacité notable : −12 %", facteur({ santeConjoint: "notable" }), 0.88)
  t.eq("santé du débiteur — incapacité sévère : −20 %", facteur({ santeConjoint: "severe" }), 0.8)

  // Le correctif suit le rôle, pas la personne : c'est la santé de celui qui
  // reçoit qui augmente, celle de celui qui paie qui diminue. Ici les revenus
  // sont inversés, donc « vous » êtes débiteur et votre santé sévère abaisse.
  t.eq(
    "le correctif suit le rôle, pas la personne",
    facteur({ revenusVous: 3000, revenusConjoint: 1000, santeVous: "severe" }),
    0.8
  )
  await t.each(
    "un degré de santé non reconnu ne casse pas le calcul, il vaut zéro",
    ["", "inconnu", "grave"],
    (v) => facteur({ santeVous: v }) === 1 || `« ${v} » a déplacé le montant`
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — les deux méthodes")

  // Tiers/demi-durée : (Δ annuel ÷ 3) × (années ÷ 2). 20 % × 8 : Δ annuel ×
  // 1,6. La première dépend de la durée du mariage, la seconde non : elles se
  // croisent à 9,6 ans, et la fourchette s'y referme sur un point unique.
  t.eq("scénario de référence", pc(), {
    montant: 39200,
    fourchetteBasse: 38400,
    fourchetteHaute: 40000,
    vousCreancier: true,
    diffMensuel: 2000,
  })
  t.eq("mariage court — c'est le tiers/demi-durée qui fait la borne basse", pc({ anneesMariage: 5 }), {
    montant: 29200,
    fourchetteBasse: 20000,
    fourchetteHaute: 38400,
    vousCreancier: true,
    diffMensuel: 2000,
  })
  t.eq("mariage long — le tiers/demi-durée passe en borne haute", pc({ anneesMariage: 30 }), {
    montant: 79200,
    fourchetteBasse: 38400,
    fourchetteHaute: 120000,
    vousCreancier: true,
    diffMensuel: 2000,
  })
  const croisement = pc({ anneesMariage: 9.6 })
  t.eq(
    "à 9,6 ans les deux méthodes se rejoignent, la fourchette se referme",
    [croisement.fourchetteBasse, croisement.montant, croisement.fourchetteHaute],
    [38400, 38400, 38400]
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — âge et enfants")

  t.eq("créancier de 45 ans — pivot, aucun correctif", facteur({ ageVous: 45 }), 1)
  t.eq("créancier de 35 ans — −1 % par année sous 45", facteur({ ageVous: 35 }), 0.9)
  t.eq("créancier de 55 ans — +1 % par année au-dessus", facteur({ ageVous: 55 }), 1.1)
  t.eq("le correctif d'âge est plafonné à −20 %", facteur({ ageVous: 25 }), 0.8)
  t.eq("… et 20 ans ne descend pas plus bas", facteur({ ageVous: 20 }), 0.8)
  t.eq("le correctif d'âge est plafonné à +20 %", facteur({ ageVous: 65 }), 1.2)
  t.eq("… et 90 ans ne monte pas plus haut", facteur({ ageVous: 90 }), 1.2)

  t.eq("chaque enfant ajoute 8 %", facteur({ enfants: 1 }), 1.08)
  t.eq("trois enfants ajoutent 24 %", facteur({ enfants: 3 }), 1.24)
  // Contrairement au correctif d'âge, celui des enfants n'est PAS plafonné.
  // C'est l'état actuel du code, pas une recommandation : voir le rapport.
  t.eq("le correctif enfants n'est plafonné par rien", facteur({ enfants: 20 }), 2.6)
  t.eq("enfants négatifs ramenés à zéro", facteur({ enfants: -3 }), 1)
  t.eq("nombre d'enfants illisible traité comme zéro", facteur({ enfants: Number.NaN }), 1)

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — les bornes")

  t.eq("revenus égaux — aucune prestation, et personne n'est créancier", pc({ revenusVous: 3000 }), {
    montant: 0,
    fourchetteBasse: 0,
    fourchetteHaute: 0,
    vousCreancier: false,
    diffMensuel: 0,
  })
  t.eq("mariage de zéro an — aucune prestation", pc({ anneesMariage: 0 }).montant, 0)
  t.eq("durée de mariage négative ramenée à zéro", pc({ anneesMariage: -5 }).montant, 0)
  t.eq("revenus négatifs ramenés à zéro", pc({ revenusVous: -500, revenusConjoint: -100 }).diffMensuel, 0)
  t.eq("revenu illisible traité comme nul", pc({ revenusVous: Number.NaN }).diffMensuel, 3000)

  // Le sens du versement se lit sur le seul rapport des revenus. À l'égalité,
  // « vous » n'êtes pas créancier — c'est un choix, il est visible ici.
  t.eq("vous gagnez moins — vous êtes créancier", pc().vousCreancier, true)
  t.eq("vous gagnez plus — vous ne l'êtes pas", pc({ revenusVous: 5000 }).vousCreancier, false)
  t.eq("à revenus égaux — vous ne l'êtes pas non plus", pc({ revenusVous: 3000 }).vousCreancier, false)

  // Le calcul ne connaît que le couple {créancier, débiteur} : échanger les
  // deux parties, correctifs compris, doit donner exactement les mêmes euros.
  const miroir = pc({
    revenusVous: 3000,
    revenusConjoint: 1000,
    ageVous: 60,
    ageConjoint: 30,
    santeVous: "notable",
    santeConjoint: "severe",
  })
  const original = pc({
    revenusVous: 1000,
    revenusConjoint: 3000,
    ageVous: 30,
    ageConjoint: 60,
    santeVous: "severe",
    santeConjoint: "notable",
  })
  t.eq(
    "échanger les deux conjoints ne change que le sens du versement",
    [miroir.fourchetteBasse, miroir.montant, miroir.fourchetteHaute],
    [original.fourchetteBasse, original.montant, original.fourchetteHaute]
  )
  t.eq("… et le sens, lui, s'inverse bien", [original.vousCreancier, miroir.vousCreancier], [true, false])

  t.eq("écart d'un euro sur un an — le calcul descend jusqu'au dernier euro", pc({
    revenusVous: 1000,
    revenusConjoint: 1001,
    anneesMariage: 1,
  }), {
    montant: 11,
    fourchetteBasse: 2,
    fourchetteHaute: 19,
    vousCreancier: true,
    diffMensuel: 1,
  })
  t.eq(
    "revenus très élevés — aucun plafond",
    pc({ revenusVous: 0, revenusConjoint: 1_000_000 }).fourchetteHaute,
    20_000_000
  )

  // La borne basse encaisse le facteur le plus défavorable possible :
  // créancier jeune (−20 %) et débiteur gravement atteint (−20 %). Elle ne
  // doit ni passer sous zéro, ni dépasser la borne haute.
  const variantes = []
  for (const age of [18, 25, 45, 65, 90]) {
    for (const enfants of [0, 1, 4]) {
      for (const sVous of Object.keys(HEALTH_LABELS)) {
        for (const sConjoint of Object.keys(HEALTH_LABELS)) {
          for (const annees of [0, 1, 9.6, 10, 40]) {
            for (const rv of [0, 1000, 3000]) {
              variantes.push({
                ageVous: age,
                ageConjoint: age,
                enfants,
                santeVous: sVous,
                santeConjoint: sConjoint,
                revenusVous: rv,
                revenusConjoint: 3000,
                anneesMariage: annees,
              })
            }
          }
        }
      }
    }
  }
  await t.each("aucune fourchette négative, absurde ou illisible", variantes, (v) => {
    const r = pc(v)
    const vals = [r.fourchetteBasse, r.montant, r.fourchetteHaute]
    if (!vals.every(Number.isFinite)) return `${JSON.stringify(v)} : montant illisible`
    if (!vals.every((n) => n >= 0)) return `${JSON.stringify(v)} : montant négatif`
    if (!vals.every(Number.isInteger)) return `${JSON.stringify(v)} : montant à centimes`
    if (r.fourchetteBasse > r.fourchetteHaute) return `${JSON.stringify(v)} : fourchette inversée`
    if (r.montant < r.fourchetteBasse || r.montant > r.fourchetteHaute) {
      return `${JSON.stringify(v)} : ${r.montant} hors de sa propre fourchette`
    }
    return true
  })

  // ────────────────────────────────────────────────────────────────────────
  t.section("prestation — l'âge non assaini")

  // DÉFAUT RÉEL, épinglé tel quel et non corrigé (c'est du droit, l'arbitrage
  // appartient à un humain). Contrairement aux revenus, aux années et aux
  // enfants, `ageVous` et `ageConjoint` ne passent par aucun `Number(x) || 0`.
  // Un champ vide se propage donc en NaN à travers `Math.max(0, Math.round())`
  // — car `Math.max(0, NaN)` vaut NaN — et ressort en montant. Le plancher
  // max(0, …) protège du négatif, pas de l'illisible.
  await t.each(
    "un âge absent ou illisible ressort en montant illisible (défaut connu)",
    [undefined, Number.NaN, "quarante"],
    (age) => {
      const r = pc({ ageVous: age })
      return (
        Number.isNaN(r.montant) ||
        `âge ${JSON.stringify(age)} donne ${r.montant} au lieu de NaN — le défaut a été corrigé, mets à jour cette garde`
      )
    }
  )
  // `null` est le cas le plus traître de la même famille : il ne produit pas
  // de NaN visible, il s'arithmétise en 0. Le créancier est alors réputé avoir
  // zéro an, le correctif d'âge tombe sur son plancher de −20 %, et le site
  // affiche un montant parfaitement crédible mais faux, sans rien signaler.
  t.eq(
    "un âge nul est lu comme « zéro an » et rabote 20 % en silence",
    facteur({ ageVous: null }),
    0.8
  )
  // Le côté débiteur n'est pas mieux loti : c'est l'âge du CRÉANCIER qui est
  // lu, quel que soit celui des deux conjoints que ce soit.
  t.ok(
    "… y compris quand c'est le conjoint qui est créancier",
    Number.isNaN(pc({ revenusVous: 5000, ageConjoint: undefined }).montant),
    "l'âge du conjoint créancier ne se propage plus — le défaut a été corrigé"
  )

  // ────────────────────────────────────────────────────────────────────────
  t.section("le formatage")

  // Les espaces de l'affichage français ne sont pas des espaces ordinaires :
  // fine insécable (U+202F) entre les milliers, insécable (U+00A0) devant le
  // symbole. Elles sont écrites en échappement parce qu'un copier-coller les
  // remplace silencieusement par une espace normale — et que le montant
  // passerait alors à la ligne au milieu du chiffre.
  const FINE = "\u202f"
  const INSEC = "\u00a0"

  t.eq("pension — un montant rond n'a pas de centimes", formatEuro(270), `270${INSEC}€`)
  t.eq("pension — un montant à centimes les garde", formatEuro(316.98), `316,98${INSEC}€`)
  t.eq("pension — zéro", formatEuro(0), `0${INSEC}€`)
  t.eq(
    "pension — les milliers sont séparés par une fine insécable",
    formatEuro(179882.64),
    `179${FINE}882,64${INSEC}€`
  )
  t.eq("pension — un demi-centime affiche ses deux décimales", formatEuro(12345.5), `12${FINE}345,50${INSEC}€`)

  t.eq("prestation — un capital n'a jamais de centimes", formatEuroCapital(12345), `12${FINE}345${INSEC}€`)
  t.eq("prestation — et les décimales sont arrondies", formatEuroCapital(12345.6), `12${FINE}346${INSEC}€`)
  t.eq("prestation — zéro", formatEuroCapital(0), `0${INSEC}€`)
  t.eq("prestation — million", formatEuroCapital(1_000_000), `1${FINE}000${FINE}000${INSEC}€`)

  // Ce que le justiciable lit vraiment, bout à bout.
  t.eq(
    "affichage complet d'une pension",
    formatEuro(pa(3000, 1, "classique").montantMensuel),
    `316,98${INSEC}€`
  )
  t.eq(
    "affichage complet d'une fourchette de prestation",
    `${formatEuroCapital(pc().fourchetteBasse)} – ${formatEuroCapital(pc().fourchetteHaute)}`,
    `38${FINE}400${INSEC}€ – 40${FINE}000${INSEC}€`
  )
})

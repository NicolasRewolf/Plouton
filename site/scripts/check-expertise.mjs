#!/usr/bin/env node
/**
 * Épingle l'interprétation du contenu d'expertise (`src/lib/expertise-content.ts`).
 *
 * Les 15 pages d'expertise viennent d'un JSON moissonné du site Wix. Des
 * heuristiques décident de ce qu'est chaque section — une grille d'affaires,
 * une liste d'étapes, des définitions, de la prose — et ces décisions étaient
 * enfouies dans un composant React de 700 lignes : impossible de savoir ce
 * qu'une section devenait sans monter un arbre.
 *
 * Cette garde exécute ces décisions sur le VRAI contenu et les affiche. Le
 * tableau qu'elle imprime n'est pas un ornement : c'est la réponse à
 * « qu'est-ce que le site croit lire ? », et c'est la raison d'être de la
 * garde autant que ses deux vérifications. On la lit avant de la croire.
 *
 * Ce qu'elle prouve ensuite tient en deux phrases :
 *
 *   1. Chaque expertise produit au moins une section interprétable. Zéro
 *      section retenue sur des sections présentes, c'est du contenu perdu
 *      quelque part entre le JSON et l'affichage — la page reste en ligne,
 *      simplement vide.
 *
 *   2. Aucun lien interne ne pointe vers rien. Ces liens sont une table
 *      `(phrase → URL)` saisie à la main : rien ne les valide au rendu, un
 *      href fautif ne se voit qu'en cliquant.
 *
 * Usage : (depuis site/) npm run check:expertise
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, "..", "..")
const DIR = path.join(ROOT, "contenu", "expertises")

const { chooseSectionLayout, isTelHref, makeLinkResolver, normalizeBlocks } =
  await import(path.join(here, "..", "src", "lib", "expertise-content.ts"))

/**
 * Un href est plausible s'il mène quelque part depuis n'importe quelle page :
 * chemin absolu, ancre, numéro composable, ou URL externe. « contact » tout
 * court est relatif à la page courante — depuis /expertises/divorce il vise
 * /expertises/contact, qui n'existe pas.
 *
 * `isTelHref` vient du module : sur ce cas-là au moins, le site et la garde
 * lisent la même règle. Le reste de la liste appartient à la garde, faute
 * d'une notion d'« href plausible » côté site — c'est la seule chose ici qui
 * soit réénoncée plutôt qu'importée.
 */
function hrefPlausible(href) {
  if (!href) return false
  return (
    isTelHref(href) ||
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("http")
  )
}

/**
 * Fait lire une expertise au site, et note ce qu'il en retient.
 *
 * Le résolveur est construit une fois par page, comme au rendu : il porte la
 * mémoire de ce qui a déjà été lié, et ne lie une expression qu'à sa première
 * occurrence. Le compter page par page est donc le seul décompte fidèle.
 */
function lire(fichier) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, fichier), "utf8"))
  const sections = data.sections || []
  const resolveur = makeLinkResolver(data.inlineLinks || [])

  const kinds = []
  let mots = 0
  let liens = 0

  for (const section of sections) {
    const blocs = normalizeBlocks(section.blocks || [])
    if (!blocs.length) continue
    kinds.push(chooseSectionLayout(blocs).kind)

    for (const b of blocs) {
      const texte = `${b.heading || ""} ${b.body || ""}`
      mots += texte.split(/\s+/).filter(Boolean).length
      for (const part of resolveur.resolve(texte)) if (part.href) liens++
    }
  }

  return {
    nom: fichier.replace(".json", ""),
    sections: sections.length,
    kinds,
    mots,
    liens,
    inlineLinks: (data.inlineLinks || []).map((l) => ({
      expertise: fichier,
      text: l.text,
      href: l.href,
    })),
  }
}

/** Une ligne du tableau : ce que le site a retenu de cette expertise. */
function ligne(l) {
  const dispositions = [...new Set(l.kinds)].join(", ")
  return (
    `  ${l.nom.slice(0, 46).padEnd(48)}` +
    `${String(l.kinds.length).padStart(2)} sur ${l.sections} sections · ` +
    `${String(l.mots).padStart(5)} mots · ` +
    `${String(l.liens).padStart(3)} liens · ${dispositions}`
  )
}

await garde("interprétation des expertises", async (t) => {
  const fichiers = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
  const lectures = fichiers.map(lire)

  // ── Le relevé. Rien n'est vérifié ici, tout est montré. Une expertise qui
  // perd la moitié de ses sections, ou dont les mots fondent d'une livraison à
  // l'autre, se voit dans ce tableau bien avant qu'une assertion la rattrape.
  t.section("ce que le site croit lire")
  console.log(`\n  ${lectures.length} expertises\n`)
  for (const l of lectures) console.log(ligne(l))

  const compte = {}
  for (const l of lectures)
    for (const k of l.kinds) compte[k] = (compte[k] || 0) + 1
  console.log("\n  dispositions retenues sur l'ensemble du corpus :")
  for (const [k, v] of Object.entries(compte).sort((a, b) => b[1] - a[1]))
    console.log(`    ${k.padEnd(18)} ${v}`)
  console.log("")

  t.section("interprétation")
  await t.each(
    "chaque expertise produit au moins une section interprétable",
    lectures,
    (l) =>
      l.kinds.length > 0 ||
      (l.sections
        ? `${l.nom} : ${l.sections} sections, 0 interprétée`
        : `${l.nom} : aucune section`)
  )

  t.section("liens internes")
  const liens = lectures.flatMap((l) => l.inlineLinks)
  await t.each(
    "aucun href malformé",
    liens,
    (l) =>
      hrefPlausible(l.href) ||
      `${l.expertise} : « ${l.text} » → href suspect « ${l.href} »`
  )
})

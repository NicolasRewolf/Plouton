#!/usr/bin/env node
/**
 * Le corpus migré de Wix ne doit pas diverger de son convertisseur.
 *
 * Les 422 articles existent sous deux formes sur le disque : le document Ricos
 * d'origine (`contenu/ricos/`, ce que Wix nous a rendu) et le document TipTap
 * qu'on en a tiré une fois pour toutes (`contenu/body-docs/`, ce que le site
 * sert). Le second a été produit par `scripts/lib/ricos-to-pm.mjs`.
 *
 * D'où le danger : le convertisseur continue de vivre — on lui ajoute un type
 * de nœud, on corrige un attribut — pendant que les 422 documents convertis
 * dorment, figés. Rien, dans le site, ne relit les Ricos. Une modification du
 * convertisseur peut donc rendre le corpus stocké faux sans qu'aucune page ne
 * change d'un pixel : la faute ne se verrait qu'à la prochaine réimportation.
 *
 * Cette garde relance la conversion des 422 Ricos et exige trois choses du
 * résultat, de la plus stricte à la plus grossière :
 *
 *   1. le document reconverti est IDENTIQUE à celui qui est stocké ;
 *   2. le texte brut survit à la conversion (aucun bloc de prose perdu) ;
 *   3. les comptages par type se correspondent — autant de TABLE en Ricos que
 *      de `table` en TipTap, et ainsi de suite.
 *
 * La première suffirait en théorie. Les deux autres restent parce qu'elles
 * disent OÙ ça casse : une égalité qui échoue sur 422 articles n'apprend rien,
 * « IMAGE 1 204 ≠ 1 198 » désigne le convertisseur d'images.
 *
 * Le 422 est écrit en dur, et c'est voulu : ce n'est pas « le nombre d'articles
 * du blog » mais la taille figée du corpus migré. Il ne bouge pas.
 *
 * Usage : node scripts/check-body-docs.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { garde } from "./lib/garde.mjs"
import {
  ricosToProseMirror,
  pmPlainText,
  ricosPlainText,
  countPmTypes,
  countRicosTypes,
  deepEqual,
} from "./lib/ricos-to-pm.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const RICOS_DIR = path.join(ROOT, "contenu", "ricos")
const DOCS_DIR = path.join(ROOT, "contenu", "body-docs")

/** Taille figée du corpus migré depuis Wix — pas un compteur d'articles. */
const EXPECTED = 422

/** Les types dont la conversion est un simple renommage, un pour un. */
const CORRESPONDANCES = [
  { ricos: "TABLE", pm: "table" },
  { ricos: "TABLE_CELL", pm: "tableCell" },
  { ricos: "IMAGE", pm: "image" },
  { ricos: "COLLAPSIBLE_ITEM", pm: "details" },
  { ricos: "GALLERY", pm: "gallery" },
  { ricos: "BUTTON", pm: "ctaButton" },
  { ricos: "DIVIDER", pm: "horizontalRule" },
  { ricos: "LINK_PREVIEW", pm: "linkPreview" },
]

function fichiersJson(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
}

/**
 * Compte les nœuds HTML que le convertisseur va réellement produire.
 *
 * Wix stocke deux formes sous le même type : du markup inline (`html`) et une
 * URL d'embed distant (`url` — un replay TF1, par exemple). Le convertisseur
 * rend un `htmlEmbed` dans les deux cas et laisse tomber les nœuds qui n'ont
 * ni l'un ni l'autre. Comparer le brut au converti dirait donc faux.
 *
 * Cette condition est la seule règle que la garde réénonce au lieu de
 * l'importer : `ricos-to-pm.mjs` la tient dans son `case "HTML"` sans
 * l'exposer. À déplacer là-bas le jour où ce module s'ouvre.
 */
function compterHtmlConvertibles(nodes) {
  let n = 0
  for (const node of nodes || []) {
    if (
      node.type === "HTML" &&
      ((node.htmlData?.html || "").trim() || (node.htmlData?.url || "").trim())
    ) {
      n++
    }
    if (node.nodes) n += compterHtmlConvertibles(node.nodes)
  }
  return n
}

/**
 * Le texte a-t-il survécu ?
 *
 * On ne compare pas les textes caractère à caractère : la conversion
 * renormalise les espaces et la ponctuation, un écart de quelques signes est
 * normal. Ce qu'on traque, c'est la perte d'un BLOC — un encadré, une liste,
 * une moitié d'article tombée parce qu'un type de nœud n'est pas géré.
 *
 * D'où la double condition : il faut à la fois une proportion nettement
 * dégradée (moins de 85 % du plus long) et un écart absolu qui dépasse 15 % du
 * texte source, plancher à 200 caractères. Le plancher protège les articles
 * courts, où 15 % ne pèsent rien.
 */
function ecartDeTexte(slug, ricos, pm) {
  const rLen = ricosPlainText(ricos).length
  const pLen = pmPlainText(pm).length
  const minLen = Math.min(rLen, pLen)
  const maxLen = Math.max(rLen, pLen)
  const ratio = maxLen === 0 ? 1 : minLen / maxLen
  const absDiff = Math.abs(rLen - pLen)
  const seuil = Math.max(200, Math.floor(rLen * 0.15))
  if (ratio >= 0.85 || absDiff <= seuil) return null
  return `${slug} : ratio=${ratio.toFixed(3)} ricos=${rLen} pm=${pLen} écart=${absDiff} (seuil ${seuil})`
}

await garde("corpus migré — 422 ricos ↔ 422 body-docs", async (t) => {
  const ricosFiles = fichiersJson(RICOS_DIR)
  const docFiles = fichiersJson(DOCS_DIR)
  const ricosSet = new Set(ricosFiles)
  const docsSet = new Set(docFiles)

  t.section("appariement")
  t.eq("documents ricos sur le disque", ricosFiles.length, EXPECTED)
  t.eq("documents body-doc sur le disque", docFiles.length, EXPECTED)
  await t.each("chaque ricos a son body-doc", ricosFiles, (f) =>
    docsSet.has(f) || `${f} — body-doc manquant`
  )
  await t.each("aucun body-doc orphelin", docFiles, (f) =>
    ricosSet.has(f) || `${f} — pas de ricos correspondant`
  )

  // Une seule passe de lecture : 26 Mo de JSON, on ne les relit pas trois fois.
  // Elle ne retient que les verdicts, pas les documents — les trois `each` qui
  // suivent ne font plus que rapporter.
  const ricosTotals = {}
  const pmTotals = {}
  let htmlConvertibles = 0
  const dossiers = []

  for (const file of ricosFiles) {
    if (!docsSet.has(file)) continue

    const brut = JSON.parse(fs.readFileSync(path.join(RICOS_DIR, file), "utf8"))
    const ricos = brut.ricos || brut
    const slug = brut.slug || file.replace(/\.json$/, "")

    let reconverti
    try {
      reconverti = ricosToProseMirror(ricos)
    } catch (err) {
      dossiers.push({ slug, erreur: `${slug} — conversion échouée : ${err.message}` })
      continue
    }

    const stocke = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, file), "utf8"))

    for (const [k, v] of Object.entries(countRicosTypes(ricos))) {
      ricosTotals[k] = (ricosTotals[k] || 0) + v
    }
    for (const [k, v] of Object.entries(countPmTypes(reconverti))) {
      pmTotals[k] = (pmTotals[k] || 0) + v
    }
    htmlConvertibles += compterHtmlConvertibles(ricos.nodes)

    dossiers.push({
      slug,
      erreur: null,
      derive: deepEqual(reconverti, stocke) ? null : slug,
      ecartTexte: ecartDeTexte(slug, ricos, reconverti),
    })
  }

  const convertis = dossiers.filter((d) => !d.erreur)

  t.section("reconversion")
  await t.each("la conversion du ricos aboutit", dossiers, (d) => d.erreur ?? true)
  await t.each(
    "le body-doc stocké est exactement la reconversion d'aujourd'hui",
    convertis,
    (d) => d.derive ?? true
  )
  t.eq("articles effectivement comparés", convertis.length, EXPECTED)

  t.section("texte")
  await t.each("aucun bloc de prose perdu à la conversion", convertis, (d) =>
    d.ecartTexte ?? true
  )

  t.section("comptages par type")
  for (const c of CORRESPONDANCES) {
    t.eq(`${c.ricos} → ${c.pm}`, pmTotals[c.pm] || 0, ricosTotals[c.ricos] || 0)
  }

  const htmlBruts = ricosTotals.HTML || 0
  t.eq(
    `HTML → htmlEmbed (${htmlBruts} bruts, ${htmlBruts - htmlConvertibles} vides ignorés)`,
    pmTotals.htmlEmbed || 0,
    htmlConvertibles
  )

  const yt = pmTotals.youtube || 0
  const embed = pmTotals.videoEmbed || 0
  t.eq(
    `VIDEO → youtube + videoEmbed (youtube ${yt}, autres ${embed})`,
    yt + embed,
    ricosTotals.VIDEO || 0
  )
})

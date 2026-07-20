#!/usr/bin/env node
/**
 * CI gate P1-C — brief #18 §3 étape 4.
 * Vérifie 422 ricos ↔ 422 body-docs : types globaux + texte normalisé + égalité conversion.
 * Exit 1 si échec, 0 si OK.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
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
const EXPECTED = 422

const failures = []
const textFailures = []
const driftFailures = []

function fail(msg) {
  failures.push(msg)
}

const ricosFiles = fs.existsSync(RICOS_DIR)
  ? fs.readdirSync(RICOS_DIR).filter((f) => f.endsWith(".json")).sort()
  : []
const docFiles = fs.existsSync(DOCS_DIR)
  ? fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".json")).sort()
  : []

console.log(`=== check-body-docs (P1-C) ===`)
console.log(`ricos=${ricosFiles.length} body-docs=${docFiles.length} (attendu ${EXPECTED})`)

if (ricosFiles.length !== EXPECTED) {
  fail(`Attendu ${EXPECTED} fichiers ricos, trouvé ${ricosFiles.length}`)
}
if (docFiles.length !== EXPECTED) {
  fail(`Attendu ${EXPECTED} fichiers body-docs, trouvé ${docFiles.length}`)
}

const ricosSet = new Set(ricosFiles)
const docsSet = new Set(docFiles)
const missingDocs = ricosFiles.filter((f) => !docsSet.has(f))
const orphanDocs = docFiles.filter((f) => !ricosSet.has(f))
if (missingDocs.length) {
  fail(`body-docs manquants (${missingDocs.length}): ${missingDocs.slice(0, 5).join(", ")}`)
}
if (orphanDocs.length) {
  fail(`body-docs orphelins (${orphanDocs.length}): ${orphanDocs.slice(0, 5).join(", ")}`)
}

const ricosTotals = {}
const pmTotals = {}
/**
 * Un nœud HTML est convertible s'il porte du markup inline (`html`) OU une
 * `url` d'embed distant (Wix stocke les deux formes — ex. un replay TF1).
 * Seuls les nœuds sans l'un ni l'autre sont réellement vides.
 */
let convertibleHtml = 0
let compared = 0

function countConvertibleHtml(nodes) {
  let n = 0
  for (const node of nodes || []) {
    if (
      node.type === "HTML" &&
      ((node.htmlData?.html || "").trim() || (node.htmlData?.url || "").trim())
    )
      n++
    if (node.nodes) n += countConvertibleHtml(node.nodes)
  }
  return n
}

for (const file of ricosFiles) {
  if (!docsSet.has(file)) continue

  const raw = JSON.parse(fs.readFileSync(path.join(RICOS_DIR, file), "utf8"))
  const ricos = raw.ricos || raw
  const slug = raw.slug || file.replace(/\.json$/, "")

  let fresh
  try {
    fresh = ricosToProseMirror(ricos)
  } catch (err) {
    fail(`${slug}: conversion échouée — ${err.message}`)
    continue
  }

  const stored = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, file), "utf8"))
  if (!deepEqual(fresh, stored)) {
    driftFailures.push(slug)
  }

  const rCounts = countRicosTypes(ricos)
  const pCounts = countPmTypes(fresh)
  for (const [k, v] of Object.entries(rCounts)) {
    ricosTotals[k] = (ricosTotals[k] || 0) + v
  }
  for (const [k, v] of Object.entries(pCounts)) {
    pmTotals[k] = (pmTotals[k] || 0) + v
  }
  convertibleHtml += countConvertibleHtml(ricos.nodes)

  const rt = ricosPlainText(ricos)
  const pt = pmPlainText(fresh)
  const rLen = rt.length
  const pLen = pt.length
  const minLen = Math.min(rLen, pLen)
  const maxLen = Math.max(rLen, pLen)
  const ratio = maxLen === 0 ? 1 : minLen / maxLen
  const absDiff = Math.abs(rLen - pLen)
  const threshold = Math.max(200, Math.floor(rLen * 0.15))
  if (ratio < 0.85 && absDiff > threshold) {
    textFailures.push({
      slug,
      rLen,
      pLen,
      ratio: Number(ratio.toFixed(3)),
      absDiff,
      threshold,
    })
  }

  compared++
}

if (driftFailures.length) {
  fail(
    `body-docs ≠ reconversion (${driftFailures.length}): ${driftFailures.slice(0, 8).join(", ")}`
  )
}
if (textFailures.length) {
  for (const t of textFailures.slice(0, 10)) {
    fail(
      `texte ${t.slug}: ratio=${t.ratio} rLen=${t.rLen} pLen=${t.pLen} diff=${t.absDiff} (seuil ${t.threshold})`
    )
  }
  if (textFailures.length > 10) {
    fail(`… +${textFailures.length - 10} autres échecs texte`)
  }
}

/** Assertions globales type Ricos → PM (brief §3 étape 4). */
const TYPE_ASSERTIONS = [
  { ricos: "TABLE", pm: "table" },
  { ricos: "TABLE_CELL", pm: "tableCell" },
  { ricos: "IMAGE", pm: "image" },
  { ricos: "COLLAPSIBLE_ITEM", pm: "details" },
  { ricos: "GALLERY", pm: "gallery" },
  { ricos: "BUTTON", pm: "ctaButton" },
  { ricos: "DIVIDER", pm: "horizontalRule" },
  { ricos: "LINK_PREVIEW", pm: "linkPreview" },
]

console.log("\n--- Comptages globaux ---")
for (const a of TYPE_ASSERTIONS) {
  const r = ricosTotals[a.ricos] || 0
  const p = pmTotals[a.pm] || 0
  const ok = r === p
  console.log(`${a.ricos}→${a.pm}: ricos=${r} pm=${p} ${ok ? "OK" : "FAIL"}`)
  if (!ok) fail(`Comptage ${a.ricos}→${a.pm}: ${r} ≠ ${p}`)
}

{
  const r = convertibleHtml
  const p = pmTotals.htmlEmbed || 0
  const raw = ricosTotals.HTML || 0
  const ok = r === p
  console.log(
    `HTML→htmlEmbed: convertibles=${r} pm=${p} (bruts=${raw}, vides ignorés) ${ok ? "OK" : "FAIL"}`
  )
  if (!ok) fail(`Comptage HTML→htmlEmbed: ${r} ≠ ${p}`)
}

{
  const r = ricosTotals.VIDEO || 0
  const p = (pmTotals.youtube || 0) + (pmTotals.videoEmbed || 0)
  const ok = r === p
  console.log(
    `VIDEO→youtube+videoEmbed: ricos=${r} pm=${p} (yt=${pmTotals.youtube || 0} embed=${pmTotals.videoEmbed || 0}) ${ok ? "OK" : "FAIL"}`
  )
  if (!ok) fail(`Comptage VIDEO→youtube+videoEmbed: ${r} ≠ ${p}`)
}

console.log(`\narticles comparés : ${compared}`)
console.log(`échecs texte : ${textFailures.length}`)
console.log(`dérives body-doc : ${driftFailures.length}`)

if (failures.length) {
  console.error(`\n❌ ÉCHEC (${failures.length})`)
  for (const f of failures) console.error(`  • ${f}`)
  process.exit(1)
}

console.log("\n✅ check-body-docs OK")
process.exit(0)

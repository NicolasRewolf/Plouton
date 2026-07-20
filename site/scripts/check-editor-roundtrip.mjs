#!/usr/bin/env node
/**
 * Garde-fou : ouvrir un article dans l'éditeur puis le resauvegarder ne doit
 * RIEN perdre.
 *
 * C'est la question qui décide si l'admin est sûr. Le parcours réel est :
 *   body_html (stocké)  →  parsé par le schéma TipTap  →  getHTML() (sauvegardé)
 * Si le schéma ne déclare pas un nœud, ProseMirror le supprime SILENCIEUSEMENT
 * au parsing. Ce script rejoue ce parcours sur les 422 articles et compare les
 * nœuds avant / après.
 *
 * Exit 1 si un nœud disparaît. Exit 0 sinon.
 *
 * Usage : (depuis site/) npx tsx scripts/check-editor-roundtrip.mjs [--limit N] [--verbose]
 * (tsx est requis : le script importe le schéma TypeScript réel de l'éditeur.)
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"

// Le parseur ProseMirror a besoin d'un DOM ; on l'installe avant TipTap.
const dom = new JSDOM("<!doctype html><html><body></body></html>")
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.navigator ??= dom.window.navigator

const { generateJSON, generateHTML } = await import("@tiptap/html")
// On importe le VRAI schéma de l'éditeur (pas une copie) — via tsx, qui
// résout le TypeScript et l'alias @/. Dupliquer le schéma ici rendrait le
// test aveugle à une divergence, ce qui est précisément le bug qu'il traque.
const { buildEditorExtensions } = await import(
  "../src/lib/tiptap/extensions.ts"
)
// Même définition de « perte » que la garde en ligne (API PUT) : sans ce
// partage, le test pourrait déclarer sain un nœud que la garde refuse — ou
// l'inverse.
const { TRACKED_NODE_TYPES, countNodeTypes, detectNodeLoss } = await import(
  "../src/lib/post-edit-loss.ts"
)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const HTML_DIR = path.join(ROOT, "contenu", "body-html")
const DOCS_DIR = path.join(ROOT, "contenu", "body-docs")

const args = process.argv.slice(2)
const verbose = args.includes("--verbose")
const limIdx = args.indexOf("--limit")
const limit = limIdx >= 0 ? Number(args[limIdx + 1] || 0) : 0

const TRACKED = TRACKED_NODE_TYPES

function plainText(node, out = []) {
  if (!node || typeof node !== "object") return out
  if (node.type === "text" && node.text) out.push(node.text)
  for (const child of node.content || []) plainText(child, out)
  return out
}

const norm = (parts) => parts.join(" ").replace(/\s+/g, " ").trim()

const extensions = buildEditorExtensions()
let files = fs.readdirSync(HTML_DIR).filter((f) => f.endsWith(".html")).sort()
if (limit > 0) files = files.slice(0, limit)

const lost = []
const textLoss = []
const totalsBefore = {}
const totalsAfter = {}

for (const file of files) {
  const slug = file.replace(/\.html$/, "")
  const html = fs.readFileSync(path.join(HTML_DIR, file), "utf8")

  // La référence est le body_doc STOCKÉ, pas la première ouverture : si un
  // nœud échoue à se parser dès l'ouverture, comparer ouverture↔réouverture
  // le déclarerait « stable » alors qu'il a déjà disparu.
  const docPath = path.join(DOCS_DIR, `${slug}.json`)
  if (!fs.existsSync(docPath)) continue
  const source = JSON.parse(fs.readFileSync(docPath, "utf8"))

  // 1. ouverture dans l'éditeur → 2. resauvegarde → 3. réouverture
  const opened = generateJSON(html, extensions)
  const saved = generateHTML(opened, extensions)
  const reopened = generateJSON(saved, extensions)

  const before = countNodeTypes(source)
  const after = countNodeTypes(reopened)
  for (const [k, v] of Object.entries(before))
    totalsBefore[k] = (totalsBefore[k] || 0) + v
  for (const [k, v] of Object.entries(after))
    totalsAfter[k] = (totalsAfter[k] || 0) + v

  for (const loss of detectNodeLoss(source, reopened)) lost.push({ slug, ...loss })

  const tb = norm(plainText(source))
  const ta = norm(plainText(reopened))
  if (tb.length > 200 && ta.length / tb.length < 0.995)
    textLoss.push({ slug, before: tb.length, after: ta.length })
}

console.log(`articles testés : ${files.length}`)
if (verbose) {
  console.log("\n--- nœuds (ouverture → resauvegarde) ---")
  for (const type of TRACKED) {
    const b = totalsBefore[type] || 0
    const a = totalsAfter[type] || 0
    if (b || a) {
      const verdict = a < b ? "PERTE" : a > b ? "+ (normalisation)" : "OK"
      console.log(`  ${type.padEnd(16)} ${b} → ${a} ${verdict}`)
    }
  }
}

if (lost.length || textLoss.length) {
  console.error(`\n❌ PERTE AU ROUND-TRIP`)
  for (const l of lost.slice(0, 20))
    console.error(`  • ${l.slug} : ${l.type} ${l.before} → ${l.after}`)
  if (lost.length > 20) console.error(`  … et ${lost.length - 20} autres`)
  for (const t of textLoss.slice(0, 10))
    console.error(`  • ${t.slug} : texte ${t.before} → ${t.after} car.`)
  process.exit(1)
}

console.log("\n✅ round-trip éditeur sans perte")
process.exit(0)

#!/usr/bin/env node
/**
 * P1-C — Convertit contenu/ricos/*.json → contenu/body-docs/{slug}.json
 * Convertisseur partagé : scripts/lib/ricos-to-pm.mjs
 * (miroir de site/src/lib/tiptap/ricos-to-pm.ts).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  ricosToProseMirror,
  countPmTypes,
} from "./lib/ricos-to-pm.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const RICOS = path.join(ROOT, "contenu", "ricos")
const OUT = path.join(ROOT, "contenu", "body-docs")

// Écriture par DÉFAUT (même convention que regen-body-html.mjs) : un flag
// d'écriture optionnel et silencieux faisait passer un "convertis : 422/422"
// pour une régénération alors que rien n'était écrit.
const args = process.argv.slice(2)
const dry = args.includes("--dry-run")
const write = !dry
const limIdx = args.indexOf("--limit")
const limit = limIdx >= 0 ? Number(args[limIdx + 1] || 0) : 0

let files = fs.readdirSync(RICOS).filter((f) => f.endsWith(".json")).sort()
if (limit > 0) files = files.slice(0, limit)

if (write) fs.mkdirSync(OUT, { recursive: true })

let ok = 0
const totals = {}
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(RICOS, file), "utf8"))
  const slug = raw.slug || file.replace(/\.json$/, "")
  const doc = ricosToProseMirror(raw.ricos || raw)
  const counts = countPmTypes(doc)
  for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v
  ok++
  if (write) {
    fs.writeFileSync(
      path.join(OUT, `${slug}.json`),
      JSON.stringify(doc, null, 0) + "\n"
    )
  }
}

console.log(`convertis : ${ok}/${files.length}`)
console.log("types PM :", Object.keys(totals).sort().join(", "))
if (write) console.log(`écrits → ${path.relative(ROOT, OUT)}/`)

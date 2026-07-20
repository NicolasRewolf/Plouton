#!/usr/bin/env node
/**
 * Régénère le cache `contenu/body-html/` depuis `contenu/body-docs/`.
 *
 * Utilise le VRAI renderer du site (`src/lib/tiptap/body-doc.ts`, qui rend via
 * le schéma TipTap partagé). C'est structurel, pas cosmétique : tant que ce
 * script avait son propre renderer, il pouvait produire un HTML que l'éditeur
 * ne savait pas relire — c'est ce qui faisait disparaître les vidéos à la
 * réouverture (il émettait un `<iframe>` nu là où le schéma attend
 * `div[data-type="video-embed"] iframe`).
 *
 * Écrit par défaut ; `--dry-run` pour prévisualiser.
 * Usage : (depuis site/) npx tsx scripts/regen-body-html.mjs [--dry-run] [--limit N]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"

// Le renderer TipTap a besoin d'un DOM.
const dom = new JSDOM("<!doctype html><html><body></body></html>")
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.navigator ??= dom.window.navigator

const { bodyDocToHtml } = await import("../src/lib/tiptap/body-doc.ts")

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const DOCS = path.join(ROOT, "contenu", "body-docs")
const OUT = path.join(ROOT, "contenu", "body-html")

const args = process.argv.slice(2)
const dry = args.includes("--dry-run")
const write = !dry
const limIdx = args.indexOf("--limit")
const limit = limIdx >= 0 ? Number(args[limIdx + 1] || 0) : 0

let files = fs.readdirSync(DOCS).filter((f) => f.endsWith(".json")).sort()
if (limit > 0) files = files.slice(0, limit)
if (write) fs.mkdirSync(OUT, { recursive: true })

let ok = 0
let empty = 0
for (const file of files) {
  const slug = file.replace(/\.json$/, "")
  const doc = JSON.parse(fs.readFileSync(path.join(DOCS, file), "utf8"))
  const html = bodyDocToHtml(doc)
  if (!html || html === "<p></p>") empty++
  if (write) fs.writeFileSync(path.join(OUT, `${slug}.html`), html + "\n")
  ok++
}

console.log(`rendus : ${ok}/${files.length}${empty ? ` · vides : ${empty}` : ""}`)
if (write) console.log(`écrits → ${path.relative(ROOT, OUT)}/`)
if (empty) {
  console.error(`\n❌ ${empty} corps vide(s) — un body_doc est illisible.`)
  process.exit(1)
}

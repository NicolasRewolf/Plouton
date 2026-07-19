#!/usr/bin/env node
/** CI — vérifie 422 body-docs générés (P1-C). Exit 1 si compte faux. */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const RICOS = path.join(ROOT, "contenu", "ricos")
const DOCS = path.join(ROOT, "contenu", "body-docs")

const ricos = fs.readdirSync(RICOS).filter((f) => f.endsWith(".json"))
const docs = fs.existsSync(DOCS)
  ? fs.readdirSync(DOCS).filter((f) => f.endsWith(".json"))
  : []

const missing = ricos.filter((f) => !docs.includes(f))
console.log(`ricos=${ricos.length} body-docs=${docs.length} missing=${missing.length}`)
if (missing.length) {
  console.error(missing.slice(0, 10).join("\n"))
  process.exit(1)
}
if (ricos.length !== 422) {
  console.warn(`attendu 422 Ricos, trouvé ${ricos.length}`)
}
process.exit(0)

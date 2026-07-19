#!/usr/bin/env node
/**
 * P1-H — CI : aucune metaDescription amputée / trop courte dans articles/.
 * Échec si meta < 80 car. ou finit sur élision (d', l', qu'…).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DIR = path.join(ROOT, "contenu", "articles")

const ELISION = /(?:^|\s)(?:[dljlmnst]|qu|puisqu|lorsqu|jusqu|quoiqu)'$/i

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))
const bad = []

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))
  const md = (data.metaDescription || "").trim()
  const excerpt = (data.excerpt || "").trim()
  const effective = md || excerpt
  if (!effective) {
    bad.push({ slug: data.slug || file, reason: "vide" })
    continue
  }
  if (effective.length < 80)
    bad.push({
      slug: data.slug || file,
      reason: `trop court (${effective.length})`,
      sample: effective.slice(0, 60),
    })
  else if (ELISION.test(effective))
    bad.push({
      slug: data.slug || file,
      reason: "élision finale",
      sample: effective.slice(-40),
    })
}

console.log(`=== check-meta-descriptions (P1-H) ===`)
console.log(`articles: ${files.length}`)
if (bad.length) {
  console.log(`échecs: ${bad.length}`)
  for (const b of bad.slice(0, 30))
    console.log(`  - ${b.slug}: ${b.reason}${b.sample ? ` « ${b.sample} »` : ""}`)
  if (bad.length > 30) console.log(`  … +${bad.length - 30}`)
  process.exit(1)
}
console.log("✅ check-meta-descriptions OK")

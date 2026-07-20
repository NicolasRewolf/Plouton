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
 * Ce script exécute ces décisions sur le VRAI contenu et les affiche. Il
 * échoue si une section perd son texte, si une expertise cesse d'être
 * interprétable, ou si un lien interne pointe vers rien.
 *
 * Ce n'est pas un test de non-régression figé : c'est une lecture. Le tableau
 * qu'il imprime est la réponse à « qu'est-ce que le site croit lire ? ».
 *
 * Usage : (depuis site/) npm run check:expertise
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, "..", "..")
const DIR = path.join(ROOT, "contenu", "expertises")

const { chooseSectionLayout, makeLinkResolver, normalizeBlocks } = await import(
  path.join(here, "..", "src", "lib", "expertise-content.ts")
)

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()
const tally = {}
let failed = 0
const problems = []

console.log(`\n  ${files.length} expertises\n`)
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))
  const sections = data.sections || []
  const resolver = makeLinkResolver(data.inlineLinks || [])

  const kinds = []
  let words = 0
  let linked = 0

  for (const section of sections) {
    const blocks = normalizeBlocks(section.blocks || [])
    if (!blocks.length) continue
    const layout = chooseSectionLayout(blocks)
    kinds.push(layout.kind)
    tally[layout.kind] = (tally[layout.kind] || 0) + 1

    for (const b of blocks) {
      const text = `${b.heading || ""} ${b.body || ""}`
      words += text.split(/\s+/).filter(Boolean).length
      for (const part of resolver.resolve(text)) if (part.href) linked++
    }
  }

  // Une expertise qui ne produit aucune section interprétable a perdu son
  // contenu quelque part entre le JSON et l'affichage.
  if (sections.length && !kinds.length) {
    failed++
    problems.push(`${file} : ${sections.length} sections, 0 interprétée`)
  }

  const uniq = [...new Set(kinds)].join(", ")
  console.log(
    `  ${file.replace(".json", "").slice(0, 46).padEnd(48)} ` +
      `${String(kinds.length).padStart(2)} sections · ${String(words).padStart(5)} mots · ` +
      `${String(linked).padStart(3)} liens · ${uniq}`
  )

  // Un lien interne doit pointer quelque part de plausible.
  for (const l of data.inlineLinks || []) {
    if (!l.href || (!l.href.startsWith("/") && !l.href.startsWith("#") && !l.href.startsWith("tel:") && !l.href.startsWith("http"))) {
      failed++
      problems.push(`${file} : lien « ${l.text} » → href suspect « ${l.href} »`)
    }
  }
}

console.log("\n  dispositions retenues sur l'ensemble du corpus :")
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1]))
  console.log(`    ${k.padEnd(18)} ${v}`)

if (failed) {
  console.error(`\n❌ ${failed} problème(s) :`)
  for (const p of problems.slice(0, 10)) console.error("   ", p)
  process.exit(1)
}
console.log("\n✅ interprétation des expertises lisible et complète")

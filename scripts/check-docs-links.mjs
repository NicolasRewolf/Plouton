#!/usr/bin/env node
/**
 * Empêche la documentation de repourrir.
 *
 * Deux causes ont produit l'essentiel des 231 affirmations fausses trouvées à
 * l'audit du 20/07 :
 *   1. des liens relatifs vers des fichiers déplacés ou supprimés ;
 *   2. des documents qui citent des modules `src/lib/...` qui n'existent plus
 *      (`ricos/`, `post-edit-guard`, `PostCard`).
 *
 * Ce script attrape les deux. Il ne juge pas la prose — seulement ce qui est
 * vérifiable mécaniquement.
 *
 * `docs/archive/` est exempté : ces documents décrivent un passé, ils ont le
 * droit de citer des fichiers morts. C'est même leur rôle.
 *
 * Usage : node scripts/check-docs-links.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** Tout le markdown du projet, hors dépendances et outillage tiers. */
function listMarkdown(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", ".claude", ".agents"].includes(entry.name))
      continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listMarkdown(full, out)
    else if (entry.name.endsWith(".md")) out.push(full)
  }
  return out
}

const problems = []
const files = listMarkdown(ROOT)

for (const file of files) {
  const rel = path.relative(ROOT, file)
  // L'archive décrit un passé : elle a le droit de citer des fichiers morts et
  // des chemins d'avant la réorganisation. C'est même son rôle.
  const isArchive = rel.includes(`archive${path.sep}`)
  // Ces deux-là RECENSENT les suppressions : les leur reprocher serait absurde.
  const documenteLesMorts =
    rel === "CHANGELOG.md" || rel.endsWith("modules-canoniques.md")
  const text = fs.readFileSync(file, "utf8")

  // 1. liens relatifs cassés
  if (isArchive) continue
  for (const [, label, target] of text.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue
    const clean = target.split("#")[0].trim()
    if (!clean) continue
    const resolved = clean.startsWith("/")
      ? path.join(ROOT, clean)
      : path.resolve(path.dirname(file), clean)
    if (!fs.existsSync(resolved))
      problems.push(`${rel} → lien mort « ${label} » vers ${clean}`)
  }

  // 2. modules cités qui n'existent plus
  if (documenteLesMorts) continue
  for (const [, cited] of text.matchAll(/`(site\/src\/[^`\s]+\.tsx?)`/g)) {
    if (!fs.existsSync(path.join(ROOT, cited)))
      problems.push(`${rel} → cite ${cited}, qui n'existe pas`)
  }

  // 3. noms explicitement retirés — voir docs/socle/modules-canoniques.md
  const MORTS = [
    "PostCard.tsx",
    "post-edit-guard",
    "src/lib/ricos/",
    "forceRichEdit",
    "resolvePostBodyMode",
  ]
  for (const mort of MORTS)
    if (text.includes(mort))
      problems.push(`${rel} → cite « ${mort} », supprimé (cf. socle/modules-canoniques.md)`)
}

console.log(`  ${files.length} documents inspectés`)
if (problems.length) {
  console.error(`\n❌ ${problems.length} problème(s) :\n`)
  for (const p of problems) console.error("   " + p)
  process.exit(1)
}
console.log("\n✅ liens et références de code valides")

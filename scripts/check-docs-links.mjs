#!/usr/bin/env node
/**
 * Empêche la documentation de repourrir.
 *
 * L'audit du 20/07 a relevé 231 affirmations fausses dans les documents du
 * dépôt. Deux causes en expliquent l'essentiel, et l'une comme l'autre se
 * confronte au disque sans rien interpréter :
 *
 *   1. des liens relatifs vers des fichiers déplacés ou supprimés ;
 *   2. des documents qui citent des modules `site/src/...` disparus
 *      (`ricos/`, `post-edit-guard`, `PostCard`).
 *
 * Cette garde attrape ces deux-là, et rien d'autre. Elle ne juge pas la prose :
 * une phrase peut mentir sans qu'aucun chemin ne soit faux, et ce n'est pas ce
 * qu'on sait vérifier mécaniquement.
 *
 * Deux exemptions, l'une et l'autre méritées :
 *   · `docs/archive/` décrit un passé. Y citer des fichiers morts est son rôle,
 *     pas son défaut — l'archive est donc écartée des trois familles.
 *   · `CHANGELOG.md` et `modules-canoniques.md` RECENSENT les suppressions.
 *     Leur reprocher de nommer ce qu'ils enterrent serait absurde : ils gardent
 *     la vérification des liens, ils perdent celle des modules cités.
 *
 * La liste MORTS reste ici, et c'est délibéré. Ailleurs, une garde importe la
 * règle qu'elle vérifie plutôt que de la recopier ; mais ces cinq noms ne sont
 * pas une règle du site — ce ne sont pas des fichiers dont on constaterait
 * l'absence, ce sont des noms qu'on a décidé de ne plus jamais relire. Aucun
 * module de `site/src/lib` ne peut les fournir : ils n'y existent plus.
 *
 * Usage : node scripts/check-docs-links.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { garde } from "./lib/garde.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/**
 * Noms explicitement retirés — voir docs/socle/modules-canoniques.md.
 * Donnée propre à cette garde (cf. l'en-tête) : elle ne se dérive de rien.
 */
const MORTS = [
  "PostCard.tsx",
  "post-edit-guard",
  "src/lib/ricos/",
  "forceRichEdit",
  "resolvePostBodyMode",
]

/** Tout le markdown du projet, hors dépendances et outillage tiers. */
function listeMarkdown(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", ".claude", ".agents"].includes(entry.name))
      continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listeMarkdown(full, out)
    else if (entry.name.endsWith(".md")) out.push(full)
  }
  return out
}

/**
 * Les documents à inspecter, chacun avec son texte et ses exemptions.
 * L'archive est retirée d'emblée : aucune des trois familles ne la concerne.
 */
function documents() {
  return listeMarkdown(ROOT)
    .map((fichier) => ({
      fichier,
      rel: path.relative(ROOT, fichier),
      texte: fs.readFileSync(fichier, "utf8"),
    }))
    .filter((d) => !d.rel.includes(`archive${path.sep}`))
    .map((d) => ({
      ...d,
      // Ces deux-là recensent les suppressions : on ne leur demande pas de
      // compte sur les modules qu'ils nomment.
      documenteLesMorts:
        d.rel === "CHANGELOG.md" || d.rel.endsWith("modules-canoniques.md"),
    }))
}

/**
 * Les liens relatifs de tous les documents.
 * On écarte les protocoles et les ancres pures : rien à confronter au disque.
 */
function liensRelatifs(docs) {
  const liens = []
  for (const { fichier, rel, texte } of docs) {
    for (const [, label, cible] of texte.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
      if (/^(https?:|mailto:|tel:|#)/.test(cible)) continue
      const propre = cible.split("#")[0].trim()
      if (!propre) continue
      liens.push({
        rel,
        label,
        cible: propre,
        // Un chemin absolu part de la racine du dépôt, pas du système.
        resolu: propre.startsWith("/")
          ? path.join(ROOT, propre)
          : path.resolve(path.dirname(fichier), propre),
      })
    }
  }
  return liens
}

/** Les fichiers `site/src/**.ts(x)` cités entre backticks. */
function modulesCites(docs) {
  const cites = []
  for (const { rel, texte, documenteLesMorts } of docs) {
    if (documenteLesMorts) continue
    for (const [, chemin] of texte.matchAll(/`(site\/src\/[^`\s]+\.tsx?)`/g)) {
      cites.push({ rel, chemin })
    }
  }
  return cites
}

await garde("liens et références des documents", async (t) => {
  const docs = documents()
  const liens = liensRelatifs(docs)
  const cites = modulesCites(docs)

  t.section("corpus")
  // Une garde qui n'inspecte rien passe toujours. On le dit avant d'affirmer
  // quoi que ce soit sur le contenu.
  t.ok(
    "le balayage trouve des documents à inspecter",
    docs.length > 0,
    "aucun .md trouvé — le balayage est cassé, pas la documentation"
  )
  console.log(`     ${docs.length} documents inspectés (archive exclue)`)
  console.log(`     ${liens.length} liens relatifs · ${cites.length} modules cités`)

  t.section("liens relatifs")
  await t.each(
    "chaque lien relatif mène à un fichier existant",
    liens,
    (l) =>
      fs.existsSync(l.resolu) || `${l.rel} → lien mort « ${l.label} » vers ${l.cible}`
  )

  t.section("modules cités")
  await t.each(
    "chaque fichier site/src cité entre backticks existe",
    cites,
    (c) =>
      fs.existsSync(path.join(ROOT, c.chemin)) ||
      `${c.rel} → cite ${c.chemin}, qui n'existe pas`
  )

  t.section("noms enterrés")
  await t.each(
    "aucun document ne réveille un module supprimé",
    docs.filter((d) => !d.documenteLesMorts),
    (d) => {
      const trouves = MORTS.filter((mort) => d.texte.includes(mort))
      if (trouves.length === 0) return true
      const noms = trouves.map((m) => `« ${m} »`).join(", ")
      const verbe = trouves.length > 1 ? "supprimés" : "supprimé"
      return `${d.rel} → cite ${noms}, ${verbe} (cf. socle/modules-canoniques.md)`
    }
  )
})

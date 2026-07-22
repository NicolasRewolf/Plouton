#!/usr/bin/env node
/**
 * Ouvrir un article dans l'éditeur puis le resauvegarder ne doit RIEN perdre.
 *
 * C'est la question qui décide si l'admin est sûr de confier le blog aux
 * avocats. Le parcours réel d'une relecture est :
 *
 *   body_html (stocké) → parsé par le schéma TipTap → getHTML() (resauvegardé)
 *
 * Si le schéma ne déclare pas un nœud, ProseMirror le supprime SILENCIEUSEMENT
 * au parsing : pas d'erreur, pas d'avertissement, un tableau en moins. Cette
 * garde rejoue le parcours sur les 422 articles du corpus et compte les nœuds
 * de part et d'autre. Elle mesure aussi le texte, parce qu'un nœud peut être
 * conservé et vidé.
 *
 * Usage : (depuis site/)
 *   npx tsx scripts/check-editor-roundtrip.mjs [--limit N] [--verbose]
 *
 * tsx est requis : la garde importe le schéma TypeScript réel de l'éditeur.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import { garde } from "../../scripts/lib/garde.mjs"

// Le parseur ProseMirror a besoin d'un DOM ; on l'installe avant TipTap.
const dom = new JSDOM("<!doctype html><html><body></body></html>")
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.navigator ??= dom.window.navigator

const here = path.dirname(fileURLToPath(import.meta.url))

const { generateJSON, generateHTML } = await import("@tiptap/html")
// On importe le VRAI schéma de l'éditeur (pas une copie) — via tsx, qui résout
// le TypeScript et l'alias @/. Dupliquer le schéma ici rendrait la garde
// aveugle à une divergence, ce qui est précisément le défaut qu'elle traque.
const { buildEditorExtensions } = await import(
  path.join(here, "..", "src", "lib", "tiptap", "extensions.ts")
)
// Même définition de « perte » que la garde en ligne (API PUT) : sans ce
// partage, la garde hors ligne pourrait déclarer sain un nœud que l'API refuse
// — ou l'inverse.
const { TRACKED_NODE_TYPES, countNodeTypes, detectNodeLoss } = await import(
  path.join(here, "..", "src", "lib", "post-edit-loss.ts")
)

const RACINE = path.resolve(here, "..", "..")
const HTML_DIR = path.join(RACINE, "contenu", "body-html")
const DOCS_DIR = path.join(RACINE, "contenu", "body-docs")

const args = process.argv.slice(2)
const verbeux = args.includes("--verbose")
const iLimite = args.indexOf("--limit")
const limite = iLimite >= 0 ? Number(args[iLimite + 1] || 0) : 0

/**
 * Le plancher de texte est la tolérance PROPRE à cette garde, pas une règle du
 * site : le schéma a le droit de recoller les espaces autour d'une balise, donc
 * on n'exige pas l'égalité au caractère. En dessous de 200 caractères le ratio
 * n'a plus de sens — un article de trois mots perd 10 % sur un espace.
 */
const PLANCHER_RATIO = 0.995
const SEUIL_TEXTE = 200

/** Concatène le texte d'un document ProseMirror, nœud par nœud. */
function texteBrut(noeud, sortie = []) {
  if (!noeud || typeof noeud !== "object") return sortie
  if (noeud.type === "text" && noeud.text) sortie.push(noeud.text)
  for (const enfant of noeud.content || []) texteBrut(enfant, sortie)
  return sortie
}

const normaliser = (morceaux) => morceaux.join(" ").replace(/\s+/g, " ").trim()

await garde("aller-retour éditeur", async (t) => {
  const extensions = buildEditorExtensions()

  t.section("corpus")

  const fichiers = fs
    .readdirSync(HTML_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort()

  // Une garde qui ne trouve rien à vérifier et sort en vert est la panne la
  // plus coûteuse : elle se tait le jour où le corpus déménage.
  t.ok(
    "le corpus des body-html est lisible",
    fichiers.length > 0,
    () => `aucun .html dans ${HTML_DIR}`
  )

  const slugs = fichiers.map((f) => f.replace(/\.html$/, ""))
  const sansReference = slugs.filter(
    (slug) => !fs.existsSync(path.join(DOCS_DIR, `${slug}.json`))
  )
  // Le body-doc stocké est le seul point de comparaison possible. L'ancienne
  // version passait ces articles en silence (`continue`) : ils n'étaient pas
  // conformes, ils étaient absents du décompte.
  t.ok(
    "chaque body-html a son body-doc de référence",
    sansReference.length === 0,
    () => `sans référence : ${sansReference.join(", ")}`
  )

  let aVerifier = slugs.filter((slug) => !sansReference.includes(slug))

  if (limite > 0 && limite < aVerifier.length) {
    // --limit sert à itérer vite pendant une mise au point, jamais à conclure.
    // Le reste du corpus n'est pas conforme : il n'est pas vérifié.
    t.skip(
      `aller-retour de ${aVerifier.length - limite} article(s)`,
      `--limit ${limite}`
    )
    aVerifier = aVerifier.slice(0, limite)
  }

  const articles = []
  for (const slug of aVerifier) {
    const html = fs.readFileSync(path.join(HTML_DIR, `${slug}.html`), "utf8")
    // La référence est le body-doc STOCKÉ, pas la première ouverture : si un
    // nœud échoue à se parser dès l'ouverture, comparer ouverture↔réouverture
    // le déclarerait « stable » alors qu'il a déjà disparu.
    const source = JSON.parse(
      fs.readFileSync(path.join(DOCS_DIR, `${slug}.json`), "utf8")
    )

    let reouvert
    try {
      // 1. ouverture dans l'éditeur → 2. resauvegarde → 3. réouverture
      const ouvert = generateJSON(html, extensions)
      const resauvegarde = generateHTML(ouvert, extensions)
      reouvert = generateJSON(resauvegarde, extensions)
    } catch (e) {
      // On rattache le slug avant de laisser remonter : une pile nue au milieu
      // de 422 articles ne dit pas lequel a cassé.
      throw new Error(
        `${slug} — ${e instanceof Error ? e.message : String(e)}`
      )
    }

    articles.push({ slug, source, reouvert })
  }

  t.section("nœuds")

  // On n'alerte que sur une diminution : le schéma a le droit d'AJOUTER des
  // nœuds en normalisant (trois bulletList de plus sur le corpus actuel, des
  // listes imbriquées recollées proprement). Ajouter n'a jamais perdu personne.
  await t.each(
    "aucun nœud ne disparaît à l'aller-retour",
    articles,
    ({ slug, source, reouvert }) => {
      const pertes = detectNodeLoss(source, reouvert)
      if (pertes.length === 0) return true
      const detail = pertes
        .map((p) => `${p.type} ${p.before} → ${p.after}`)
        .join(", ")
      return `${slug} : ${detail}`
    }
  )

  t.section("texte")

  // Un nœud peut survivre au comptage et sortir vide de l'aller-retour : le
  // volume de texte est la seconde mesure, indépendante de la première.
  await t.each(
    "le texte des articles survit à l'aller-retour",
    articles,
    ({ slug, source, reouvert }) => {
      const avant = normaliser(texteBrut(source))
      const apres = normaliser(texteBrut(reouvert))
      if (avant.length <= SEUIL_TEXTE) return true
      const ratio = apres.length / avant.length
      if (ratio >= PLANCHER_RATIO) return true
      return `${slug} : ${avant.length} → ${apres.length} car. (ratio ${ratio.toFixed(3)})`
    }
  )

  if (verbeux) {
    const cumuler = (cle) => {
      const totaux = {}
      for (const article of articles)
        for (const [type, n] of Object.entries(countNodeTypes(article[cle])))
          totaux[type] = (totaux[type] || 0) + n
      return totaux
    }
    const avant = cumuler("source")
    const apres = cumuler("reouvert")

    console.log("\n  totaux par type (body-doc stocké → après aller-retour)")
    for (const type of TRACKED_NODE_TYPES) {
      const b = avant[type] || 0
      const a = apres[type] || 0
      if (!b && !a) continue
      const verdict = a < b ? "PERTE" : a > b ? "+ (normalisation)" : "OK"
      console.log(`    ${type.padEnd(16)} ${b} → ${a} ${verdict}`)
    }
  }
})

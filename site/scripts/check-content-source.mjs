#!/usr/bin/env node
/**
 * Vérifie le seam des sources de contenu (`src/lib/content-source.ts`).
 *
 * Un seam ne vaut que si quelque chose varie réellement au travers. On le
 * prouve donc dans les deux états :
 *
 *   avec clé serveur    → Supabase répond, l'instantané aussi
 *   sans clé serveur    → Supabase se tait (`null`), l'instantané répond seul
 *
 * C'est ce second état qui compte : c'est le comportement du site quand la
 * base est injoignable, et il n'avait jamais été exercé par quoi que ce soit.
 * La convention testée ici est celle dont dépend toute la précédence :
 * `null` = source indisponible, `[]` = réponse vide. Les confondre, c'est
 * afficher un site vide au lieu de servir l'instantané.
 *
 * Exit 1 si un contrat est rompu.
 *
 * Usage : (depuis site/) npm run check:sources
 */
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(here, "..", "src", "lib")

const results = []
function check(label, ok, detail = "") {
  results.push({ label, ok, detail })
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`)
}

// ── 1. avec la clé serveur ────────────────────────────────────────────────
const hadKey = Boolean(process.env.SUPABASE_SECRET_KEY)
if (hadKey) {
  const { SUPABASE, SNAPSHOT } = await import(path.join(SRC, "content-source.ts"))

  const dbIndex = await SUPABASE.publishedIndex()
  check(
    "Supabase répond à l'index",
    Array.isArray(dbIndex) && dbIndex.length > 0,
    dbIndex === null ? "null (source muette)" : `${dbIndex?.length} articles`
  )

  const snapIndex = await SNAPSHOT.publishedIndex()
  check(
    "l'instantané répond à l'index",
    Array.isArray(snapIndex) && snapIndex.length > 0,
    `${snapIndex?.length} articles`
  )

  // Les deux adapters doivent parler du même monde, sinon le repli servirait
  // un site méconnaissable.
  if (Array.isArray(dbIndex) && Array.isArray(snapIndex)) {
    const dbSlugs = new Set(dbIndex.map((a) => a.slug))
    const commun = snapIndex.filter((a) => dbSlugs.has(a.slug)).length
    const taux = commun / Math.max(1, snapIndex.length)
    check(
      "les deux sources décrivent le même corpus",
      taux > 0.9,
      `${Math.round(taux * 100)} % de slugs communs`
    )
  }

  const un = dbIndex?.[0]?.slug
  if (un) {
    const art = await SUPABASE.publishedArticle(un)
    check("Supabase sert un article", Boolean(art?.title), un.slice(0, 40))
  }
} else {
  console.log("  ⏭️  SUPABASE_SECRET_KEY absente — volet « avec clé » sauté")
}

// ── 2. sans la clé serveur ────────────────────────────────────────────────
// On recharge les modules dans un état d'environnement dégradé : c'est le
// seul moyen d'exercer le repli sans débrancher la vraie base.
delete process.env.SUPABASE_SECRET_KEY
const fresh = await import(
  path.join(SRC, "content-source.ts") + `?nokey=${Date.now()}`
)

const muet = await fresh.SUPABASE.publishedArticle("peu-importe")
check("sans clé, Supabase renvoie null (et non une erreur)", muet === null)

const secours = await fresh.SNAPSHOT.publishedIndex()
check(
  "sans clé, l'instantané prend le relais",
  Array.isArray(secours) && secours.length > 0,
  `${secours?.length} articles`
)

const adminSecours = await fresh.SNAPSHOT.adminIndex()
check(
  "l'instantané sait aussi répondre à l'admin",
  Array.isArray(adminSecours) && adminSecours.length > 0,
  `${adminSecours?.length} articles`
)

// ── verdict ───────────────────────────────────────────────────────────────
const ko = results.filter((r) => !r.ok)
if (ko.length) {
  console.error(`\n❌ ${ko.length} contrat(s) rompu(s) au seam des sources.`)
  process.exit(1)
}
console.log(`\n✅ seam des sources conforme (${results.length} contrats)`)

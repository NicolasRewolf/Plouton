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
 * Le volet « avec clé » ne peut pas tourner sans clés serveur. Cette garde le
 * déclarait autrefois « sauté » et sortait 0 : elle disait vert en n'ayant
 * vérifié que la moitié de ce qu'elle annonce. Les sauts sont désormais
 * déclarés au harnais, qui sort en 2 — INCOMPLET. Rien n'a échoué, mais tout
 * n'a pas été vérifié, et ça se voit.
 *
 * « Y a-t-il des clés ? » se demande à `isSupabaseConfigured`, jamais à
 * `process.env` directement. La garde lisait `SUPABASE_SECRET_KEY` seule alors
 * que le site en exige DEUX (l'URL aussi) : avec la clé mais sans l'URL, elle
 * entrait dans le volet « avec clé » et accusait la base de ne pas répondre —
 * un échec rouge pour un environnement simplement non configuré.
 *
 * Codes : 0 conforme · 1 échec · 2 incomplet.
 *
 * Usage : (depuis site/) npm run check:sources
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(here, "..", "src", "lib")
const MODULE = path.join(SRC, "content-source.ts")

// La question « la base est-elle joignable ? » se pose à la même fonction que
// celle que consulte `content-source` lui-même — sinon la garde et le site
// pourraient répondre différemment, et c'est la garde qu'on croirait.
const { isSupabaseConfigured } = await import(path.join(SRC, "posts-db.ts"))

/**
 * Part des slugs de l'instantané que la base connaît aussi.
 *
 * Les deux adapters doivent parler du même monde : si le repli servait un
 * corpus méconnaissable, il ne serait pas un repli mais un autre site.
 */
function recouvrement(snapIndex, dbIndex) {
  const dbSlugs = new Set(dbIndex.map((a) => a.slug))
  const absents = snapIndex.filter((a) => !dbSlugs.has(a.slug)).map((a) => a.slug)
  const commun = snapIndex.length - absents.length
  return { taux: commun / Math.max(1, snapIndex.length), absents }
}

await garde("seam des sources de contenu", async (t) => {
  // ── 1. avec la clé serveur ──────────────────────────────────────────────
  t.section("avec la clé serveur")

  if (isSupabaseConfigured()) {
    const { SUPABASE, SNAPSHOT } = await import(MODULE)

    const dbIndex = await SUPABASE.publishedIndex()
    t.ok(
      "Supabase répond à l'index",
      Array.isArray(dbIndex) && dbIndex.length > 0,
      dbIndex === null ? "null — la source est muette" : `${dbIndex?.length} articles`
    )

    const snapIndex = await SNAPSHOT.publishedIndex()
    t.ok(
      "l'instantané répond à l'index",
      Array.isArray(snapIndex) && snapIndex.length > 0,
      () => `${snapIndex?.length} articles`
    )

    if (Array.isArray(dbIndex) && Array.isArray(snapIndex)) {
      const { taux, absents } = recouvrement(snapIndex, dbIndex)
      t.ok(
        "les deux sources décrivent le même corpus",
        taux > 0.9,
        () =>
          `${Math.round(taux * 100)} % de slugs communs · absents de la base : ` +
          `${absents.slice(0, 5).join(", ")}${absents.length > 5 ? `, …+${absents.length - 5}` : ""}`
      )
    } else {
      t.skip(
        "les deux sources décrivent le même corpus",
        "un des deux index n'est pas un tableau — rien à comparer"
      )
    }

    const un = dbIndex?.[0]?.slug
    if (un) {
      const art = await SUPABASE.publishedArticle(un)
      t.ok("Supabase sert un article", Boolean(art?.title), un.slice(0, 40))
    } else {
      t.skip("Supabase sert un article", "l'index de la base ne fournit aucun slug à tirer")
    }
  } else {
    // Le trou est nommé vérification par vérification : « une garde n'a pas
    // tourné » ne dit rien, « ces quatre contrats-là ne sont pas prouvés » se
    // lit et se répare.
    const manquantes = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter(
      (v) => !process.env[v]
    )
    const raison = `clés serveur absentes (${manquantes.join(", ")})`
    t.skip("Supabase répond à l'index", raison)
    t.skip("l'instantané répond à l'index", raison)
    t.skip("les deux sources décrivent le même corpus", raison)
    t.skip("Supabase sert un article", raison)
  }

  // ── 2. sans la clé serveur ──────────────────────────────────────────────
  // On recharge le module dans un état d'environnement dégradé : c'est le
  // seul moyen d'exercer le repli sans débrancher la vraie base. Le
  // cache-buster est indispensable — sans lui, Node resservirait l'instance
  // déjà importée plus haut, qui a vu la clé.
  t.section("sans la clé serveur")

  delete process.env.SUPABASE_SECRET_KEY
  const fresh = await import(`${MODULE}?nokey=${Date.now()}`)

  const muet = await fresh.SUPABASE.publishedArticle("peu-importe")
  t.eq("sans clé, Supabase renvoie null (et non une erreur)", muet, null)

  const secours = await fresh.SNAPSHOT.publishedIndex()
  t.ok(
    "sans clé, l'instantané prend le relais",
    Array.isArray(secours) && secours.length > 0,
    () => `${secours?.length} articles`
  )

  const adminSecours = await fresh.SNAPSHOT.adminIndex()
  t.ok(
    "l'instantané sait aussi répondre à l'admin",
    Array.isArray(adminSecours) && adminSecours.length > 0,
    () => `${adminSecours?.length} articles`
  )
})

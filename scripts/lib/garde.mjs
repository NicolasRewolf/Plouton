/**
 * Le harnais des gardes.
 *
 * Les gardes sont les seuls tests du projet : pas de runner, pas de CI. Chacune
 * écrivait pourtant sa propre assertion, son propre rapport, sa propre
 * troncature et son propre code de sortie — quatre styles pour huit gardes. Ce
 * module les possède une fois.
 *
 * Deux règles portent tout le reste :
 *
 *   1. Une garde IMPORTE la règle qu'elle vérifie, elle ne la réénonce jamais.
 *      `check-meta-descriptions` épinglait une expression d'élision différente
 *      de celle de `meta-description.ts` : elle testait une règle que le site
 *      n'utilisait pas, et disait vert.
 *
 *   2. Sauter une vérification n'est PAS réussir. `check:sources` sautait tout
 *      son volet Supabase sans clé et imprimait ✅. Un saut donne désormais
 *      « INCOMPLET » et le code de sortie 2.
 *
 * Trois issues, et elles se distinguent — c'est le point pour qui n'est pas
 * développeur :
 *
 *   0  CONFORME    tout a été vérifié, tout passe
 *   1  ÉCHEC       un défaut est prouvé  → il y a quelque chose à réparer
 *   2  INCOMPLET   rien n'a échoué, mais tout n'a pas pu être vérifié
 *
 * Usage :
 *
 *   import { garde } from "../lib/garde.mjs"
 *
 *   await garde("règles de soumission", async (t) => {
 *     t.section("slug")
 *     t.eq("les accents sont conservés", slugifyTitle("Éviter"), "éviter")
 *     t.ok("idempotent", a === b)
 *     t.skip("volet base", "SUPABASE_SECRET_KEY absente")
 *     t.each("les 422 articles ont un corps", slugs, (s) => corps(s) || "vide")
 *   })
 *
 * Variables d'environnement :
 *   GARDES_TOLERE_SKIP=1  un saut ne fait plus sortir en 2 (usage local)
 *   GARDES_JSON=1         imprime une dernière ligne JSON lisible par machine
 */

const MAX_DETAILS = 15

const SYMBOLES = { ok: "✅", ko: "❌", skip: "⏭️ " }

/** Rend une valeur lisible dans un message d'échec, sans exploser l'écran. */
function apercu(v) {
  if (typeof v === "string") return v.length > 120 ? `${v.slice(0, 117)}…` : v
  let s
  try {
    s = JSON.stringify(v)
  } catch {
    s = String(v)
  }
  if (s === undefined) s = String(v)
  return s.length > 120 ? `${s.slice(0, 117)}…` : s
}

/** Égalité structurelle — suffisante pour ce que les gardes comparent. */
function memeValeur(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (typeof a !== "object") return Number.isNaN(a) && Number.isNaN(b)
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

class Contexte {
  constructor() {
    this.passes = 0
    this.echecs = []
    this.sauts = []
    this.sectionCourante = null
  }

  /** Titre de regroupement. Purement visuel. */
  section(titre) {
    this.sectionCourante = titre
    console.log(`\n  ── ${titre} ──`)
  }

  _reussite(label) {
    this.passes++
    console.log(`  ${SYMBOLES.ok} ${label}`)
  }

  _echec(label, lignes = []) {
    this.echecs.push({ label, section: this.sectionCourante, lignes })
    console.log(`  ${SYMBOLES.ko} ${label}`)
    for (const l of lignes) console.log(`       ${l}`)
  }

  /**
   * Vérification booléenne.
   * `detail` n'est imprimé qu'en cas d'échec — et peut être une fonction, pour
   * ne pas payer sa construction quand tout va bien.
   */
  ok(label, condition, detail) {
    if (condition) return this._reussite(label)
    const d = typeof detail === "function" ? detail() : detail
    this._echec(label, d ? [d] : [])
  }

  /** Égalité. Le message d'échec montre les deux côtés. */
  eq(label, obtenu, attendu) {
    if (memeValeur(obtenu, attendu)) return this._reussite(label)
    this._echec(label, [
      `attendu ${apercu(attendu)}`,
      `obtenu  ${apercu(obtenu)}`,
    ])
  }

  /**
   * Vérification non effectuée, avec sa raison.
   *
   * Ce n'est ni un succès ni un échec : c'est un trou déclaré. La garde sort en
   * 2 (INCOMPLET) — sauter en silence est précisément ce qui faisait dire vert
   * à une garde qui n'avait rien vérifié.
   */
  skip(label, raison) {
    this.sauts.push({ label, section: this.sectionCourante, raison })
    console.log(`  ${SYMBOLES.skip}${label} — ${raison}`)
  }

  /**
   * Une même vérification sur un corpus entier : une ligne de résultat, pas N.
   *
   * `verif(item, i)` renvoie `true` (ou `undefined`) si l'item passe, ou une
   * chaîne décrivant le défaut. Les défauts sont listés jusqu'à MAX_DETAILS,
   * puis comptés — la troncature est la même pour toutes les gardes.
   */
  async each(label, items, verif) {
    const liste = Array.from(items)
    const defauts = []
    for (let i = 0; i < liste.length; i++) {
      let r
      try {
        r = await verif(liste[i], i)
      } catch (e) {
        r = `exception — ${e instanceof Error ? e.message : String(e)}`
      }
      if (r !== true && r !== undefined && r !== null && r !== false) {
        defauts.push(typeof r === "string" ? r : apercu(r))
      } else if (r === false) {
        defauts.push(apercu(liste[i]))
      }
    }
    if (defauts.length === 0) {
      return this._reussite(`${label} (${liste.length})`)
    }
    const lignes = defauts.slice(0, MAX_DETAILS).map((d) => `- ${d}`)
    if (defauts.length > MAX_DETAILS) {
      lignes.push(`… +${defauts.length - MAX_DETAILS} autres`)
    }
    this._echec(`${label} — ${defauts.length} sur ${liste.length}`, lignes)
  }
}

/**
 * Exécute une garde et sort avec le bon code.
 *
 * Toute exception non rattrapée dans `fn` est un échec de la garde, pas un
 * plantage silencieux : sans ça, une erreur d'import après la ligne de succès
 * pouvait laisser un code de sortie 0.
 */
export async function garde(nom, fn) {
  console.log(`\n── ${nom} ──`)
  const t = new Contexte()
  let exception = null

  try {
    await fn(t)
  } catch (e) {
    exception = e instanceof Error ? e : new Error(String(e))
    t._echec(`la garde s'est interrompue : ${exception.message}`)
  }

  const { passes, echecs, sauts } = t
  const total = passes + echecs.length + sauts.length

  const parties = [`${total} vérification${total > 1 ? "s" : ""}`]
  parties.push(`${passes} conforme${passes > 1 ? "s" : ""}`)
  if (echecs.length) parties.push(`${echecs.length} en échec`)
  if (sauts.length) parties.push(`${sauts.length} sautée${sauts.length > 1 ? "s" : ""}`)
  console.log(`\n  ${parties.join(" · ")}`)

  const tolereSkip = process.env.GARDES_TOLERE_SKIP === "1"
  let code = 0
  let verdict = "CONFORME"

  if (echecs.length) {
    code = 1
    verdict = "ÉCHEC"
    console.error(`\n${SYMBOLES.ko} ÉCHEC — ${nom}`)
    for (const e of echecs) {
      console.error(`   · ${e.section ? `[${e.section}] ` : ""}${e.label}`)
    }
  } else if (sauts.length && !tolereSkip) {
    code = 2
    verdict = "INCOMPLET"
    console.error(`\n⚠️  INCOMPLET — ${nom}`)
    console.error(
      `   ${sauts.length} vérification(s) n'ont pas pu être faites. Rien n'a échoué,`
    )
    console.error(`   mais tout n'a pas été vérifié :`)
    for (const s of sauts) console.error(`   · ${s.label} — ${s.raison}`)
    console.error(
      `   (GARDES_TOLERE_SKIP=1 pour accepter ce trou en local — jamais avant une livraison.)`
    )
  } else {
    if (sauts.length) verdict = "CONFORME (sauts tolérés)"
    console.log(`\n${SYMBOLES.ok} ${nom} — ${verdict.toLowerCase()}`)
  }

  if (process.env.GARDES_JSON === "1") {
    console.log(
      JSON.stringify({
        garde: nom,
        verdict,
        code,
        total,
        passes,
        echecs: echecs.map((e) => e.label),
        sauts: sauts.map((s) => ({ label: s.label, raison: s.raison })),
      })
    )
  }

  if (exception && code === 0) code = 1
  process.exit(code)
}

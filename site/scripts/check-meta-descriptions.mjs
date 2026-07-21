#!/usr/bin/env node
/**
 * Vérifie la description que chaque article va réellement servir
 * (`src/lib/meta-description.ts`).
 *
 * Le crawl du site Wix a rendu des `metaDescription` amputées en pleine
 * élision — « … devant la Cour d », « Victime d ». `safeMetaDescription`
 * existe pour ça : elle écarte une description tronquée et se rabat sur
 * l'extrait de l'article.
 *
 * Cette garde épinglait sa PROPRE expression d'élision, qui n'était pas celle
 * du site : elle exigeait une apostrophe finale, ajoutait « quoiqu », et
 * réimplémentait à la main la précédence meta → extrait. Elle laissait donc
 * passer ce que le site rejette, et rejetait ce que le site sert. Elle disait
 * vert sur une règle qui n'a jamais existé nulle part.
 *
 * Elle importe désormais la fonction. Et elle ne vérifie plus une orthographe
 * de règle, mais un résultat : pour chacun des 422 articles, ce que la page va
 * poser dans son `<meta name="description">` est exploitable. La formulation
 * est plus forte que l'ancienne — une meta amputée passe maintenant par la
 * règle, donc soit l'extrait la remplace, soit il ne reste rien et la garde le
 * dit. L'expression d'élision, elle, reste où elle doit être : dans la
 * bibliothèque, en un seul exemplaire.
 *
 * Usage : (depuis site/) npx tsx scripts/check-meta-descriptions.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(here, "..", "..", "contenu", "articles")

const { safeMetaDescription } = await import(
  path.join(here, "..", "src", "lib", "meta-description.ts")
)

/**
 * En deçà, une description n'est plus une phrase : c'est un morceau de phrase,
 * et le moteur la remplace par ce qu'il trouve. Ce n'est pas le seuil interne
 * de la règle — celui-là appartient à `meta-description.ts` et n'a pas à être
 * recopié ici. C'est ce qu'on exige du corpus une fois la règle appliquée.
 */
const LISIBLE = 80

/** Le corpus migré depuis Wix. */
const ARTICLES = 422

const articles = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((fichier) => {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, fichier), "utf8"))
    return { slug: data.slug || fichier.replace(/\.json$/, ""), data }
  })

await garde("descriptions servies par le blog", async (t) => {
  t.section("la règle, sur des cas nommés")

  // Le défaut d'origine (P0-C), en un cas : une meta coupée après « Cour d »
  // ne doit jamais atteindre la page tant qu'un extrait tient debout.
  const extrait =
    "Un client obtient réparation après un accident de la route survenu en " +
    "2019 : la cour retient la faute entière du conducteur."
  t.eq(
    "une meta amputée en pleine élision cède la place à l'extrait",
    safeMetaDescription(
      "Une victime a saisi la juridiction compétente au terme d'une longue " +
        "procédure engagée devant la Cour d",
      extrait
    ),
    extrait
  )

  t.eq(
    "sans meta ni extrait, la règle ne fabrique rien",
    safeMetaDescription(null, null),
    ""
  )

  t.section("le corpus")

  // Un répertoire vide, ou lu au mauvais endroit, ne doit pas pouvoir dire
  // vert : c'est la même famille de défaut que celle qu'on répare ici.
  t.eq("le corpus est au complet", articles.length, ARTICLES)

  await t.each(
    "chaque article sert une description exploitable",
    articles,
    ({ slug, data }) => {
      const servie = safeMetaDescription(data.metaDescription, data.excerpt)
      if (servie.length >= LISIBLE) return true
      const sources =
        `meta ${(data.metaDescription || "").trim().length} car. · ` +
        `extrait ${(data.excerpt || "").trim().length} car.`
      return (
        `${slug} — ${servie.length} caractères servis (${sources}) · ` +
        `« ${servie.slice(0, 60) || "—"} »`
      )
    }
  )

  t.section("la forme de ce qui est servi")

  // La longueur ne dit rien de la FORME. Une description peut faire 102
  // caractères et finir en pleine élision — et l'original le vérifiait, c'était
  // même son assertion principale. Il la vérifiait avec sa propre expression
  // régulière, ce qu'on ne veut plus.
  //
  // On la retrouve sans rien recopier, en repassant la description servie dans
  // la règle elle-même : si la règle la juge inacceptable, elle ne la rend pas.
  // « Ce que le site sert doit être ce que le site accepterait » — un point
  // fixe, exprimé entièrement dans le vocabulaire de la bibliothèque.
  //
  // Ce n'est pas une précaution théorique. 194 des 422 articles portent un
  // extrait identique octet pour octet à leur meta : sur ceux-là, la règle
  // écarte la meta pour élision, puis sert l'extrait — le même texte amputé —
  // sans le réexaminer. C'est le repli qui rouvre la porte qu'il venait de
  // fermer.
  await t.each(
    "la description servie est elle-même acceptable par la règle",
    articles,
    ({ slug, data }) => {
      const servie = safeMetaDescription(data.metaDescription, data.excerpt)
      if (!servie) return true // déjà signalé par la vérification précédente
      if (safeMetaDescription(servie, null) === servie) return true
      return `${slug} — servie mais refusée en seconde lecture · « …${servie.slice(-52)} »`
    }
  )
})

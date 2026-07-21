#!/usr/bin/env node
/**
 * Vérifie les règles de soumission d'article (`src/lib/article-submission.ts`).
 *
 * Ces règles décident de ce qui part en base quand un avocat clique sur
 * « Publier ». Elles étaient auparavant écrites en double — une fois dans
 * l'éditeur, une fois dans l'API — avec des versions qui divergeaient. Les
 * cas ci-dessous fixent le comportement des deux bords : ce qui doit passer,
 * et ce qui doit être refusé au lieu d'être silencieusement corrigé.
 *
 * Rien n'est réénoncé ici : slugification, lecture de statut et contrôles de
 * forme sont importés du module réel. Une garde qui recopierait la règle
 * finirait par vérifier une règle que le site n'utilise pas.
 *
 * Usage : (depuis site/) npm run check:submission
 */
import path from "node:path"
import { fileURLToPath } from "node:url"

import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const { slugifyTitle, normalizeSlug, readStatus, validateSubmission } =
  await import(path.join(here, "..", "src", "lib", "article-submission.ts"))

await garde("règles de soumission d'article", async (t) => {
  t.section("slug")

  // Les 422 articles migrés portent leurs accents : un nouvel article doit
  // suivre la même convention, sinon le blog en a deux.
  t.eq(
    "les accents sont conservés",
    slugifyTitle("Affaire Chahinez : un féminicide évité ?"),
    "affaire-chahinez-un-féminicide-évité"
  )
  t.eq(
    "apostrophes et ponctuation deviennent des tirets",
    slugifyTitle("L'ITT pénale, c'est quoi ?"),
    "l-itt-pénale-c-est-quoi"
  )
  t.eq(
    "pas de tirets doublés ni en bordure",
    slugifyTitle("  Garde à vue — 48h  "),
    "garde-à-vue-48h"
  )
  t.eq(
    "un slug déjà saisi suit la MÊME règle",
    normalizeSlug("Droit Pénal Des Affaires"),
    "droit-pénal-des-affaires"
  )
  t.eq(
    "idempotent",
    normalizeSlug(slugifyTitle("Accident de la route")),
    slugifyTitle("Accident de la route")
  )

  t.section("statut")

  t.eq("absent → brouillon", readStatus(undefined, "2020-01-01"), {
    ok: true,
    status: "draft",
  })
  t.eq("vide → brouillon", readStatus("", "2020-01-01"), {
    ok: true,
    status: "draft",
  })
  t.eq(
    "published avec date passée reste published",
    readStatus("published", "2020-01-01"),
    { ok: true, status: "published" }
  )
  // Le cœur du défaut corrigé : une faute de frappe dépubliait en répondant 200.
  t.eq(
    "statut inconnu → REFUS (et non « draft » en silence)",
    readStatus("publised", "2020-01-01").ok,
    false
  )
  t.eq(
    "statut inconnu → message exploitable",
    readStatus("banana").message.includes("banana"),
    true
  )

  t.section("forme de la soumission")

  const okCase = validateSubmission(
    { slug: "test", title: "Test", categories: ["Droit pénal"] },
    { requireTitle: true }
  )
  t.eq("soumission valide passe", okCase.ok, true)

  t.eq(
    "slug manquant → refus",
    validateSubmission({ title: "Test" }, { requireTitle: true }).ok,
    false
  )
  t.eq(
    "titre requis à la création",
    validateSubmission({ slug: "x" }, { requireTitle: true }).ok,
    false
  )
  t.eq(
    "titre facultatif à la mise à jour",
    validateSubmission({ slug: "x" }).ok,
    true
  )
  // `"droit".length` est non nul : l'ancien code l'acceptait et l'itérait
  // caractère par caractère.
  t.eq(
    "categories en chaîne → refus",
    validateSubmission({ slug: "x", categories: "droit" }).ok,
    false
  )
  t.eq(
    "bodyDoc en tableau → refus",
    validateSubmission({ slug: "x", bodyDoc: [1, 2] }).ok,
    false
  )
  t.eq(
    "bodyDoc null accepté (article hérité)",
    validateSubmission({ slug: "x", bodyDoc: null }).ok,
    true
  )
  t.eq("corps non-objet → refus", validateSubmission("nope").ok, false)
  t.eq(
    "statut invalide remonté comme erreur de champ",
    validateSubmission({ slug: "x", status: "banana" }).errors?.[0]?.field,
    "status"
  )
})

#!/usr/bin/env node
/**
 * Vérifie le comportement de la garde anti-perte (`src/lib/post-edit-loss.ts`).
 *
 * La garde décide si la sauvegarde d'un avocat passe ou demande confirmation.
 * Les deux erreurs coûtent cher, en sens inverse : trop stricte, elle fige des
 * articles sains (c'est ce que faisait l'ancien gel par nom de balise, 53
 * articles sur 422) ; trop laxiste, elle laisse détruire un tableau en
 * silence. On fixe donc les deux bords par des cas explicites.
 *
 * Exit 1 si un cas dévie. Exit 0 sinon.
 *
 * Usage : (depuis site/) npm run check:edit-loss
 */
import { fileURLToPath } from "node:url"
import path from "node:path"

const here = path.dirname(fileURLToPath(import.meta.url))
const { detectNodeLoss, nodeLossMessage } = await import(
  path.join(here, "..", "src", "lib", "post-edit-loss.ts")
)

/** Fabrique un doc ProseMirror minimal contenant les types demandés. */
const doc = (...types) => ({
  type: "doc",
  content: types.map((t) => ({
    type: t,
    content: [{ type: "text", text: "x" }],
  })),
})

const cases = [
  // [libellé, doc stocké, doc entrant, doit demander confirmation]
  ["texte modifié, structure intacte", doc("paragraph", "table"), doc("paragraph", "table"), false],
  ["ajout d'un tableau", doc("paragraph"), doc("paragraph", "table"), false],
  ["réordonnancement", doc("table", "details"), doc("details", "table"), false],
  ["suppression d'un tableau", doc("paragraph", "table"), doc("paragraph"), true],
  ["suppression d'un accordéon sur deux", doc("details", "details"), doc("details"), true],
  // La garde ne connaît pas de liste de types « à risque » : tout type suivi
  // qui diminue déclenche la confirmation, y compris ceux ajoutés plus tard.
  ["type non anticipé (galerie)", doc("gallery"), doc("paragraph"), true],
  // Sans point de comparaison on n'affirme rien — bloquer sur une inconnue
  // reviendrait à refaire le gel qu'on a supprimé.
  ["doc précédent absent", null, doc("paragraph"), false],
  ["doc entrant absent", doc("table"), null, false],
]

let failed = 0
for (const [label, before, after, shouldBlock] of cases) {
  const losses = detectNodeLoss(before, after)
  const blocked = losses.length > 0
  const ok = blocked === shouldBlock
  if (!ok) failed++
  const verdict = blocked ? "confirmation" : "passe"
  const detail = blocked ? ` — ${nodeLossMessage(losses)}` : ""
  console.log(`  ${ok ? "✅" : "❌"} ${label.padEnd(36)} → ${verdict}${detail}`)
}

if (failed) {
  console.error(`\n❌ ${failed} cas dévient du comportement attendu.`)
  process.exit(1)
}
console.log(`\n✅ garde anti-perte conforme (${cases.length} cas)`)

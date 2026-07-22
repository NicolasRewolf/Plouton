#!/usr/bin/env node
/**
 * Vérifie le comportement de la garde anti-perte (`src/lib/post-edit-loss.ts`).
 *
 * La garde décide si la sauvegarde d'un avocat passe ou demande confirmation.
 * Les deux erreurs coûtent cher, en sens inverse : trop stricte, elle fige des
 * articles sains (c'est ce que faisait l'ancien gel par nom de balise, 53
 * articles sur 422) ; trop laxiste, elle laisse détruire un tableau en
 * silence. On fixe donc les deux bords par des cas explicites, rangés selon le
 * bord qu'ils tiennent : ce qui doit passer, ce qui doit s'arrêter.
 *
 * Aucun corpus ici, aucune base : huit documents synthétiques suffisent, parce
 * que ce qu'on interroge est une décision, pas des données.
 *
 * Usage : (depuis site/) npm run check:edit-loss
 */
import { fileURLToPath } from "node:url"
import path from "node:path"
import { garde } from "../../scripts/lib/garde.mjs"

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

/** [libellé, doc stocké, doc entrant] */
const PASSE = [
  ["texte modifié, structure intacte", doc("paragraph", "table"), doc("paragraph", "table")],
  ["ajout d'un tableau", doc("paragraph"), doc("paragraph", "table")],
  ["réordonnancement", doc("table", "details"), doc("details", "table")],
  // Sans point de comparaison on n'affirme rien — bloquer sur une inconnue
  // reviendrait à refaire le gel qu'on a supprimé.
  ["doc précédent absent", null, doc("paragraph")],
  ["doc entrant absent", doc("table"), null],
]

const BLOQUE = [
  ["suppression d'un tableau", doc("paragraph", "table"), doc("paragraph")],
  ["suppression d'un accordéon sur deux", doc("details", "details"), doc("details")],
  // La garde ne connaît pas de liste de types « à risque » : tout type suivi
  // qui diminue déclenche la confirmation, y compris ceux ajoutés plus tard.
  ["type non anticipé (galerie)", doc("gallery"), doc("paragraph")],
]

await garde("garde anti-perte à la sauvegarde", async (t) => {
  t.section("ce qui passe sans confirmation")
  for (const [libelle, avant, apres] of PASSE) {
    const pertes = detectNodeLoss(avant, apres)
    t.ok(
      libelle,
      pertes.length === 0,
      () => `une confirmation serait réclamée : ${nodeLossMessage(pertes)}`
    )
  }

  t.section("ce qui demande confirmation")
  for (const [libelle, avant, apres] of BLOQUE) {
    const pertes = detectNodeLoss(avant, apres)
    // Le message part dans le libellé, pas dans le détail : c'est la phrase que
    // l'avocat lira, et on veut la relire à chaque passage, pas seulement le
    // jour où la garde tombe.
    t.ok(
      `${libelle} → ${nodeLossMessage(pertes) || "(aucune perte détectée)"}`,
      pertes.length > 0,
      "la sauvegarde passerait en silence"
    )
  }

  t.section("la phrase adressée à l'avocat")
  // Un message vide sur une perte réelle laisserait la confirmation muette :
  // la boîte de dialogue s'ouvrirait sans dire ce qui disparaît.
  await t.each("une perte détectée se dit toujours", BLOQUE, ([libelle, avant, apres]) => {
    const message = nodeLossMessage(detectNodeLoss(avant, apres))
    return message.trim().length > 0 || `${libelle} — message vide`
  })
})

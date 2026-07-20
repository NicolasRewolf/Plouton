/**
 * Détection de perte de contenu à la sauvegarde d'un article.
 *
 * Remplace l'ancien gel par nom de balise (`post-edit-guard`), qui refusait
 * l'édition dès qu'un article contenait `<table|details|figure|iframe|h4>` :
 * 53 articles sur 422 étaient figés alors que le round-trip les préserve
 * tous. Une liste de types « dangereux » écrite à la main se périme dès que
 * le schéma progresse, et elle est muette sur les types qu'on n'a pas prévus.
 *
 * On ne devine donc plus : on compte les nœuds avant et après, et on n'alerte
 * que sur une disparition réelle. C'est plus strict (n'importe quel type est
 * couvert, pas seulement six) et plus permissif (aucun article sain n'est
 * bloqué) — les deux à la fois, parce que la mesure remplace le pronostic.
 *
 * Ce n'est pas un refus mais une confirmation : supprimer un tableau est un
 * acte éditorial légitime. On ne l'empêche pas, on refuse juste qu'il passe
 * inaperçu.
 *
 * `scripts/check-editor-roundtrip.mjs` importe `TRACKED_NODE_TYPES` d'ici :
 * la garde en ligne et le test hors ligne partagent une seule définition de
 * « perte », sans quoi ils dériveraient l'un de l'autre.
 *
 * Module isomorphe (aucun accès disque) : importable client et serveur.
 */

/** [singulier, pluriel] — libellés destinés aux avocats, pas aux devs. */
const NODE_LABELS: Record<string, [string, string]> = {
  table: ["tableau", "tableaux"],
  tableRow: ["ligne de tableau", "lignes de tableau"],
  tableCell: ["cellule", "cellules"],
  details: ["accordéon", "accordéons"],
  image: ["image", "images"],
  gallery: ["galerie", "galeries"],
  ctaButton: ["bouton", "boutons"],
  linkPreview: ["aperçu de lien", "aperçus de lien"],
  htmlEmbed: ["contenu embarqué", "contenus embarqués"],
  videoEmbed: ["vidéo", "vidéos"],
  youtube: ["vidéo YouTube", "vidéos YouTube"],
  heading: ["titre", "titres"],
  bulletList: ["liste à puces", "listes à puces"],
  orderedList: ["liste numérotée", "listes numérotées"],
  listItem: ["élément de liste", "éléments de liste"],
  blockquote: ["citation", "citations"],
  codeBlock: ["bloc de code", "blocs de code"],
  horizontalRule: ["séparateur", "séparateurs"],
}

/** Nœuds structurants dont la disparition est un vrai dommage éditorial. */
export const TRACKED_NODE_TYPES = Object.keys(NODE_LABELS)

export type NodeLoss = { type: string; before: number; after: number }

type CountableNode = { type?: string; content?: unknown }

/** Compte récursivement les occurrences de chaque type de nœud. */
export function countNodeTypes(
  node: unknown,
  acc: Record<string, number> = {}
): Record<string, number> {
  if (!node || typeof node !== "object") return acc
  const n = node as CountableNode
  if (typeof n.type === "string") acc[n.type] = (acc[n.type] || 0) + 1
  if (Array.isArray(n.content))
    for (const child of n.content) countNodeTypes(child, acc)
  return acc
}

/**
 * Compare deux documents ProseMirror et liste les nœuds suivis qui ont
 * diminué. Retourne un tableau vide si l'un des deux documents manque :
 * sans point de comparaison on ne peut rien affirmer, et bloquer sur une
 * inconnue reviendrait à refaire le gel qu'on vient de supprimer.
 */
export function detectNodeLoss(before: unknown, after: unknown): NodeLoss[] {
  if (!before || typeof before !== "object") return []
  if (!after || typeof after !== "object") return []

  const b = countNodeTypes(before)
  const a = countNodeTypes(after)

  const losses: NodeLoss[] = []
  for (const type of TRACKED_NODE_TYPES) {
    const from = b[type] || 0
    const to = a[type] || 0
    if (to < from) losses.push({ type, before: from, after: to })
  }
  return losses
}

function describe(loss: NodeLoss): string {
  const gone = loss.before - loss.after
  const [one, many] = NODE_LABELS[loss.type] ?? [loss.type, loss.type]
  return `${gone} ${gone > 1 ? many : one}`
}

export function nodeLossMessage(losses: NodeLoss[]): string {
  if (!losses.length) return ""
  return (
    `Cette sauvegarde supprime ${losses.map(describe).join(", ")}. ` +
    "Confirmez si c'est voulu."
  )
}

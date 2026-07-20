/**
 * Types du document ProseMirror (source de vérité du corps d'article).
 *
 * La CONVERSION Ricos → ProseMirror vit dans `scripts/lib/ricos-to-pm.mjs`,
 * exécutée hors-ligne (backfill / vérification). Le site ne convertit jamais
 * à l'exécution : il lit `body_doc` et sert `body_html`, son cache dérivé.
 * Ne pas réintroduire de convertisseur côté site — c'est la duplication qui
 * avait laissé passer la perte des 104 titres d'accordéon.
 */

export type PMMark = { type: string; attrs?: Record<string, unknown> }

export type PMNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: PMNode[]
  marks?: PMMark[]
  text?: string
}

/**
 * Une collection du CMS — la forme commune.
 *
 * `authors`, `categories`, `contact` et `faq` résolvaient chacun les mêmes
 * quatre problèmes, séparément : construire le client, envelopper dans
 * `unstable_cache`, poser un tag, retomber sur le JSON. Quatre modules, quatre
 * occasions de se tromper — et on s'était trompé quatre fois : trois tags
 * n'étaient jamais invalidés, un quatrième n'était attaché à aucun cache,
 * aucun n'avait de fenêtre de revalidation.
 *
 * Ce module ne connaît aucune collection en particulier. Il ne sait que ceci :
 * on interroge une source qui peut se taire, on met en cache ce qu'elle dit,
 * et on retombe sur l'instantané quand elle se tait.
 *
 * Le mapping ligne → domaine reste chez chaque collection : c'est ce qui les
 * distingue vraiment, et le factoriser produirait de la configuration, pas de
 * la profondeur.
 */
import { unstable_cache } from "next/cache"

/**
 * Fenêtre de guérison du repli.
 *
 * Sans elle, une seule requête en échec fige l'instantané JSON indéfiniment —
 * `unstable_cache` persiste même à travers les redéploiements. Ces données se
 * modifient aussi DIRECTEMENT en base (console Supabase), sans passer par une
 * route qui pourrait invalider : la fenêtre est alors le seul chemin de
 * fraîcheur.
 */
export const CMS_REVALIDATE_SECONDS = 3600

export interface CollectionSpec<T> {
  /** Tag de cache Next — sert aussi de nom à la collection. */
  tag: string
  /** Clé de cache, distincte du tag (une collection peut avoir plusieurs vues). */
  key: string[]
  /** Interroge la source. `null` = source muette, pas « vide ». */
  fromDb: () => Promise<T | null>
  /** L'instantané JSON. Doit toujours répondre. */
  fallback: () => T
  /** Défaut : `CMS_REVALIDATE_SECONDS`. */
  revalidate?: number
}

/**
 * Assemble une collection et renvoie son résolveur.
 *
 * La précédence — source puis instantané — est écrite ICI, une fois, et non
 * dans chaque module.
 */
export function defineCollection<T>(spec: CollectionSpec<T>): () => Promise<T> {
  const cached = unstable_cache(spec.fromDb, spec.key, {
    tags: [spec.tag],
    revalidate: spec.revalidate ?? CMS_REVALIDATE_SECONDS,
  })
  return async function resolve(): Promise<T> {
    return (await cached()) ?? spec.fallback()
  }
}

export interface KeyedCollectionSpec<T> {
  tag: string
  key: string[]
  fromDb: (id: string) => Promise<T | null>
  fallback: (id: string) => T
  revalidate?: number
}

/**
 * Même contrat, mais indexé — une entrée de cache par identifiant (la FAQ,
 * découpée par expertise). Le tag reste commun : éditer une FAQ invalide
 * toutes les expertises d'un coup, ce qui est le comportement voulu.
 */
export function defineKeyedCollection<T>(
  spec: KeyedCollectionSpec<T>
): (id: string) => Promise<T> {
  return async function resolve(id: string): Promise<T> {
    const cached = unstable_cache(() => spec.fromDb(id), [...spec.key, id], {
      tags: [spec.tag],
      revalidate: spec.revalidate ?? CMS_REVALIDATE_SECONDS,
    })
    return (await cached()) ?? spec.fallback(id)
  }
}

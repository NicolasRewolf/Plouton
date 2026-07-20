/**
 * Ce que l'éditeur envoie — les règles, écrites une fois.
 *
 * L'admin et l'API dérivaient les mêmes valeurs, chacun de son côté, avec des
 * règles qui divergeaient : deux slugifications incompatibles (le client
 * retirait les accents, le serveur les gardait), deux défauts de rubrique,
 * deux horodatages de relecture, et des paragraphes recalculés par le client
 * que le serveur jetait aussitôt pour les refaire lui-même.
 *
 * La règle est simple et vaut pour tout ce fichier : **le client décrit ce que
 * l'avocat a saisi, le serveur en dérive tout le reste.** Ce qui est ici est
 * ce que les deux doivent connaître pour parler de la même chose ; le reste
 * (assainissement HTML, paragraphes, identifiants de rubrique) appartient au
 * serveur seul et n'a pas à traverser le réseau.
 *
 * Module isomorphe : aucun accès disque, base ou DOM.
 */

import { isPostStatus, resolvePersistStatus, type PostStatus } from "@/lib/post-status"

/** Rubrique par défaut — la même des deux côtés, forcément. */
export const DEFAULT_CATEGORY = "Ressources et notions juridiques"

/**
 * Titre → slug.
 *
 * Les accents sont CONSERVÉS : les 422 articles migrés depuis Wix les portent
 * (`affaire-chahinez-un-féminicide-qui-aurait-pu-être-évité`), et leurs URL
 * sont indexées. Un nouvel article sans accents serait le seul de son espèce,
 * et l'ancienne règle client — qui décomposait en NFD pour les retirer — aurait
 * fini par produire deux conventions dans le même blog.
 */
export function slugifyTitle(title: string): string {
  return normalizeSlug(title)
}

/** Normalise un slug déjà saisi (même règle, pour ne pas en avoir deux). */
export function normalizeSlug(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[^a-z0-9-àâäéèêëïîôùûüçœ]/gi, "-")
    .toLowerCase()
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

export type StatusRead =
  | { ok: true; status: PostStatus }
  | { ok: false; message: string }

/**
 * Statut absent = brouillon (cas légitime d'une création). Statut FOURNI mais
 * non reconnu = refus : le coercer silencieusement en « draft » faisait
 * dépublier un article en répondant 200 OK.
 */
export function readStatus(raw: unknown, publishedAt?: string): StatusRead {
  if (raw === undefined || raw === null || raw === "")
    return { ok: true, status: resolvePersistStatus("draft", publishedAt) }
  if (!isPostStatus(raw))
    return {
      ok: false,
      message: `Statut inconnu « ${String(raw)} ». Attendu : draft, published, scheduled ou archived.`,
    }
  return { ok: true, status: resolvePersistStatus(raw, publishedAt) }
}

/**
 * Ce que l'éditeur a le droit d'envoyer.
 *
 * Volontairement plus étroit que `Article` : `body`, `bodyHtml`,
 * `categoryIds`, `url`, `viewCount`, `wixId` et `reviewedAt` en sont absents
 * parce que le serveur les dérive. Les laisser passer, c'était accepter qu'un
 * client puisse écraser un compteur de vues ou une URL canonique en glissant
 * un champ de plus dans le JSON.
 */
export interface ArticleSubmission {
  slug: string
  title: string
  excerpt?: string
  status?: PostStatus
  publishedAt?: string
  author?: string
  authorId?: string
  authorSlug?: string
  reviewerSlug?: string
  categories?: string[]
  metaTitle?: string
  metaDescription?: string
  coverImage?: string | null
  tags?: string[]
  minutesToRead?: number | null
  /** Source du corps. Le HTML en est dérivé côté serveur, jamais l'inverse. */
  bodyDoc?: Record<string, unknown> | null
  /** Toléré pour les articles hérités sans `bodyDoc`. */
  bodyHtml?: string
  /** Confirme une suppression de contenu déjà signalée par le serveur. */
  confirmContentLoss?: boolean
}

export type FieldError = { field: string; message: string }

/**
 * Contrôles de FORME, sans base ni disque : ce qu'on peut refuser avant même
 * d'interroger quoi que ce soit. L'existence de l'auteur ou du slug se vérifie
 * côté serveur, elle ne relève pas d'ici.
 */
export function validateSubmission(
  input: unknown,
  opts: { requireTitle?: boolean } = {}
): { ok: true; value: ArticleSubmission } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = []
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { ok: false, errors: [{ field: "_", message: "corps JSON illisible" }] }

  const b = input as Record<string, unknown>

  if (typeof b.slug !== "string" || !b.slug.trim())
    errors.push({ field: "slug", message: "slug requis" })

  if (opts.requireTitle && (typeof b.title !== "string" || !b.title.trim()))
    errors.push({ field: "title", message: "titre requis" })
  else if (b.title !== undefined && typeof b.title !== "string")
    errors.push({ field: "title", message: "le titre doit être du texte" })

  // `categories: "droit"` passait : une chaîne a bien une `.length` non nulle,
  // et finissait itérée caractère par caractère.
  if (b.categories !== undefined && !Array.isArray(b.categories))
    errors.push({ field: "categories", message: "categories doit être une liste" })

  if (b.tags !== undefined && !Array.isArray(b.tags))
    errors.push({ field: "tags", message: "tags doit être une liste" })

  if (
    b.bodyDoc !== undefined &&
    b.bodyDoc !== null &&
    (typeof b.bodyDoc !== "object" || Array.isArray(b.bodyDoc))
  )
    errors.push({ field: "bodyDoc", message: "bodyDoc doit être un document" })

  const status = readStatus(b.status, typeof b.publishedAt === "string" ? b.publishedAt : undefined)
  if (!status.ok) errors.push({ field: "status", message: status.message })

  if (errors.length) return { ok: false, errors }

  return { ok: true, value: b as unknown as ArticleSubmission }
}

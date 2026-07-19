/**
 * Statuts article (admin + DB).
 * - draft / published : classiques
 * - archived : soft-delete (hors listes publiques)
 * - scheduled : publié dès que published_at <= aujourd’hui
 */

export type PostStatus = "draft" | "published" | "archived" | "scheduled"

export function isPostStatus(v: unknown): v is PostStatus {
  return (
    v === "draft" ||
    v === "published" ||
    v === "archived" ||
    v === "scheduled"
  )
}

/** Date du jour (UTC) YYYY-MM-DD. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Statut à persister :
 * - published + date future → scheduled
 * - scheduled + date passée/aujourd’hui → published
 */
export function resolvePersistStatus(
  status: PostStatus,
  publishedAt: string | undefined
): PostStatus {
  if (status === "archived" || status === "draft") return status
  const day = (publishedAt || todayIsoDate()).slice(0, 10)
  const today = todayIsoDate()
  if (status === "published" && day > today) return "scheduled"
  if (status === "scheduled" && day <= today) return "published"
  return status
}

/** Visible sur le site public ? */
export function isPubliclyVisible(
  status: PostStatus,
  publishedAt: string | undefined
): boolean {
  if (status === "published") return true
  if (status === "scheduled") {
    const day = (publishedAt || "").slice(0, 10)
    return Boolean(day) && day <= todayIsoDate()
  }
  return false
}

export function statusLabel(status: PostStatus): string {
  if (status === "published") return "Publié"
  if (status === "archived") return "Archivé"
  if (status === "scheduled") return "Programmé"
  return "Brouillon"
}

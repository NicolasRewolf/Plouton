import { refus, routeAdmin } from "@/lib/admin-route"
import {
  getPostVersion,
  insertPostVersion,
  listPostVersions,
} from "@/lib/posts-db"
import { resolveAnyArticle } from "@/lib/posts-public"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"


/** GET ?slug=… — liste des versions. POST { versionId } — restaurer. */
export const GET = routeAdmin(async ({ requis }) => {
  const slug = requis("slug")
  const rows = await listPostVersions(slug)
  // Table absente ou requête en échec : l'historique est une commodité, pas
  // une donnée dont l'écran dépend. On rend une liste vide plutôt qu'un refus.
  if (!rows) return { versions: [] }
  return {
    versions: rows.map((v) => ({
      id: v.id,
      createdAt: v.created_at,
      title: v.title,
      authorEmail: v.author_email,
    })),
  }
})

export const POST = routeAdmin(async ({ user, corps }) => {
  const body = await corps<{ versionId?: number }>()
  if (!body.versionId) refus(400, "versionId requis", "CHAMP_MANQUANT")

  const version = await getPostVersion(body.versionId)
  if (!version) refus(404, "version introuvable", "INTROUVABLE")

  const current = await resolveAnyArticle(version.post_slug)
  if (!current) refus(404, "article introuvable", "INTROUVABLE")

  // Snapshot de l'état actuel avant restauration
  await insertPostVersion({
    slug: version.post_slug,
    article: current,
    authorEmail: user.email,
  })

  // Restaurer la source (`body_doc`) et non le seul cache HTML : sinon la
  // sauvegarde suivante régénère le HTML depuis le body_doc resté courant et
  // annule la restauration en silence. Les versions antérieures à la migration
  // 0012 n'ont pas de body_doc — on retombe alors sur le HTML seul.
  const restoredDoc = version.body_doc ?? null
  const restored = {
    ...current,
    title: version.title || current.title,
    categories: version.categories || current.categories,
    // `|| undefined` effaçait une meta existante quand la version n'en avait
    // pas ; on ne retire une valeur que si la version en portait vraiment une.
    metaTitle: version.meta_title ?? current.metaTitle,
    metaDescription: version.meta_description ?? current.metaDescription,
    bodyHtml: version.body_html || current.bodyHtml,
    bodyDoc: restoredDoc ?? current.bodyDoc,
    body: (Array.isArray(version.body)
      ? version.body
      : current.body) as typeof current.body,
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  await getStore().saveArticle(restored)
  revalidatePostSurfaces(version.post_slug)

  return restored
})

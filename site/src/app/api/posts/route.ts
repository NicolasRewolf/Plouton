import { type Article } from "@/lib/content"
import {
  hasUsableHtml,
  htmlToParagraphs,
  isEditorJsDoc,
} from "@/lib/article-body"
import { isKnownAuthorSlug } from "@/lib/authors-db"
import {
  DEFAULT_CATEGORY,
  normalizeSlug,
  readStatus,
  validateSubmission,
} from "@/lib/article-submission"
import { detectNodeLoss, nodeLossMessage } from "@/lib/post-edit-loss"
import { sanitizeEditorHtml } from "@/lib/tiptap/sanitize"
import { bodyDocToHtml } from "@/lib/tiptap/body-doc"
import { archivePost, insertPostVersion, resolveCategoryIdsFromLabels } from "@/lib/posts-db"
import {
  resolveAdminArticleList,
  resolveAnyArticle,
  resolveBodyDoc,
} from "@/lib/posts-public"
import { revalidatePostSurfaces } from "@/lib/revalidate-posts"
import { getStore } from "@/lib/store"
import { refus, routeAdmin } from "@/lib/admin-route"

export const runtime = "nodejs"



function normalizeIncoming(body: Partial<Article>): Pick<Article, "body" | "bodyHtml" | "bodyDoc"> {
  const doc = body.bodyDoc
  if (doc && typeof doc === "object") {
    const html = sanitizeEditorHtml(bodyDocToHtml(doc))
    return {
      bodyDoc: doc,
      bodyHtml: html,
      body: htmlToParagraphs(html),
    }
  }
  const html = sanitizeEditorHtml((body.bodyHtml || "").trim() || "<p></p>")
  if (hasUsableHtml(html) || html === "<p></p>") {
    return {
      bodyHtml: html,
      body: htmlToParagraphs(html),
      bodyDoc: body.bodyDoc ?? null,
    }
  }
  if (Array.isArray(body.body) && body.body.length)
    return { body: body.body, bodyHtml: body.bodyHtml, bodyDoc: body.bodyDoc ?? null }
  if (isEditorJsDoc(body.body))
    return { body: body.body, bodyHtml: body.bodyHtml, bodyDoc: body.bodyDoc ?? null }
  return { body: ["Contenu à rédiger."], bodyHtml: "<p></p>", bodyDoc: null }
}

/** Erreurs de forme → 400 unique, avec le détail par champ. */
function badRequest(errors: { field: string; message: string }[]): never {
  refus(400, errors.map((e) => e.message).join(" · "), "INVALID_SUBMISSION", { errors })
}

/** P1-A — auteur hors référentiel = refus (plus de GUID libre). */
async function assertAuthorSlug(slug: string | undefined | null): Promise<void> {
  if (!slug?.trim()) return
  const ok = await isKnownAuthorSlug(slug.trim())
  if (ok) return
  refus(
    400,
    `Auteur inconnu « ${slug} ». Choisir dans la liste (pas de saisie libre).`,
    "UNKNOWN_AUTHOR"
  )
}

export const GET = routeAdmin(async ({ params }) => {
  const slug = params.get("slug")
  if (slug) {
    const article = await resolveAnyArticle(slug)
    if (!article) refus(404, "introuvable", "INTROUVABLE")
    return article
  }
  return await resolveAdminArticleList()
})

export const POST = routeAdmin(async ({ corps }) => {
  const raw = await corps<unknown>()
  const parsed = validateSubmission(raw, { requireTitle: true })
  if (!parsed.ok) badRequest(parsed.errors)
  const body = parsed.value

  const slug = normalizeSlug(body.slug)

  // `saveArticle` fait un upsert sur `slug` : sans ce contrôle, créer un
  // article dont le slug existe déjà écrasait l'article en ligne — sans
  // snapshot de version (POST n'en prend pas) et sans garde anti-perte
  // (réservée au PUT). Le seul chemin de destruction totale et silencieuse.
  const existing = await resolveAnyArticle(slug)
  if (existing)
    refus(
      409,
      `Un article existe déjà à l'adresse « ${slug} ». Choisissez un autre titre, ou ouvrez l'article existant pour le modifier.`,
      "SLUG_TAKEN"
    )

  const authorSlug = body.authorSlug || body.authorId
  await assertAuthorSlug(authorSlug)

  const publishedAt = body.publishedAt || new Date().toISOString().slice(0, 10)
  const statusRead = readStatus(body.status, publishedAt)
  if (!statusRead.ok) badRequest([{ field: "status", message: statusRead.message }])
  const normalized = normalizeIncoming(body)
  const categories = body.categories?.length ? body.categories : [DEFAULT_CATEGORY]
  // Les identifiants de rubrique sont DÉRIVÉS, jamais reçus : les accepter du
  // client, c'était le laisser rattacher un article à n'importe quelle rubrique.
  const categoryIds = await resolveCategoryIdsFromLabels(categories)
  const article: Article = {
    slug,
    title: body.title,
    excerpt: body.excerpt || "",
    publishedAt,
    status: statusRead.status,
    author: body.author || "Cabinet Plouton",
    authorId: body.authorId,
    authorSlug,
    categories,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    bodyDoc: normalized.bodyDoc,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    coverImage: body.coverImage,
    tags: body.tags,
    categoryIds,
    minutesToRead: body.minutesToRead,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  await getStore().saveArticle(article)
  revalidatePostSurfaces(article.slug)
  return article
})

export const PUT = routeAdmin(async ({ user, corps }) => {
  const raw = await corps<unknown>()
  const parsed = validateSubmission(raw)
  if (!parsed.ok) badRequest(parsed.errors)
  const body = parsed.value

  const previous = await resolveAnyArticle(body.slug)

  const normalized = normalizeIncoming(body)

  // Alerte sur une perte MESURÉE (et non pronostiquée par nom de balise).
  // Se place avant toute écriture : une sauvegarde refusée ne doit pas
  // laisser de version d'archive derrière elle.
  if (previous && !body.confirmContentLoss) {
    const losses = detectNodeLoss(resolveBodyDoc(previous), normalized.bodyDoc)
    if (losses.length) {
      refus(409, nodeLossMessage(losses), "CONTENT_LOSS", { losses })
    }
  }

  // Toute la validation AVANT la moindre écriture. L'archivage de version se
  // faisait auparavant avant ces contrôles : un PUT refusé pour auteur inconnu
  // répondait 400 mais avait déjà laissé une version derrière lui.
  const publishedAt = body.publishedAt || new Date().toISOString().slice(0, 10)
  const categories = body.categories?.length
    ? body.categories
    : previous?.categories?.length
      ? previous.categories
      : [DEFAULT_CATEGORY]
  const categoryIds = await resolveCategoryIdsFromLabels(categories)
  const authorSlug = body.authorSlug || body.authorId || previous?.authorSlug
  await assertAuthorSlug(authorSlug)
  const reviewerSlug = body.reviewerSlug || previous?.reviewerSlug
  await assertAuthorSlug(reviewerSlug)
  const statusRead = readStatus(body.status, publishedAt)
  if (!statusRead.ok) badRequest([{ field: "status", message: statusRead.message }])

  if (previous) {
    await insertPostVersion({
      slug: body.slug,
      article: previous,
      authorEmail: user.email,
    })
  }

  // Construit CHAMP PAR CHAMP, plus par étalement du corps reçu.
  // `{ ...body }` laissait le client écrire n'importe quelle colonne — un
  // compteur de vues, une URL canonique, une date de relecture antidatée —
  // en glissant simplement un champ de plus dans le JSON. Ce qui n'est pas
  // saisi par l'avocat vient désormais de l'article existant, ou du serveur.
  const article: Article = {
    slug: body.slug,
    title: body.title ?? previous?.title ?? "",
    excerpt: body.excerpt ?? previous?.excerpt ?? "",
    publishedAt,
    status: statusRead.status,
    author: body.author ?? previous?.author ?? "Cabinet Plouton",
    authorId: body.authorId || previous?.authorId,
    authorSlug,
    reviewerSlug: reviewerSlug || undefined,
    // Horodatage posé par le SERVEUR : une relecture ne s'antidate pas.
    reviewedAt: reviewerSlug
      ? previous?.reviewerSlug === reviewerSlug && previous?.reviewedAt
        ? previous.reviewedAt
        : new Date().toISOString()
      : undefined,
    categories,
    categoryIds,
    tags: body.tags ?? previous?.tags,
    metaTitle: body.metaTitle ?? previous?.metaTitle,
    metaDescription: body.metaDescription ?? previous?.metaDescription,
    coverImage: body.coverImage ?? previous?.coverImage,
    minutesToRead: body.minutesToRead ?? previous?.minutesToRead,
    // Dérivés ou hérités — jamais reçus du client.
    url: previous?.url,
    wixId: previous?.wixId,
    viewCount: previous?.viewCount,
    body: normalized.body,
    bodyHtml: normalized.bodyHtml,
    bodyDoc: normalized.bodyDoc,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  await getStore().saveArticle(article)
  revalidatePostSurfaces(article.slug)
  return article
})

/** Soft-delete : status → archived */
export const DELETE = routeAdmin(async ({ requis }) => {
  const slug = requis("slug")

  const ok = await archivePost(slug)
  if (!ok) {
    // Fallback FsStore : marquer archived via save
    const existing = await resolveAnyArticle(slug)
    if (!existing) refus(404, "introuvable", "INTROUVABLE")
    await getStore().saveArticle({ ...existing, status: "archived" })
  }
  revalidatePostSurfaces(slug)
  // Donnée lue par le client, pas une enveloppe : l'admin affiche l'état atteint.
  return { ok: true, status: "archived" }
})

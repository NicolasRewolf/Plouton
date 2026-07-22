import { NextResponse } from "next/server"
import {
  createFaq,
  deleteFaq,
  getFaqById,
  listFaqAdmin,
  updateFaq,
  type FaqStatus,
} from "@/lib/faq-db"
import { FAQ_EXPERTISE_OPTIONS } from "@/lib/faq-expertises"
import { expertisePathFor } from "@/lib/registry"
import { revalidatePath, revalidateTag } from "next/cache"
import { FAQ_CACHE_TAG } from "@/lib/faq-db"
import { refus, routeAdmin } from "@/lib/admin-route"

export const runtime = "nodejs"


function isValidSlug(slug: string): boolean {
  return FAQ_EXPERTISE_OPTIONS.some((o) => o.slug === slug)
}

/**
 * Une FAQ n'apparaît que sur la page de son expertise.
 *
 * Ce chemin n'était pas calculable ici — « path varie par pôle » disait le
 * commentaire — alors on invalidait `/` en `layout`, c'est-à-dire le site
 * entier : une seule question modifiée périmait les 422 articles et les 87
 * pages. Le registry sait pourtant répondre, et `expertisePathFor` le lui
 * demande maintenant.
 *
 * Repli assumé : slug inconnu du registry → invalidation large. Un cache trop
 * froid coûte du calcul, une page qui ne se met jamais à jour coûte un
 * mensonge affiché à un justiciable.
 */
function revalidateFaqSurfaces(expertiseSlug?: string) {
  revalidateTag(FAQ_CACHE_TAG, "max")
  if (!expertiseSlug) return

  const path = expertisePathFor(expertiseSlug)
  if (path) revalidatePath(path)
  else revalidatePath("/", "layout")
}

export const GET = routeAdmin(async ({ params }) => {
  const id = params.get("id")
  if (id) {
    const item = await getFaqById(id)
    if (!item) refus(404, "introuvable", "INTROUVABLE")
    return item
  }

  const q = params.get("q") || undefined
  const expertiseSlug = params.get("expertise") || undefined
  const statusRaw = params.get("status") || "all"
  const status =
    statusRaw === "draft" || statusRaw === "published" || statusRaw === "all"
      ? (statusRaw as FaqStatus | "all")
      : "all"
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(params.get("pageSize") || "40", 10) || 40)
  )

  const result = await listFaqAdmin({
    q,
    expertiseSlug: expertiseSlug || undefined,
    status,
    page,
    pageSize,
  })
  if (!result) refus(503, "base FAQ indisponible (clé Supabase ?)", "BASE_INDISPONIBLE")
  return result
})

export const POST = routeAdmin(async ({ corps }) => {
  const body = await corps<{
    question?: string
    answer?: string
    expertiseSlug?: string
    sousExpertise?: string | null
    status?: FaqStatus
    likes?: number
    sortOrder?: number | null
  }>()

  if (!body.question?.trim() || !body.answer?.trim())
    refus(400, "question et réponse requises", "CHAMP_MANQUANT")
  if (!body.expertiseSlug || !isValidSlug(body.expertiseSlug))
    refus(400, "expertise invalide", "EXPERTISE_INVALIDE")

  const created = await createFaq({
    question: body.question,
    answer: body.answer,
    expertiseSlug: body.expertiseSlug,
    sousExpertise: body.sousExpertise,
    status: body.status === "draft" ? "draft" : "published",
    likes: body.likes,
    sortOrder: body.sortOrder,
  })
  if (!created) refus(500, "création impossible", "ECRITURE_IMPOSSIBLE")

  revalidateFaqSurfaces(created.expertiseSlug)
  return NextResponse.json(created, { status: 201 })
})

export const PATCH = routeAdmin(async ({ corps }) => {
  const body = await corps<{
    id?: string
    question?: string
    answer?: string
    expertiseSlug?: string
    sousExpertise?: string | null
    status?: FaqStatus
    likes?: number
    sortOrder?: number | null
  }>()

  if (!body.id) refus(400, "id requis", "CHAMP_MANQUANT")
  if (body.expertiseSlug !== undefined && !isValidSlug(body.expertiseSlug))
    refus(400, "expertise invalide", "EXPERTISE_INVALIDE")

  const updated = await updateFaq(body.id, {
    question: body.question,
    answer: body.answer,
    expertiseSlug: body.expertiseSlug,
    sousExpertise: body.sousExpertise,
    status: body.status,
    likes: body.likes,
    sortOrder: body.sortOrder,
  })
  if (!updated) refus(500, "mise à jour impossible", "ECRITURE_IMPOSSIBLE")

  revalidateFaqSurfaces(updated.expertiseSlug)
  return updated
})

export const DELETE = routeAdmin(async ({ requis }) => {
  const id = requis("id")

  const existing = await getFaqById(id)
  const ok = await deleteFaq(id)
  if (!ok) refus(500, "suppression impossible", "ECRITURE_IMPOSSIBLE")

  revalidateFaqSurfaces(existing?.expertiseSlug)
  return { ok: true }
})

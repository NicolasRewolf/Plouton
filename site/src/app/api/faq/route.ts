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
import { revalidatePath, revalidateTag } from "next/cache"
import { FAQ_CACHE_TAG } from "@/lib/faq-db"
import { requireAdmin } from "@/lib/require-admin"

export const runtime = "nodejs"


function isValidSlug(slug: string): boolean {
  return FAQ_EXPERTISE_OPTIONS.some((o) => o.slug === slug)
}

function revalidateFaqSurfaces(expertiseSlug?: string) {
  revalidateTag(FAQ_CACHE_TAG, "max")
  if (expertiseSlug) {
    // Pages expertise : path varie par pôle — revalidate large
    revalidatePath("/", "layout")
  }
}

export async function GET(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getFaqById(id)
    if (!item) return NextResponse.json({ error: "introuvable" }, { status: 404 })
    return NextResponse.json(item)
  }

  const q = searchParams.get("q") || undefined
  const expertiseSlug = searchParams.get("expertise") || undefined
  const statusRaw = searchParams.get("status") || "all"
  const status =
    statusRaw === "draft" || statusRaw === "published" || statusRaw === "all"
      ? (statusRaw as FaqStatus | "all")
      : "all"
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") || "40", 10) || 40)
  )

  const result = await listFaqAdmin({
    q,
    expertiseSlug: expertiseSlug || undefined,
    status,
    page,
    pageSize,
  })
  if (!result)
    return NextResponse.json(
      { error: "base FAQ indisponible (clé Supabase ?)" },
      { status: 503 }
    )
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as {
    question?: string
    answer?: string
    expertiseSlug?: string
    sousExpertise?: string | null
    status?: FaqStatus
    likes?: number
    sortOrder?: number | null
  }

  if (!body.question?.trim() || !body.answer?.trim())
    return NextResponse.json(
      { error: "question et réponse requises" },
      { status: 400 }
    )
  if (!body.expertiseSlug || !isValidSlug(body.expertiseSlug))
    return NextResponse.json({ error: "expertise invalide" }, { status: 400 })

  const created = await createFaq({
    question: body.question,
    answer: body.answer,
    expertiseSlug: body.expertiseSlug,
    sousExpertise: body.sousExpertise,
    status: body.status === "draft" ? "draft" : "published",
    likes: body.likes,
    sortOrder: body.sortOrder,
  })
  if (!created)
    return NextResponse.json({ error: "création impossible" }, { status: 500 })

  revalidateFaqSurfaces(created.expertiseSlug)
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const body = (await req.json()) as {
    id?: string
    question?: string
    answer?: string
    expertiseSlug?: string
    sousExpertise?: string | null
    status?: FaqStatus
    likes?: number
    sortOrder?: number | null
  }

  if (!body.id)
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  if (body.expertiseSlug !== undefined && !isValidSlug(body.expertiseSlug))
    return NextResponse.json({ error: "expertise invalide" }, { status: 400 })

  const updated = await updateFaq(body.id, {
    question: body.question,
    answer: body.answer,
    expertiseSlug: body.expertiseSlug,
    sousExpertise: body.sousExpertise,
    status: body.status,
    likes: body.likes,
    sortOrder: body.sortOrder,
  })
  if (!updated)
    return NextResponse.json({ error: "mise à jour impossible" }, { status: 500 })

  revalidateFaqSurfaces(updated.expertiseSlug)
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const existing = await getFaqById(id)
  const ok = await deleteFaq(id)
  if (!ok) return NextResponse.json({ error: "suppression impossible" }, { status: 500 })

  revalidateFaqSurfaces(existing?.expertiseSlug)
  return NextResponse.json({ ok: true })
}

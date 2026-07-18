import { NextResponse } from "next/server"
import { intakeDemande } from "@/lib/demande-intake"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 })
  }

  const intake = intakeDemande(raw)
  if (!intake.ok)
    return NextResponse.json({ ok: false, error: intake.error }, { status: intake.status })

  try {
    const { id } = await getStore().createDemande(intake.data)
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error("createDemande failed:", e)
    return NextResponse.json(
      { ok: false, error: "Enregistrement indisponible — appelez le cabinet." },
      { status: 503 }
    )
  }
}

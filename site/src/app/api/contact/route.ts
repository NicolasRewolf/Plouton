import { NextResponse } from "next/server"
import { getStore, type DemandeInput } from "@/lib/store"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const data = (await req.json()) as DemandeInput
  try {
    const { id } = await getStore().createDemande(data)
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error("createDemande failed:", e)
    return NextResponse.json(
      { ok: false, error: "Enregistrement indisponible — appelez le cabinet." },
      { status: 503 }
    )
  }
}

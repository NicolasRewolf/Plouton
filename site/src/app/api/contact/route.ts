import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const data = await req.json()
  const dir = path.join(process.cwd(), "..", "contenu", "demandes")
  fs.mkdirSync(dir, { recursive: true })
  const id = `demande-${Date.now()}`
  const file = path.join(dir, `${id}.json`)
  fs.writeFileSync(
    file,
    JSON.stringify({ id, receivedAt: new Date().toISOString(), ...data }, null, 2) + "\n"
  )
  return NextResponse.json({ ok: true, id })
}

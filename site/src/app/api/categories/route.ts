import { NextResponse } from "next/server"
import { getCategories } from "@/lib/content"

export const runtime = "nodejs"

/** Liste fermée des catégories blog (labels). */
export async function GET() {
  const cats = getCategories().map((c) => ({
    id: c.id,
    label: c.label,
    slug: c.slug,
  }))
  return NextResponse.json(cats)
}

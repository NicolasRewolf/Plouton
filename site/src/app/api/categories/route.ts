import { NextResponse } from "next/server"
import { resolveCategories } from "@/lib/categories-db"
import { getCategories } from "@/lib/content"

export const runtime = "nodejs"

/** Liste fermée des catégories blog (DB puis JSON). */
export async function GET() {
  try {
    const cats = await resolveCategories()
    return NextResponse.json(
      cats.map((c) => ({
        id: c.id,
        label: c.label,
        slug: c.slug,
        postCount: c.postCount,
      }))
    )
  } catch {
    return NextResponse.json(
      getCategories().map((c) => ({
        id: c.id,
        label: c.label,
        slug: c.slug,
        postCount: c.postCount,
      }))
    )
  }
}

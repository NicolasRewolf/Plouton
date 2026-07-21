import { routeAdmin } from "@/lib/admin-route"
import { resolveAuthors } from "@/lib/authors-db"
import { listAuthors } from "@/lib/content"

export const runtime = "nodejs"


/** Liste auteurs pour le select admin (P1-A). */
export const GET = routeAdmin(async () => {
  try {
    const authors = await resolveAuthors()
    return authors.map((a) => ({
      id: a.id,
      shortName: a.shortName,
      displayName: a.displayName,
    }))
  } catch {
    return listAuthors().map((a) => ({
      id: a.id,
      shortName: a.shortName,
      displayName: a.displayName,
    }))
  }
})

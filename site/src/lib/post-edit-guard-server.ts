/**
 * P0-A — Gel édition (serveur) : Ricos git + HTML.
 * Ne jamais importer depuis un composant client.
 */
import { getRicos } from "@/lib/content"
import {
  assessHtmlEditRisk,
  collectRicosRisks,
  mergeEditRisks,
  type EditGuardResult,
  type RicosLike,
} from "@/lib/post-edit-guard"

export function assessEditRisk(
  slug: string,
  bodyHtml?: string | null
): EditGuardResult {
  const reasons = new Set<string>()
  let source: EditGuardResult["source"] = "none"

  const pack = getRicos(slug)
  if (pack?.ricos?.nodes) {
    collectRicosRisks(pack.ricos.nodes as RicosLike[], reasons)
    if (reasons.size) source = "ricos"
  }

  const htmlPart = assessHtmlEditRisk(bodyHtml)
  return mergeEditRisks(
    { blocked: reasons.size > 0, reasons: [...reasons], source },
    htmlPart
  )
}

export { editGuardMessage } from "@/lib/post-edit-guard"

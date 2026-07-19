/**
 * P0-A — Empêche la destruction silencieuse des articles à markup riche.
 * TipTap actuel ne sait pas rouvrir TABLE / accordéons / galeries / etc.
 * Dès qu’on sauvegarde, preferDbBody bascule sur un HTML amputé.
 *
 * Version **sans FS** (safe client + serveur). La couche Ricos est dans
 * `post-edit-guard-server.ts` (API uniquement).
 */

/** Types Ricos que TipTap 3.28 (schéma actuel) ne peut pas round-tripper intact. */
export const RICH_RICOS_TYPES = new Set([
  "TABLE",
  "COLLAPSIBLE_LIST",
  "COLLAPSIBLE_ITEM",
  "COLLAPSIBLE_ITEM_TITLE",
  "COLLAPSIBLE_ITEM_BODY",
  "GALLERY",
  "VIDEO",
  "HTML",
  "BUTTON",
  "LINK_PREVIEW",
  "FILE",
  "LAYOUT",
  "LAYOUT_CELL",
  "IMAGE", // images inline perdues au round-trip HTML TipTap basique
])

const RICH_HTML_RE = /<(table|details|figure|iframe|video|h4)\b/i

export type EditGuardResult = {
  blocked: boolean
  reasons: string[]
  source: "ricos" | "html" | "none"
}

export type RicosLike = {
  type?: string
  nodes?: RicosLike[]
  headingData?: { level?: number }
  [key: string]: unknown
}

export function collectRicosRisks(
  nodes: RicosLike[] | undefined,
  out: Set<string>
) {
  for (const n of nodes || []) {
    const t = n.type
    if (t && RICH_RICOS_TYPES.has(t)) out.add(t)
    if (t === "HEADING" && (n.headingData?.level ?? 0) >= 4) out.add("HEADING_H4")
    if (Array.isArray(n.nodes)) collectRicosRisks(n.nodes, out)
    for (const v of Object.values(n)) {
      if (
        Array.isArray(v) &&
        v[0] &&
        typeof v[0] === "object" &&
        "type" in (v[0] as object)
      )
        collectRicosRisks(v as RicosLike[], out)
    }
  }
}

/** Risque HTML seul (safe navigateur). */
export function assessHtmlEditRisk(bodyHtml?: string | null): EditGuardResult {
  const reasons = new Set<string>()
  const html = (bodyHtml || "").trim()
  if (html && RICH_HTML_RE.test(html)) {
    const tags = html.match(/<(table|details|figure|iframe|video|h4)\b/gi) || []
    for (const t of tags)
      reasons.add(`html:${t.replace(/[<\s]/g, "").toLowerCase()}`)
  }
  return {
    blocked: reasons.size > 0,
    reasons: [...reasons].sort(),
    source: reasons.size ? "html" : "none",
  }
}

export function mergeEditRisks(
  ...parts: EditGuardResult[]
): EditGuardResult {
  const reasons = new Set<string>()
  let source: EditGuardResult["source"] = "none"
  for (const p of parts) {
    for (const r of p.reasons) reasons.add(r)
    if (p.source === "ricos") source = "ricos"
    else if (p.source === "html" && source === "none") source = "html"
  }
  return {
    blocked: reasons.size > 0,
    reasons: [...reasons].sort(),
    source,
  }
}

export function editGuardMessage(result: EditGuardResult): string {
  return (
    "Édition gelée : cet article contient du contenu riche " +
    `(${result.reasons.slice(0, 8).join(", ")}${result.reasons.length > 8 ? "…" : ""}) ` +
    "que l’éditeur actuel détruirait à la sauvegarde. " +
    "Passez `forceRichEdit: true` seulement si vous acceptez la perte."
  )
}

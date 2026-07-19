/**
 * Meta description sûre (P0-C) — neutralise les tronquatures d'élision
 * (« L », « Cour d », « Victime d ») issues du crawl baseline cassé.
 */
const ELISION = /\b(l|d|s|n|c|j|m|t|qu|jusqu|aujourd|lorsqu|puisqu)$/i

export function safeMetaDescription(
  metaDescription: string | null | undefined,
  excerpt: string | null | undefined
): string {
  const md = metaDescription?.trim() || ""
  if (md.length >= 80 && !ELISION.test(md)) return md
  const ex = (excerpt || "").trim()
  if (ex.length >= 40) {
    if (ex.length <= 160) return ex
    const cut = ex.slice(0, 157)
    const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" "))
    return (last > 80 ? cut.slice(0, last) : cut).trim() + "…"
  }
  return md.length > 0 && !ELISION.test(md) ? md : ""
}

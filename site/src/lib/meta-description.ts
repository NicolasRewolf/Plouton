/**
 * Meta description sûre (P0-C) — neutralise les tronquatures d'élision
 * (« L », « Cour d », « Victime d ») issues du crawl baseline cassé.
 */
/**
 * Une description coupée juste après une particule élidée — « … devant la
 * Cour d », « Victime d ». La particule doit être un mot ENTIER en fin de
 * chaîne, d'où l'exigence d'une espace (ou d'une apostrophe) devant elle.
 *
 * On ne peut pas s'en remettre à `\b` : en JavaScript, `\b` ne connaît que
 * l'ASCII, donc il voit une frontière de mot entre « é » et « s ». `\b(s)$`
 * matchait ainsi « salariés », « reprochés », et tout mot français finissant
 * par une lettre accentuée suivie d'une de ces consonnes. Mesuré sur les 422
 * articles : 3 chaînes prises pour des troncatures, et **aucune vraie
 * troncature** — la protection ne protégeait rien et provoquait des replis
 * inutiles. Corrigé sans qu'aucune des 422 descriptions servies ne change.
 */
const ELISION = /(?:^|[\s'’])(l|d|s|n|c|j|m|t|qu|jusqu|aujourd|lorsqu|puisqu)$/i

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

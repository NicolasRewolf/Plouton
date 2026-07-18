/** Pure category matching — safe for client + server. */

export function labelsOverlap(
  articleCategories: string[],
  wantedLabels: string[]
): boolean {
  if (!wantedLabels.length) return false
  const wanted = wantedLabels.map((s) => s.toLowerCase().normalize("NFC").trim())
  return articleCategories.some((c) =>
    wanted.includes(c.toLowerCase().normalize("NFC").trim())
  )
}

export function labelEquals(a: string, b: string) {
  return a.toLowerCase().normalize("NFC").trim() === b.toLowerCase().normalize("NFC").trim()
}

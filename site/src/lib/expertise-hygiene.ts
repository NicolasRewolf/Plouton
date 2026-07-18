/**
 * Legacy scrape blocks (FAQ / affaires / RDV scrapés) — hygiene shared by
 * loader + check script. Prefer stripping at ingest; runtime keeps as safety net.
 */
export function isLegacyScrapedBlock(id: string, labelOrTitle?: string | null) {
  const key = `${id} ${labelOrTitle || ""}`.toLowerCase()
  if (id === "contact") return false
  return (
    id === "faq" ||
    id === "affaires" ||
    /foire-aux-questions|questions-frequentes|affaires-recentes|nos-affaires-recentes|les-dernieres-affaires|actualites|je-prends-rendez-vous|rendez-vous-maintenant|rendez-vous-pour/.test(
      id
    ) ||
    /foire aux questions|questions fr[eé]quentes|affaires r[eé]centes|nos affaires r[eé]centes|derni[eè]res? affaires|^actualit[eé]s|^je prends rendez-vous/.test(
      key
    )
  )
}

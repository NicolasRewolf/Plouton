/** Cycle de traitement V1 — libellés à affiner avec Alexia (cf. 0001). */
export const STATUTS = ["Nouveau", "En cours", "Traité", "Archivé"]

export function badgeClass(statut: string): string {
  const base = "rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
  switch (statut) {
    case "Nouveau":
      return `${base} bg-accent/10 text-accent`
    case "En cours":
      return `${base} bg-[#f5b400]/15 text-[#8a6d00]`
    case "Traité":
      return `${base} bg-[#067d3f]/10 text-[#067d3f]`
    default:
      return `${base} bg-navy/10 text-navy`
  }
}

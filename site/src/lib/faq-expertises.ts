/**
 * Slugs d’expertise pour filtres admin FAQ.
 * Source : contenu/reference/poles-registry.json (miroiré ici pour le bundle).
 */
export const FAQ_EXPERTISE_OPTIONS: { slug: string; label: string }[] = [
  { slug: "droit-penal", label: "Droit pénal" },
  { slug: "proces-criminel", label: "Procès criminels" },
  { slug: "trafic-de-stupefiants", label: "Trafic de stupéfiants" },
  {
    slug: "violences-conjugales-et-feminicides",
    label: "Violences conjugales et féminicides",
  },
  { slug: "droit-penal-des-affaires", label: "Droit pénal des affaires" },
  { slug: "defense-des-elus", label: "Défense des élus" },
  { slug: "victimes-de-delits-ou-crimes", label: "Victimes de délits ou crimes" },
  { slug: "accidents-de-la-route", label: "Accidents de la route" },
  {
    slug: "droit-et-accidents-du-travail",
    label: "Droit et accidents du travail",
  },
  {
    slug: "accidents-et-erreurs-medicales",
    label: "Accidents et erreurs médicales",
  },
  { slug: "accidents-de-la-vie-courante", label: "Accidents de la vie courante" },
  {
    slug: "droit-assurances-particuliers-professionnels",
    label: "Droit des assurances",
  },
  { slug: "defense-des-consommateurs", label: "Défense des consommateurs" },
  { slug: "droit-de-la-famille", label: "Droit de la famille" },
  { slug: "divorce", label: "Divorce" },
]

export function faqExpertiseLabel(slug: string): string {
  return FAQ_EXPERTISE_OPTIONS.find((o) => o.slug === slug)?.label || slug
}

/** Navigation desktop / mobile — données pures (importable côté client). */

export interface NavChild {
  label: string
  href: string
  hint?: string
}

export interface NavPole {
  id: string
  label: string
  shortLabel: string
  /** Première page du pôle (clic sur le titre) */
  href: string
  children: NavChild[]
}

export interface NavLink {
  label: string
  href: string
}

export const MEGA_POLES: NavPole[] = [
  {
    id: "defense",
    label: "Défense pénale",
    shortLabel: "Défense pénale",
    href: "/defense-penale/droit-penal",
    children: [
      { label: "Droit pénal", href: "/defense-penale/droit-penal", hint: "Garde à vue, correctionnel, assises" },
      { label: "Procès criminels", href: "/defense-penale/proces-criminel", hint: "Cour d’assises & crimes" },
      {
        label: "Trafic de stupéfiants",
        href: "/defense-penale/trafic-de-stupefiants",
        hint: "Défense des dossiers complexes",
      },
      {
        label: "Violences conjugales et féminicides",
        href: "/defense-penale/violences-conjugales-et-feminicides",
        hint: "Protection & poursuites",
      },
      {
        label: "Droit pénal des affaires",
        href: "/defense-penale/droit-penal-des-affaires",
        hint: "Entreprises & dirigeants",
      },
    ],
  },
  {
    id: "victimes",
    label: "Indemnisation des victimes",
    shortLabel: "Indemnisation",
    href: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
    children: [
      {
        label: "Victimes de délits ou crimes",
        href: "/indemnisation-des-victimes/victimes-de-delits-ou-crimes",
        hint: "Partie civile & CIVI",
      },
      {
        label: "Accidents de la route",
        href: "/indemnisation-des-victimes/accidents-de-la-route",
        hint: "Loi Badinter & préjudices",
      },
      {
        label: "Droit et accidents du travail",
        href: "/indemnisation-des-victimes/droit-et-accidents-du-travail",
        hint: "Faute inexcusable",
      },
      {
        label: "Accidents et erreurs médicales",
        href: "/indemnisation-des-victimes/accidents-et-erreurs-medicales",
        hint: "ONIAM & expertise",
      },
      {
        label: "Accidents de la vie courante",
        href: "/indemnisation-des-victimes/accidents-de-la-vie-courante",
        hint: "Dommages corporels",
      },
    ],
  },
  {
    id: "contrats",
    label: "Droit des contrats et des personnes",
    shortLabel: "Contrats & personnes",
    href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille",
    children: [
      {
        label: "Droit des assurances",
        href: "/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels",
        hint: "Sinistres & litiges",
      },
      {
        label: "Défense des consommateurs",
        href: "/droit-des-contrats-et-des-personnes/defense-des-consommateurs",
        hint: "Crédit, abus, garanties",
      },
      {
        label: "Droit de la famille",
        href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille",
        hint: "Union, enfants, patrimoine",
      },
      {
        label: "Divorce",
        href: "/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux",
        hint: "Stratégie & négociation",
      },
    ],
  },
]

export const SIDE_LINKS: NavLink[] = [
  { label: "Affaires", href: "/nos-affaires" },
  { label: "Médias", href: "/medias" },
  { label: "Ressources", href: "/comprendre-le-droit" },
  { label: "Équipe", href: "/notre-cabinet" },
]

/** Navigation desktop / mobile — adapters du registry (importable côté client). */

export type { NavChild, NavLink, NavPole } from "@/lib/nav-types"

import {
  megaPolesFromRegistry,
  sideLinksFromRegistry,
} from "@/lib/registry"
import type { NavPole } from "@/lib/nav-types"

export const MEGA_POLES = megaPolesFromRegistry()
export const SIDE_LINKS = sideLinksFromRegistry()

/**
 * Entrées RDV du mega-menu — une seule page Next (`/honoraires-rendez-vous`)
 * avec ancres (formulaire, horaires, honoraires, accès).
 */
export const RDV_MEGA: NavPole = {
  id: "rdv",
  label: "Rendez-vous & accès",
  shortLabel: "RDV & accès",
  href: "/honoraires-rendez-vous",
  children: [
    {
      label: "Prise de rendez-vous",
      href: "/honoraires-rendez-vous#formulaire",
      hint: "Formulaire de contact",
    },
    {
      label: "Horaires & accès",
      href: "/honoraires-rendez-vous#horaires",
      hint: "Ouverture, adresse, parking",
    },
    {
      label: "Honoraires",
      href: "/honoraires-rendez-vous#honoraires",
      hint: "Premier rendez-vous et tarifs",
    },
  ],
}

/** Pôles + panneau RDV pour le mega-menu Header. */
export const MEGA_ITEMS: NavPole[] = [...MEGA_POLES, RDV_MEGA]

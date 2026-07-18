/** Navigation desktop / mobile — adapters du registry (importable côté client). */

export type { NavChild, NavLink, NavPole } from "@/lib/nav-types"

import {
  megaPolesFromRegistry,
  sideLinksFromRegistry,
} from "@/lib/registry"

export const MEGA_POLES = megaPolesFromRegistry()
export const SIDE_LINKS = sideLinksFromRegistry()

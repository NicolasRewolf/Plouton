/** Types nav partagés (évite cycle registry ↔ nav). */

export interface NavChild {
  label: string
  href: string
  hint?: string
}

export interface NavPole {
  id: string
  label: string
  shortLabel: string
  href: string
  children: NavChild[]
}

export interface NavLink {
  label: string
  href: string
}

import Link from "next/link"
import type { ReactNode } from "react"

export type SiteCtaVariant = "primary" | "secondary"

interface SiteCtaProps {
  href: string
  children: ReactNode
  /** primary = accent soft ; secondary = navy soft (défaut) */
  variant?: SiteCtaVariant
  /** Affiche la flèche légère (`.btn-pill-icon`) */
  arrow?: boolean
  className?: string
  /** Attributs passés au lien externe (`tel:`, `mailto:`, `http`) */
  target?: string
  rel?: string
}

function isExternalHref(href: string) {
  return (
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  )
}

/**
 * CTA public canonique — encapsule `.btn-pill` / `.btn-pill-primary`.
 * Pas d’autre style de bouton sur les pages publiques (voir docs/16-composants-ui.md).
 */
export function SiteCta({
  href,
  children,
  variant = "secondary",
  arrow = false,
  className = "",
  target,
  rel,
}: SiteCtaProps) {
  const classes = [
    "btn-pill",
    variant === "primary" ? "btn-pill-primary" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  const content = (
    <>
      {children}
      {arrow ? (
        <span className="btn-pill-icon" aria-hidden>
          →
        </span>
      ) : null}
    </>
  )

  if (isExternalHref(href))
    return (
      <a href={href} className={classes} target={target} rel={rel}>
        {content}
      </a>
    )

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  )
}

import Link from "next/link"
import type { ReactNode } from "react"
import { SiteCta } from "@/components/SiteCta"
import { getSite } from "@/lib/content"
import { megaPolesFromRegistry } from "@/lib/registry"
import type { NavLink } from "@/lib/nav-types"

/**
 * Footer fidèle au live Wix — toutes les valeurs viennent des specs mesurées
 * (contenu/reference/mentions/{375,768,1440}/spec.json) :
 * bande #F0F0F0 (--wix-color-16) pleine largeur ; « Contact » 60/120px ;
 * ligne horaires 22px (18px à 1440+) avec adresse corail ; pilules corail ;
 * grille de liens 1→2→4 colonnes (têtes 22px/35.2 puis 14px/22.4 à 1440+,
 * items 14px/22.4 au pas de 38px, groupes espacés de 65px) ; à 768 le live
 * appaire [Menu, Indemnisation] puis [Défense, Contrats] — ordre DOM M,I,D,C
 * réordonné en M,D,I,C à 1440+ via lg:order ; © 12px/19.2 à gauche, à droite
 * en 1440+. Les grands espaceurs (437/584/200px) sont du vide délibéré du live.
 */
const menu: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/notre-cabinet", label: "Notre cabinet" },
  { href: "/honoraires-rendez-vous", label: "Rendez-vous, accès & honoraires" },
  { href: "/nos-affaires", label: "Nos affaires" },
  { href: "/medias", label: "Médias" },
  { href: "/comprendre-le-droit", label: "Ressources" },
  { href: "/mentions-legales", label: "Mentions légales" },
]

/** Libellés du footer live quand ils diffèrent du registry (fidélité texte,
 * casse comprise — le pixel-diff voit « Pénale » vs « pénale »). */
const FOOTER_LABELS: Record<string, string> = {
  "droit-assurances-particuliers-professionnels":
    "Droit des assurances particuliers et professionnels",
  "defense-penale": "Défense Pénale",
}

function footerLabel(l: NavLink): string {
  const slug = (l.href ?? "").split("/").filter(Boolean).pop() ?? ""
  return FOOTER_LABELS[slug] ?? l.label
}

function SocialLinks({
  social,
}: {
  social?: { facebook?: string; instagram?: string; linkedin?: string }
}) {
  if (!social) return null
  const items = [
    social.facebook
      ? { href: social.facebook, label: "Facebook", icon: <FacebookIcon /> }
      : null,
    social.instagram
      ? { href: social.instagram, label: "Instagram", icon: <InstagramIcon /> }
      : null,
    social.linkedin
      ? { href: social.linkedin, label: "LinkedIn", icon: <LinkedInIcon /> }
      : null,
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[]
  if (!items.length) return null
  return (
    <ul className="flex items-center gap-2" aria-label="Réseaux sociaux">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-white/60 hover:text-accent"
          >
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.5-.13-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8h3.5Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Zm6.1-8.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0ZM12 2.5c-2.45 0-2.76.01-3.72.05-.96.05-1.61.2-2.18.42a4.4 4.4 0 0 0-1.59 1.03 4.4 4.4 0 0 0-1.03 1.59c-.23.57-.38 1.22-.42 2.18C3.01 9.24 3 9.55 3 12s.01 2.76.05 3.72c.05.96.2 1.61.42 2.18.23.6.54 1.1 1.03 1.59.49.49 1 .8 1.59 1.03.57.23 1.22.38 2.18.42.96.04 1.27.05 3.72.05s2.76-.01 3.72-.05c.96-.05 1.61-.2 2.18-.42a4.4 4.4 0 0 0 1.59-1.03 4.4 4.4 0 0 0 1.03-1.59c.23-.57.38-1.22.42-2.18.04-.96.05-1.27.05-3.72s-.01-2.76-.05-3.72c-.05-.96-.2-1.61-.42-2.18a4.4 4.4 0 0 0-1.03-1.59 4.4 4.4 0 0 0-1.59-1.03c-.57-.23-1.22-.38-2.18-.42C14.76 2.51 14.45 2.5 12 2.5Zm0 1.7c2.41 0 2.7.01 3.64.05.88.04 1.35.19 1.67.31.42.16.72.36 1.04.67.31.32.51.62.67 1.04.12.32.27.79.31 1.67.04.95.05 1.23.05 3.64s-.01 2.7-.05 3.64c-.04.88-.19 1.35-.31 1.67-.16.42-.36.72-.67 1.04-.32.31-.62.51-1.04.67-.32.12-.79.27-1.67.31-.95.04-1.23.05-3.64.05s-2.7-.01-3.64-.05c-.88-.04-1.35-.19-1.67-.31a2.8 2.8 0 0 1-1.04-.67 2.8 2.8 0 0 1-.67-1.04c-.12-.32-.27-.79-.31-1.67C4.71 14.7 4.7 14.41 4.7 12s.01-2.7.05-3.64c.04-.88.19-1.35.31-1.67.16-.42.36-.72.67-1.04.32-.31.62-.51 1.04-.67.32-.12.79-.27 1.67-.31.95-.04 1.23-.05 3.64-.05Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.31h4.52V23H.24V8.31Zm7.44 0h4.33v2h.06c.6-1.14 2.07-2.34 4.27-2.34 4.57 0 5.41 3.01 5.41 6.92V23h-4.51v-7.1c0-1.69-.03-3.87-2.36-3.87-2.36 0-2.72 1.85-2.72 3.75V23H7.68V8.31Z" />
    </svg>
  )
}

function FooterCol({
  title,
  titleHref,
  links,
  className = "",
}: {
  title: string
  titleHref?: string
  links: NavLink[]
  className?: string
}) {
  return (
    <div className={`text-[14px] leading-[22.4px] text-navy ${className}`}>
      {/* Blocs en largeur fit-content comme le live (les <p> Wix épousent le texte) */}
      <p
        className="w-fit text-[22px] leading-[35.2px] lg:text-[14px] lg:leading-[22.4px]"
        style={{ fontFamily: "var(--font-sans-semibold)" }}
      >
        {titleHref ? (
          <Link href={titleHref} className="hover:text-accent">
            {title}
          </Link>
        ) : (
          title
        )}
      </p>
      <ul className="mt-[15px] space-y-[15px]">
        {links.map((l) => (
          <li key={l.href ?? l.label} className="w-fit">
            {l.href ? (
              <Link href={l.href} className="hover:text-accent">
                {footerLabel(l)}
              </Link>
            ) : (
              footerLabel(l)
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const site = getSite()
  const poles = megaPolesFromRegistry()
  const defense = poles.find((p) => p.id === "defense")
  const victimes = poles.find((p) => p.id === "victimes") ?? poles[1]
  const contrats = poles.find((p) => p.id === "contrats") ?? poles[2]
  // Pilules téléphone / RDV → SiteCta (uniformité UI > pixel Wix — deviations.json)
  return (
    <footer className="mt-auto bg-[var(--wix-color-16)]">
      <div className="px-3 pt-20 pb-12 md:px-12">
        <p className="font-display text-[60px] leading-none font-normal text-navy md:text-[120px]">
          Contact
        </p>
        <p className="font-display mt-6 max-w-[800px] text-[22px] leading-[normal] font-normal tracking-[-0.03em] text-navy md:mt-12 lg:text-[18px]">
          Le cabinet d&apos;avocats Plouton est ouvert de 9h00 à 19h30, du lundi au vendredi.
          Retrouvez - nous au{" "}
          {/* Fiche Google du cabinet (lien précis par CID) plutôt qu'une
              recherche Maps sur l'adresse — fidélité au live Wix + SEO local. */}
          <a
            href={site.googleReviewsUrl}
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            {site.address.street}, {site.address.postalCode} {site.address.city}
          </a>
        </p>
        <div className="mt-[25px] flex flex-wrap items-center gap-3 md:mt-12">
          <SiteCta href={site.phone.href} variant="primary">
            {site.phone.display}
          </SiteCta>
          <SiteCta href="/honoraires-rendez-vous" variant="secondary" arrow>
            Contact &amp; RDV
          </SiteCta>
          <SocialLinks social={site.social} />
        </div>

        <div className="mt-[448px] grid grid-cols-1 gap-y-[65px] md:mt-[595px] md:[grid-template-columns:341fr_331fr] lg:mt-[200px] lg:[grid-template-columns:290fr_305fr_278fr_471fr]">
          <FooterCol title="Menu" links={menu} className="lg:order-1" />
          {victimes && (
            <FooterCol
              title={victimes.label}
              titleHref={victimes.href}
              links={victimes.children}
              className="lg:order-3"
            />
          )}
          {defense && (
            <FooterCol
              title={footerLabel({ href: defense.href, label: defense.label })}
              titleHref={defense.href}
              links={defense.children}
              className="lg:order-2"
            />
          )}
          {contrats && (
            <FooterCol
              title={contrats.label}
              titleHref={contrats.href}
              links={contrats.children}
              className="lg:order-4"
            />
          )}
        </div>

        <p className="mt-[68px] w-fit text-[12px] leading-[19.2px] text-navy lg:mt-12 lg:ml-auto">
          © Site web imaginé par l&apos;agence{" "}
          <a href="https://rewolf.studio" target="_blank" rel="noopener" className="hover:underline">
            REWOLF | rewolf.studio
          </a>
        </p>
      </div>
    </footer>
  )
}

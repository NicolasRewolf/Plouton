import Link from "next/link"
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
  // Structure live : <a> pilule (h44, border corail, radius full) contenant un
  // <p> interne 16px corail. Le conteneur <a> live garde les styles texte par
  // défaut du navigateur (Arial 10px noir — wixui-button sans texte direct) :
  // on les mime pour l'appariement, ils sont invisibles.
  const pill =
    "inline-flex items-center rounded-full border border-accent px-[10px] py-[10px] text-[10px] leading-[normal] text-black [font-family:Arial,Helvetica,sans-serif] hover:bg-accent"
  const pillText = "font-sans text-[16px] leading-[normal] text-accent"
  return (
    <footer className="mt-auto bg-[var(--wix-color-16)]">
      <div className="px-3 pt-20 pb-12 md:px-12">
        <p className="font-display text-[60px] leading-none font-normal text-navy md:text-[120px]">
          Contact
        </p>
        <p className="font-display mt-6 max-w-[800px] text-[22px] leading-[normal] font-normal tracking-[-0.03em] text-navy md:mt-12 lg:text-[18px]">
          Le cabinet d&apos;avocats Plouton est ouvert de 9h00 à 19h30, du lundi au vendredi.
          Retrouvez - nous au{" "}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${site.address.street}, ${site.address.postalCode} ${site.address.city}`
            )}`}
            target="_blank"
            rel="noopener"
            className="text-accent"
          >
            {site.address.street}, {site.address.postalCode} {site.address.city}
          </a>
        </p>
        <div className="mt-[25px] flex flex-wrap gap-6 md:mt-12">
          <a href={site.phone.href} className={pill}>
            <p className={pillText}>{site.phone.display}</p>
          </a>
          <Link href="/honoraires-rendez-vous" className={pill}>
            <p className={pillText}>Contact &amp; RDV</p>
          </Link>
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

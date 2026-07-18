import Image from "next/image"
import Link from "next/link"
import { getSite } from "@/lib/content"
import { megaPolesFromRegistry } from "@/lib/registry"

const menu = [
  { href: "/", label: "Accueil" },
  { href: "/notre-cabinet", label: "Notre cabinet" },
  { href: "/honoraires-rendez-vous", label: "Rendez-vous, accès & honoraires" },
  { href: "/nos-affaires", label: "Nos affaires" },
  { href: "/comprendre-le-droit", label: "Ressources" },
  { href: "/mentions-legales", label: "Mentions légales" },
]

const defense =
  megaPolesFromRegistry()
    .find((p) => p.id === "defense")
    ?.children.map((c) => ({ href: c.href, label: c.label })) ?? []

export function Footer() {
  const site = getSite()
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/brand/logo-mark.svg" alt="" width={24} height={18} />
            <span className="font-display text-sm font-bold tracking-[0.12em]">PLOUTON</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Avocats pénalistes à Bordeaux — défense, indemnisation des victimes, contrats &amp;
            personnes.
          </p>
        </div>
        <div className="space-y-1 text-sm text-muted">
          <p className="font-medium text-navy">Menu</p>
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="block hover:text-accent">
              {m.label}
            </Link>
          ))}
        </div>
        <div className="space-y-1 text-sm text-muted">
          <p className="font-medium text-navy">Défense pénale</p>
          {defense.map((m) => (
            <Link key={m.href} href={m.href} className="block hover:text-accent">
              {m.label}
            </Link>
          ))}
        </div>
        <div className="space-y-2 text-sm text-muted">
          <p className="font-medium text-navy">Contact</p>
          <p>
            {site.address.street}, {site.address.postalCode} {site.address.city}
          </p>
          <a href={site.phone.href} className="block font-medium text-navy hover:text-accent">
            {site.phone.display}
          </a>
          <p>{site.hours}</p>
          <Link
            href="/honoraires-rendez-vous"
            className="mt-3 inline-flex rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-soft"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © Site web imaginé par l&apos;agence{" "}
        <a href="https://rewolf.studio" className="underline hover:text-accent">
          REWOLF | rewolf.studio
        </a>
      </div>
    </footer>
  )
}

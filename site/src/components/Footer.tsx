import Image from "next/image"
import Link from "next/link"
import { getSite } from "@/lib/content"

export function Footer() {
  const site = getSite()
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 lg:grid-cols-3 lg:px-8">
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
          <Link href="/" className="block hover:text-accent">
            Accueil
          </Link>
          <Link href="/defense-penale/droit-penal" className="block hover:text-accent">
            Droit pénal
          </Link>
          <Link href="/contact" className="block hover:text-accent">
            Rendez-vous, accès &amp; honoraires
          </Link>
          <Link href="/#affaires" className="block hover:text-accent">
            Nos affaires
          </Link>
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
            href="/contact"
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

import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { SiteCta } from "@/components/SiteCta"

export default function NotFound() {
  return (
    <>
      <Header variant="site" />
      <main className="flex min-h-[60vh] flex-1 flex-col items-center justify-center bg-page px-6 py-20 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
          Erreur 404
        </p>
        <h1 className="mt-4 max-w-lg font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-navy text-balance">
          Cette page n’existe pas
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-navy/70 text-pretty">
          Le lien est peut-être ancien, ou la page a été déplacée. Revenez à l’accueil pour
          continuer.
        </p>
        <div className="mt-8">
          <SiteCta href="/" variant="primary" arrow>
            Retour à l’accueil
          </SiteCta>
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Ou{" "}
          <Link href="/nos-affaires" className="font-medium text-navy underline decoration-navy/20 underline-offset-4 hover:text-accent hover:decoration-accent">
            voir nos affaires
          </Link>
        </p>
      </main>
      <Footer />
    </>
  )
}

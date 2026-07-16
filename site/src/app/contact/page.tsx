import type { Metadata } from "next"
import { ContactForm } from "@/components/ContactForm"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getSite } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Honoraires & prise de rendez-vous",
  description:
    "Prise de rendez-vous, honoraires et accès du Cabinet Plouton à Bordeaux. Formulaire de contact sécurisé.",
}

export default function ContactPage() {
  const site = getSite()
  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Honoraires & prise de rendez-vous",
      url: `${site.url}/contact`,
      mainEntity: { "@id": site.cabinetId },
    },
  ]

  return (
    <>
      <Header />
      <JsonLd data={schema} />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-2 lg:px-8">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Prise de rendez-vous, accès & honoraires
          </h1>
          <p className="mt-4 mb-6 leading-relaxed text-muted">
            Merci de compléter le formulaire. Votre demande est traitée rapidement ; un rendez-vous
            est en principe fixé sous 7 jours. En urgence, un échange immédiat est possible.
          </p>
          <h2 className="font-display text-2xl font-semibold">Honoraires</h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
            Le premier rendez-vous (30 min max) est facturé 180 € TTC. Une convention d&apos;honoraires
            est établie pour chaque dossier (complexité, travail, situation, frais). En dommage
            corporel, un honoraire de résultat s&apos;ajoute en principe.
          </p>
          <h2 className="font-display text-2xl font-semibold">Horaires & accès</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {site.hours}. {site.address.street}, {site.address.postalCode} {site.address.city}.
            Physique, visioconférence ou téléphone.
          </p>
          <p className="mt-4">
            <a href={site.phone.href} className="font-medium text-accent">
              {site.phone.display}
            </a>
          </p>
        </div>
        <div>
          <h2 className="font-display mb-4 text-2xl font-semibold">Formulaire</h2>
          <ContactForm pageSource="contact" defaultObjet="Droit Pénal" />
        </div>
      </div>
      <Footer />
    </>
  )
}

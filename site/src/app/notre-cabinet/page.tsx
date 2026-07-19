import type { Metadata } from "next"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { SiteCta } from "@/components/SiteCta"
import { TeamMurBlanc } from "@/components/TeamMurBlanc"
import { getEquipe, getSite, readPageJson } from "@/lib/content"
import { JsonLd, organizationSchema, withCanonicalOg } from "@/lib/seo"

export function generateMetadata(): Metadata {
  const page = readPageJson<{ metaTitle: string; metaDescription: string }>("notre-cabinet")
  if (!page) return { title: "Notre équipe" }
  return withCanonicalOg({
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    path: "/notre-cabinet",
  })
}

export default function NotreCabinetPage() {
  const page = readPageJson<{
    title: string
    intro: string
  }>("notre-cabinet")
  const site = getSite()
  const equipe = getEquipe()
  if (!page) return null

  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: page.title,
      url: `${site.url}/notre-cabinet`,
    },
  ]

  const [titleMain, titleRest] = page.title.includes("—")
    ? page.title.split("—").map((s) => s.trim())
    : [page.title, ""]

  const introParas = page.intro
    .replace(/\u200b/g, "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && p !== "​")

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

      {/* Hero live : carte texte + photo de groupe (comme le site actuel) */}
      <section className="bg-fog px-5 py-10 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-fog">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative z-10 m-4 rounded-xl bg-white p-6 shadow-md md:p-8 lg:ml-8">
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-navy-soft underline-offset-2 hover:underline"
              >
                <span aria-hidden>★</span>
                {site.rating.value.replace(".", ",")}/5 étoiles ({site.rating.count} avis) sur
                Google
              </a>
              <h1 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.4rem)] font-semibold leading-tight tracking-tight">
                <span className="text-accent">{titleMain}</span>
                {titleRest ? <span className="text-navy"> — {titleRest}</span> : null}
              </h1>
              {introParas.map((p, i) => (
                <p key={i} className="mt-4 text-[15px] leading-relaxed text-navy">
                  {p}
                </p>
              ))}
              <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow className="mt-6">
                Je prends rendez-vous
              </SiteCta>
            </div>
            <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]">
              <Image
                src="/brand/equipe-home.png"
                alt="L’équipe du Cabinet Plouton"
                fill
                className="object-cover object-[center_22%]"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <TeamMurBlanc equipe={equipe} />

      <Footer />
    </>
  )
}

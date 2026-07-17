import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getEquipe, getSite, readPageJson } from "@/lib/content"
import { JsonLd, organizationSchema } from "@/lib/seo"

export function generateMetadata(): Metadata {
  const page = readPageJson<{ metaTitle: string; metaDescription: string }>("notre-cabinet")
  if (!page) return { title: "Notre équipe" }
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
  }
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

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />

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
              {page.intro
                .replace(/\u200b/g, "")
                .split(/\n\n+/)
                .filter((p) => p.trim() && p.trim() !== "​")
                .map((p, i) => (
                  <p key={i} className="mt-4 text-[15px] leading-relaxed text-navy">
                    {p.trim()}
                  </p>
                ))}
              <Link
                href="/honoraires-rendez-vous"
                className="btn-pill mt-6 border-navy text-navy"
              >
                Je prends rendez-vous
                <span className="btn-pill-icon" aria-hidden>
                  →
                </span>
              </Link>
            </div>
            <div className="relative hidden min-h-[320px] lg:block">
              {equipe[0]?.image ? (
                <Image
                  src={equipe[0].image}
                  alt=""
                  fill
                  className="object-cover object-top opacity-90"
                  sizes="50vw"
                  priority
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="grid gap-14 md:grid-cols-2">
          {equipe.map((m) => (
            <article key={m.id} className="grid gap-5 sm:grid-cols-[200px_1fr] sm:items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  {m.role}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-navy">{m.name}</h2>
                {m.image ? (
                  <div className="relative mt-4 aspect-[3/4] w-full max-w-[200px] overflow-hidden bg-fog">
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      className="object-cover object-top"
                      sizes="200px"
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 text-[15px] leading-relaxed text-navy">
                {m.bio.split(/\n\n+/).map((p, i) => (
                  <p key={i}>{p.trim()}</p>
                ))}
                {m.linkedin ? (
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-accent hover:underline"
                  >
                    LinkedIn →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getCategories, publishedArticles } from "@/lib/content"

export const metadata: Metadata = {
  title: "Ressources — Comprendre le droit",
  description:
    "Le droit expliqué clairement par le Cabinet Plouton. Articles et ressources juridiques.",
}

export default function ComprendreLeDroitPage() {
  const cats = getCategories()
  const articles = publishedArticles().slice(0, 36)

  return (
    <>
      <Header variant="site" />
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-navy">
          Ressources
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-navy">
          Le droit expliqué clairement, par des avocats. Articles pour comprendre vos droits, quelle
          que soit votre situation.
        </p>
        {cats.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {cats.map((c) => (
              <span
                key={c.id}
                className="border border-line bg-fog px-2.5 py-1 text-xs text-navy"
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-12 divide-y divide-line">
          {articles.map((a) => (
            <Link key={a.slug} href={`/post/${a.slug}`} className="group block py-5">
              <h2 className="font-display text-xl font-semibold text-navy group-hover:text-accent">
                {a.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}

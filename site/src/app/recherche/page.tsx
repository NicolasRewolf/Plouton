import type { Metadata } from "next"
import Link from "next/link"
import { AffaireCard } from "@/components/AffaireCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { authorMetaByArticleSlug } from "@/lib/content"
import { publishedIndex } from "@/lib/queries"
import { withCanonicalOg } from "@/lib/seo"

export const metadata: Metadata = withCanonicalOg({
  title: { absolute: "Recherche" },
  description: "Rechercher un article ou une affaire du Cabinet Plouton.",
  path: "/recherche",
})

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: raw = "" } = await searchParams
  const q = raw.trim()
  const needle = normalize(q)

  const all = await publishedIndex()
  const authorMeta = authorMetaByArticleSlug()
  const results =
    needle.length < 2
      ? []
      : all
          .filter((a) => {
            const hay = normalize(`${a.title} ${a.excerpt || ""}`)
            return hay.includes(needle)
          })
          .slice(0, 40)

  return (
    <>
      <Header variant="site" />
      <main className="mx-auto min-h-[60vh] max-w-[900px] px-5 py-12 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-[-0.03em] text-navy">
          Recherche
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Titres et extraits des articles publiés.
        </p>

        <form action="/recherche" method="get" className="mt-8">
          <label htmlFor="q" className="sr-only">
            Mot-clé
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Ex. violences conjugales, CIVI…"
              autoFocus
              className="min-h-12 flex-1 rounded-full border border-line bg-white px-5 text-[15px] text-navy outline-none ring-accent/30 placeholder:text-muted focus:ring-2"
            />
            <button type="submit" className="btn-pill btn-pill-primary min-h-12 px-6">
              Chercher
            </button>
          </div>
        </form>

        {q ? (
          <p className="mt-8 text-[13px] tabular-nums text-muted">
            {results.length} résultat{results.length > 1 ? "s" : ""} pour «&nbsp;{q}&nbsp;»
          </p>
        ) : (
          <p className="mt-8 text-[14px] text-muted">Saisissez au moins 2 caractères.</p>
        )}

        {results.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {results.map((a) => {
              const meta = authorMeta[a.slug]
              return (
              <AffaireCard
                key={a.slug}
                article={{
                  slug: a.slug,
                  title: a.title,
                  excerpt: a.excerpt,
                  publishedAt: a.publishedAt,
                  categories: a.categories,
                  coverImage: a.coverImage,
                  minutesToRead: a.minutesToRead,
                  viewCount: a.viewCount,
                  authorName: meta?.name,
                  authorSlug: meta?.id,
                }}
                titleAs="h2"
              />
              )
            })}
          </div>
        ) : q && needle.length >= 2 ? (
          <p className="mt-10 text-[15px] text-muted">
            Aucun article trouvé.{" "}
            <Link href="/nos-affaires" className="text-navy underline-offset-2 hover:underline">
              Voir nos affaires
            </Link>
          </p>
        ) : null}
      </main>
      <Footer />
    </>
  )
}

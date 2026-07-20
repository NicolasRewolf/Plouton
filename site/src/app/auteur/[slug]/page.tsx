import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AffaireCard } from "@/components/AffaireCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { resolveAuthorBySlug, resolveAuthors } from "@/lib/authors-db"
import { getArticle, listAuthors } from "@/lib/content"
import { resolvePublishedIndex } from "@/lib/posts-public"
import { JsonLd, absoluteUrl, withCanonicalOg } from "@/lib/seo"

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const authors = await resolveAuthors()
    return authors.map((a) => ({ slug: a.id }))
  } catch {
    return listAuthors().map((a) => ({ slug: a.id }))
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const author = await resolveAuthorBySlug(slug)
  if (!author) return {}
  const title = `${author.shortName} — Avocat | Cabinet Plouton`
  const description =
    author.bio?.slice(0, 155) ||
    `Articles et interventions de ${author.shortName} au Cabinet Plouton.`
  return withCanonicalOg({
    title: { absolute: title },
    description,
    path: `/auteur/${author.id}`,
    image: author.avatar || undefined,
  })
}

export default async function AuteurPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const author = await resolveAuthorBySlug(slug)
  if (!author) notFound()

  const index = await resolvePublishedIndex()
  const cards = index
    .filter((item) => {
      // L'auteur est porté par l'index. Le filtre relisait auparavant
      // `contenu/articles/{slug}.json` et écartait l'article quand le fichier
      // n'existait pas — c'est-à-dire pour tout article écrit depuis l'admin,
      // qui disparaissait donc de la page de son propre auteur.
      if (item.authorSlug) return item.authorSlug === author.id
      // Entrées héritées de l'index JSON : pas d'auteur porté, on retombe
      // sur le fichier.
      const full = getArticle(item.slug)
      if (!full) return false
      return (
        full.authorSlug === author.id ||
        full.authorId === author.id ||
        full.author === author.wixId ||
        full.author === author.shortName
      )
    })
    .slice(0, 48)
    .map((a) => ({
      ...a,
      authorName: author.shortName,
      authorSlug: author.id,
    }))

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      "@id": absoluteUrl(`/auteur/${author.id}#person`),
      name: author.shortName,
      ...(author.legalName ? { alternateName: author.legalName } : {}),
      jobTitle: author.jobTitle || author.role || "Avocat à la Cour",
      description: author.bio,
      image: author.avatar ? absoluteUrl(author.avatar) : undefined,
      url: absoluteUrl(`/auteur/${author.id}`),
      ...(author.linkedin ? { sameAs: [author.linkedin] } : {}),
      ...(author.knowsAbout?.length ? { knowsAbout: author.knowsAbout } : {}),
      worksFor: { "@type": "LegalService", name: "Cabinet Plouton" },
    },
  }

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />
      <main className="bg-page">
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <span className="relative size-24 shrink-0 overflow-hidden rounded-full bg-fog">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.shortName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : null}
            </span>
            <div>
              <p className="text-[12px] font-medium tracking-[0.14em] text-navy/45 uppercase">
                {author.role || "Avocat"}
              </p>
              <h1 className="font-display mt-1 text-[32px] font-medium text-navy">
                {author.shortName}
              </h1>
              {author.bio ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
                  {author.bio}
                </p>
              ) : null}
              {author.linkedin ? (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[13px] text-navy underline-offset-2 hover:underline"
                >
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>

          <h2 className="font-display mt-14 text-[22px] font-medium text-navy">
            Articles
          </h2>
          {cards.length ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((a) => (
                <AffaireCard key={a.slug} article={a} titleAs="h3" />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-muted">Aucun article publié pour le moment.</p>
          )}

          <p className="mt-10">
            <Link
              href="/nos-affaires"
              className="text-[13px] text-navy hover:underline"
            >
              ← Toutes les affaires
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}

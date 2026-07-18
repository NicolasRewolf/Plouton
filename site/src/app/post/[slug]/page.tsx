import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { StickyCta } from "@/components/StickyCta"
import { TeamCtaBanner } from "@/components/TeamCtaBanner"
import {
  categorySlug,
  getArticle,
  getAuthor,
  getRicos,
  getSite,
  publishedArticles,
} from "@/lib/content"
import { relatedForArticle } from "@/lib/queries"
import { RicosBody } from "@/lib/ricos/render"
import type { RicosDoc } from "@/lib/ricos/types"
import { JsonLd, organizationSchema } from "@/lib/seo"

export const dynamicParams = true

export function generateStaticParams() {
  return publishedArticles().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article || article.status !== "published") return {}
  return {
    // Titre/meta du live Wix (baseline) — identiques au byte près
    title: { absolute: article.metaTitle ?? article.title },
    description: article.metaDescription ?? article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  }
}

/** Corps riche : "## " titre, "> " encadré bordure gauche, "---" séparateur, sinon paragraphe */
function BodyBlocks({ blocks }: { blocks: string[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block === "---")
          return <hr key={i} className="mx-auto my-10 w-56 border-line" />
        if (block.startsWith("## "))
          return <h2 key={i}>{block.replace(/^## /, "")}</h2>
        if (block.startsWith("> "))
          return (
            <blockquote
              key={i}
              className="my-6 border-l-4 border-[#c4cdd2] py-1 pl-4 text-[13px] leading-relaxed text-ink/70"
            >
              {block.replace(/^> /, "")}
            </blockquote>
          )
        return <p key={i}>{block}</p>
      })}
    </>
  )
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article || article.status !== "published") notFound()
  const ricos = getRicos(article.slug)
  const site = getSite()
  const url = `${site.url}/post/${article.slug}`
  const author = getAuthor(article)
  const publishedLabel = new Date(article.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
  const updatedLabel = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null
  const related = relatedForArticle(article, 2).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    categories: a.categories,
    coverImage: a.coverImage,
    minutesToRead: a.minutesToRead,
    viewCount: a.viewCount ?? 0,
  }))
  const stats = { views: article.viewCount ?? 0, likes: 0, comments: 0 }

  const schema = [
    organizationSchema(site),
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt ?? article.publishedAt,
      author: { "@type": "Person", name: author?.shortName ?? article.author },
      publisher: { "@id": site.cabinetId },
      mainEntityOfPage: url,
      image: article.coverImage,
      inLanguage: "fr-FR",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: site.url },
        { "@type": "ListItem", position: 2, name: "Ressources", item: `${site.url}/#affaires` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ]

  return (
    <>
      <Header variant="site" />
      <JsonLd data={schema} />
      {/* Fond gris + article en feuille blanche, comme le live */}
      <div className="bg-page px-3 py-8 sm:px-5">
        <article className="mx-auto max-w-[940px] border border-line bg-white px-5 py-14 text-ink sm:px-10 lg:px-24">
          {/* Rangée auteur : avatar · nom · date · temps de lecture · menu ⋮ */}
          <header>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fog">
                {author?.avatar ? (
                  <Image
                    src={author.avatar}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-ink">
                    {(author?.shortName ?? article.author).charAt(0)}
                  </span>
                )}
              </span>
              <p className="min-w-0">
                <span className="truncate">{author?.displayName ?? article.author}</span>
                <span className="mx-1.5 text-ink/50">·</span>
                <span>{publishedLabel}</span>
                {article.minutesToRead ? (
                  <>
                    <span className="mx-1.5 text-ink/50">·</span>
                    <span>{article.minutesToRead} min de lecture</span>
                  </>
                ) : null}
              </p>
              <span aria-hidden className="ml-auto select-none text-xl leading-none text-ink">
                ⋮
              </span>
            </div>

            <h1 className="font-display mt-8 text-[27px] leading-[1.4] font-normal sm:text-[39px]">
              {article.title}
            </h1>

            {/* Note par étoiles (données : import Wix → Supabase) */}
            <div className="mt-5 flex items-center gap-2 text-sm text-ink/70">
              <span aria-hidden className="tracking-[0.2em] text-[#c4cdd2]">
                ★★★★★
              </span>
              <span>Pas encore de note</span>
            </div>
          </header>

          {ricos ? (
            /* Arbre Ricos exact du live (Phase 3) — structure fidèle :
             * liens, couleurs, tableaux, listes, accordéons, embeds. */
            <div className="prose-plouton prose-blog mt-8">
              <RicosBody doc={ricos.ricos as RicosDoc} slug={article.slug} />
            </div>
          ) : article.bodyHtml ? (
            <div
              className="prose-plouton prose-blog mt-8"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />
          ) : (
            <div className="prose-plouton prose-blog mt-8">
              <BodyBlocks blocks={article.body} />
            </div>
          )}

          {/* À propos de l'auteur */}
          {author?.bio ? (
            <section className="mt-12">
              <hr className="mx-auto w-56 border-line" />
              <h2 className="font-display mt-10 text-[23px] font-normal">
                À propos de l&apos;auteur
              </h2>
              <blockquote className="mt-5 border-l-4 border-[#c4cdd2] py-1 pl-4 text-[13px] leading-relaxed text-ink/80">
                <p>{author.bio}</p>
                <p className="mt-2 text-ink/60">
                  <Link href="/notre-cabinet" className="hover:text-accent">
                    En savoir plus sur le cabinet
                  </Link>
                  {" • "}
                  <Link href="/honoraires-rendez-vous" className="hover:text-accent">
                    Demander un premier rendez-vous
                  </Link>
                </p>
              </blockquote>
            </section>
          ) : null}

          {updatedLabel ? (
            <p className="mt-8 text-sm italic">Dernière mise à jour&nbsp;: {updatedLabel}.</p>
          ) : null}

          {/* Tags */}
          {article.tags?.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <span key={t} className="border border-line px-3 py-1.5 text-sm text-ink">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {/* Catégories cliquables */}
          <div className="mt-8 flex flex-col items-start gap-2">
            {article.categories.map((c) => (
              <Link
                key={c}
                href={`/blog/categories/${categorySlug(c)}`}
                className="text-sm text-ink underline underline-offset-2 hover:text-accent"
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Partage */}
          <div className="mt-8 flex items-center gap-6 border-t border-line pt-6 text-ink">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Partager sur Facebook"
              className="hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.5-.13-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8h3.5Z"/></svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Partager sur X"
              className="hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.23l-4.88-6.38L6.5 22H3.37l7.24-8.28L2.4 2h6.39l4.41 5.83L18.9 2Zm-1.1 18.13h1.73L7.86 3.77H6.01L17.8 20.13Z"/></svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Partager sur LinkedIn"
              className="hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.31h4.52V23H.24V8.31Zm7.44 0h4.33v2h.06c.6-1.14 2.07-2.34 4.27-2.34 4.57 0 5.41 3.01 5.41 6.92V23h-4.51v-7.1c0-1.69-.03-3.87-2.36-3.87-2.36 0-2.72 1.85-2.72 3.75V23H7.68V8.31Z"/></svg>
            </a>
            <span className="text-line">|</span>
            <span className="text-sm text-ink/60">
              {stats.views} vues · {stats.comments} commentaire{stats.comments > 1 ? "s" : ""}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-accent">
              {stats.likes > 0 ? stats.likes : null}
              <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
          </div>
        </article>

        {/* Posts similaires */}
        {related.length ? (
          <section className="mx-auto mt-10 max-w-[940px]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg text-ink">Posts similaires</h2>
              <Link href="/nos-affaires" className="text-sm text-ink underline-offset-2 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {related.map((a) => {
                const rs = { views: a.viewCount, likes: 0, comments: 0 }
                return (
                  <article key={a.slug} className="border border-line bg-white">
                    <Link href={`/post/${a.slug}`} className="block">
                      <span className="block aspect-[16/9] w-full bg-fog">
                        {a.coverImage ? (
                          <Image
                            src={a.coverImage}
                            alt=""
                            width={640}
                            height={360}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="block px-5 pt-4 font-display text-[17px] leading-snug text-ink">
                        {a.title.length > 62 ? `${a.title.slice(0, 62)}…` : a.title}
                      </span>
                    </Link>
                    <div className="mt-4 flex items-center gap-4 border-t border-line px-5 py-3 text-xs text-ink/60">
                      <span>👁 {rs.views}</span>
                      <span>💬 {rs.comments}</span>
                      <span className="ml-auto text-accent">
                        {rs.likes > 0 ? `${rs.likes} ` : ""}♥
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* Commentaires (données : import Wix → Supabase) */}
        <section className="mx-auto mt-10 max-w-[940px] border border-line bg-white px-5 py-10 sm:px-10 lg:px-24">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Commentaires</h2>
            <p className="flex items-center gap-2 text-sm text-ink/70">
              <span aria-hidden className="tracking-[0.2em] text-[#c4cdd2]">
                ★★★★★
              </span>
              Pas encore de note
            </p>
          </div>
          <hr className="mt-4 border-line" />
          <Link
            href="/contact"
            className="mt-6 block border border-line px-5 py-5 text-sm text-ink/70 transition-colors hover:border-navy"
          >
            <span className="flex items-center gap-3">
              Ajouter une note
              <span aria-hidden className="tracking-[0.2em] text-accent">
                ☆☆☆☆☆
              </span>
            </span>
            <span className="mt-3 block">Rédigez un commentaire...</span>
          </Link>
        </section>
      </div>

      <TeamCtaBanner />
      <StickyCta />
      <Footer />
    </>
  )
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AffaireCard } from "@/components/AffaireCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { StickyCta } from "@/components/StickyCta"
import { TeamCtaBanner } from "@/components/TeamCtaBanner"
import { getSite, resolveAuthorSlug } from "@/lib/content"
import { resolveAuthorBySlug } from "@/lib/authors-db"
import { categoryPublicHref } from "@/lib/gallery-filters"
import {
  resolvePostBodyMode,
  resolvePublicBodyHtml,
  resolvePublishedArticle,
  resolvePublishedSlugs,
} from "@/lib/posts-public"
import { relatedForArticle } from "@/lib/queries"
import { JsonLd, absoluteUrl, organizationSchema } from "@/lib/seo"
import { buildArticleGraph } from "@/lib/article-jsonld"
import { safeMetaDescription } from "@/lib/meta-description"

export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await resolvePublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await resolvePublishedArticle(slug)
  if (!article) return {}
  const path = `/post/${article.slug}`
  const description = safeMetaDescription(
    article.metaDescription,
    article.excerpt
  )
  const authorName = article.author?.includes("-") && article.author.length === 36
    ? undefined
    : article.author
  const coverAbs = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : absoluteUrl(article.coverImage)
    : absoluteUrl("/brand/equipe-home.png")
  return {
    // Titre/meta du live Wix (baseline) — identiques au byte près
    title: { absolute: article.metaTitle ?? article.title },
    description: description || undefined,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "article",
      url: absoluteUrl(path),
      title: article.title,
      description: description || article.excerpt,
      publishedTime: article.publishedAt,
      authors: authorName ? [authorName] : undefined,
      siteName: "Cabinet Plouton",
      locale: "fr_FR",
      images: [{ url: coverAbs }],
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
  const article = await resolvePublishedArticle(slug)
  if (!article) notFound()
  const bodyMode = resolvePostBodyMode(article)
  const bodyHtml = resolvePublicBodyHtml(article)
  const site = getSite()
  const url = `${site.url}/post/${article.slug}`
  const authorKey = resolveAuthorSlug(article)
  const author = authorKey ? await resolveAuthorBySlug(authorKey) : null
  const publishedLabel = new Date(article.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const updatedLabel = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null
  const related = (await relatedForArticle(article, 3)).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    categories: a.categories,
    coverImage: a.coverImage,
    minutesToRead: a.minutesToRead,
    viewCount: a.viewCount ?? 0,
  }))
  const stats = { views: article.viewCount ?? 0, likes: 0 }

  const authorSlug =
    author?.id || article.authorSlug || article.authorId || null

  const schema = buildArticleGraph({ article, site, author, url })

  return (
    <>
      <Header variant="site" />
      <JsonLd data={organizationSchema(site)} />
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
                {authorSlug ? (
                  <Link
                    href={`/auteur/${authorSlug}`}
                    className="truncate underline-offset-2 hover:underline"
                  >
                    {author?.displayName ?? article.author}
                  </Link>
                ) : (
                  <span className="truncate">
                    {author?.displayName ?? article.author}
                  </span>
                )}
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
          </header>

          {bodyMode === "html" && bodyHtml ? (
            <div
              className="prose-plouton prose-blog mt-8"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <div className="prose-plouton prose-blog mt-8">
              <BodyBlocks
                blocks={Array.isArray(article.body) ? article.body : []}
              />
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
                href={categoryPublicHref(c)}
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
              {stats.views} vue{stats.views > 1 ? "s" : ""}
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
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <AffaireCard key={a.slug} article={a} titleAs="h3" />
              ))}
            </div>
          </section>
        ) : null}

        {/* Contact — pas de faux formulaire commentaire */}
        <section className="mx-auto mt-10 max-w-[940px] border border-line bg-white px-5 py-10 sm:px-10 lg:px-24">
          <h2 className="font-display text-lg text-ink">Une question sur cette affaire&nbsp;?</h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink/70">
            Les commentaires publics ne sont pas ouverts sur ce site. Pour échanger avec le cabinet,
            utilisez le formulaire de contact.
          </p>
          <Link
            href="/honoraires-rendez-vous"
            className="btn-pill btn-pill-primary mt-6 inline-flex"
          >
            Contactez-nous
          </Link>
        </section>
      </div>

      <TeamCtaBanner />
      <StickyCta />
      <Footer />
    </>
  )
}

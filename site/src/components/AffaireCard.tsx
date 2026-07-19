import Image from "next/image"
import Link from "next/link"

export interface AffaireCardItem {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  categories: string[]
  coverImage?: string | null
  minutesToRead?: number | null
  viewCount?: number
  /** Nom court auteur (si résolu depuis auteurs.json) */
  authorName?: string
}

export function formatAffaireViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "")} k`
  return String(n)
}

export function formatAffaireDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Carte article canonique — blog, médias, ressources, nos-affaires,
 * carrousels expertise, posts similaires. Pas d’autre carte article.
 */
export function AffaireCard({
  article,
  featured,
  compact,
  preferredCategory,
  titleAs = "h2",
  className = "",
}: {
  article: AffaireCardItem
  featured?: boolean
  /** Format carrousel : largeur fixe, extrait plus court */
  compact?: boolean
  /** Sur une page expertise : afficher la catégorie du contexte si présente */
  preferredCategory?: string
  titleAs?: "h2" | "h3"
  className?: string
}) {
  const category =
    (preferredCategory &&
      article.categories.find((c) => c.toLowerCase() === preferredCategory.toLowerCase())) ||
    article.categories[0]
  const views = article.viewCount ?? 0
  const TitleTag = titleAs

  return (
    <article
      className={[
        "group content-auto",
        featured ? "sm:col-span-2 xl:col-span-2" : "",
        compact ? "w-[272px] shrink-0 sm:w-[300px]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        href={`/post/${article.slug}`}
        title={article.title}
        className="flex h-full flex-col rounded-[22px] bg-white p-2 shadow-[0_1px_2px_rgba(23,71,94,0.04),0_10px_28px_rgba(23,71,94,0.06)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(23,71,94,0.06),0_18px_40px_rgba(23,71,94,0.1)] active:scale-[0.96]"
      >
        <span
          className={
            featured
              ? "relative block aspect-[16/9] overflow-hidden rounded-[14px] bg-fog sm:aspect-[21/9]"
              : "relative block aspect-[16/10] overflow-hidden rounded-[14px] bg-fog"
          }
        >
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes={
                featured
                  ? "(max-width: 640px) 100vw, 720px"
                  : compact
                    ? "300px"
                    : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 380px"
              }
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-fog via-white to-[#dce6eb]" />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[14px] outline outline-1 outline-[oklch(0_0_0_/_0.1)] -outline-offset-1"
          />
        </span>

        <div className={`flex flex-1 flex-col ${compact ? "px-3.5 pb-3.5 pt-3.5" : "px-4 pb-4 pt-4 sm:px-5"}`}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {category ? (
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
                {category}
              </span>
            ) : null}
            <span className="text-[12px] tabular-nums text-muted">
              {formatAffaireDate(article.publishedAt)}
            </span>
            {article.authorName ? (
              <>
                <span aria-hidden className="text-line">
                  ·
                </span>
                <span className="text-[12px] text-muted">{article.authorName}</span>
              </>
            ) : null}
          </div>

          <TitleTag
            className={
              featured
                ? "mt-2.5 font-display text-[22px] font-medium leading-[1.15] tracking-[-0.02em] text-navy text-balance sm:text-[28px]"
                : compact
                  ? "mt-2 font-display text-[16px] font-medium leading-[1.2] tracking-[-0.015em] text-navy text-balance"
                  : "mt-2.5 font-display text-[18px] font-medium leading-[1.2] tracking-[-0.015em] text-navy text-balance sm:text-[19px]"
            }
          >
            <span className="line-clamp-3">{article.title}</span>
          </TitleTag>

          {article.excerpt && !compact ? (
            <p
              className={
                featured
                  ? "mt-3 line-clamp-2 max-w-2xl text-[15px] leading-relaxed text-pretty text-muted"
                  : "mt-2.5 line-clamp-2 text-[14px] leading-relaxed text-pretty text-muted"
              }
            >
              {article.excerpt}
            </p>
          ) : null}

          {article.excerpt && compact ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-pretty text-muted">
              {article.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex items-center gap-3 pt-3 text-[12px] tabular-nums text-muted">
            <span className="inline-flex items-center gap-1.5">
              <EyeIcon />
              <span>{formatAffaireViews(views)}</span>
            </span>
            {article.minutesToRead ? (
              <>
                <span aria-hidden className="text-line">
                  ·
                </span>
                <span>{article.minutesToRead}&nbsp;min</span>
              </>
            ) : null}
            {!compact ? (
              <span className="ml-auto text-[13px] font-medium text-navy opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Lire →
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-70">
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

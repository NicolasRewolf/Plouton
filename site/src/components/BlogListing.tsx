import Link from "next/link"
import { AffaireCard } from "@/components/AffaireCard"
import { getCategories, type ArticleIndexItem } from "@/lib/content"
import { categoryPublicHref } from "@/lib/gallery-filters"

const PER_PAGE = 24

export function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const current = Math.min(Math.max(1, page), totalPages)
  return {
    items: items.slice((current - 1) * PER_PAGE, current * PER_PAGE),
    current,
    totalPages,
  }
}

export function blogTotalPages(count: number) {
  return Math.max(1, Math.ceil(count / PER_PAGE))
}

/** Listing blog (legacy / redirects) — liens vers les 3 hubs publics. */
export function BlogListing({
  articles,
  page,
  basePath,
  activeCategorySlug,
}: {
  articles: ArticleIndexItem[]
  page: number
  basePath: string
  activeCategorySlug?: string
}) {
  const categories = getCategories()
  const { items, current, totalPages } = paginate(articles, page)
  const pageHref = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`)

  return (
    <div className="bg-page px-3 py-8 sm:px-5">
      <div className="mx-auto max-w-[1140px]">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4 text-sm">
          <Link
            href="/nos-affaires"
            className={!activeCategorySlug ? "font-semibold text-ink" : "text-ink/70 hover:text-accent"}
          >
            Affaires
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={categoryPublicHref(c.label)}
              className={
                activeCategorySlug === c.slug
                  ? "font-semibold text-ink"
                  : "text-ink/70 hover:text-accent"
              }
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <AffaireCard key={a.slug} article={a} titleAs="h3" />
          ))}
        </div>

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === current ? "page" : undefined}
                className={
                  n === current
                    ? "border border-navy bg-navy px-3 py-1.5 text-white"
                    : "border border-line bg-white px-3 py-1.5 text-ink hover:border-navy"
                }
              >
                {n}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  )
}

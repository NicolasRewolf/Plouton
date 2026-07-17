import Link from "next/link"
import { PostCard } from "@/components/PostCard"
import { getCategories, listAuthors, type Article } from "@/lib/content"

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

/** Listing blog : nav catégories + grille de cartes + pagination. */
export function BlogListing({
  articles,
  page,
  basePath,
  activeCategorySlug,
}: {
  articles: Article[]
  page: number
  basePath: string
  activeCategorySlug?: string
}) {
  const categories = getCategories()
  const authors = listAuthors()
  const authorName = (a: Article) =>
    authors.find((x) => x.wixId === a.author)?.displayName ?? undefined
  const { items, current, totalPages } = paginate(articles, page)
  const pageHref = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`)

  return (
    <div className="bg-page px-3 py-8 sm:px-5">
      <div className="mx-auto max-w-[1140px]">
        {/* Nav catégories, comme le live */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4 text-sm">
          <Link
            href="/blog"
            className={!activeCategorySlug ? "font-semibold text-ink" : "text-ink/70 hover:text-accent"}
          >
            Tous les articles
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/blog/categories/${c.slug}`}
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
            <PostCard key={a.slug} article={a} authorName={authorName(a)} />
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

import Image from "next/image"
import Link from "next/link"
import { categorySlug, type Article } from "@/lib/content"

/** Carte article — listings blog, catégories, posts similaires. */
export function PostCard({
  article,
  authorName,
}: {
  article: Pick<
    Article,
    "slug" | "title" | "excerpt" | "publishedAt" | "categories" | "coverImage" | "minutesToRead" | "viewCount"
  >
  authorName?: string
}) {
  const dateLabel = new Date(article.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
  return (
    <article className="flex flex-col border border-line bg-white">
      <Link href={`/post/${article.slug}`} className="block">
        <span className="block aspect-[16/9] w-full overflow-hidden bg-fog">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt=""
              width={640}
              height={360}
              sizes="(max-width: 640px) 100vw, 420px"
              className="h-full w-full object-cover"
            />
          ) : null}
        </span>
      </Link>
      <div className="flex flex-1 flex-col px-5 pt-4">
        {article.categories[0] ? (
          <Link
            href={`/blog/categories/${categorySlug(article.categories[0])}`}
            className="text-xs text-ink/70 hover:text-accent"
          >
            {article.categories[0]}
          </Link>
        ) : null}
        <Link href={`/post/${article.slug}`} className="mt-2 block">
          <h3 className="font-display text-[19px] leading-snug text-ink">
            {article.title.length > 90 ? `${article.title.slice(0, 90)}…` : article.title}
          </h3>
        </Link>
        {article.excerpt ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {article.excerpt.length > 140 ? `${article.excerpt.slice(0, 140)}…` : article.excerpt}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-ink/60">
          {authorName ? <>{authorName} · </> : null}
          {dateLabel}
          {article.minutesToRead ? <> · {article.minutesToRead} min de lecture</> : null}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-line px-5 py-3 text-xs text-ink/60">
        <span>👁 {article.viewCount ?? 0}</span>
        <span>💬 0</span>
        <span aria-hidden className="ml-auto text-accent">
          ♥
        </span>
      </div>
    </article>
  )
}

import Link from "next/link"
import { PostCard } from "@/components/PostCard"
import type {
  ArticleIndexItem,
  RessourcesHubContent,
} from "@/lib/content"

interface RessourcesHubProps {
  hub: RessourcesHubContent
  mostConsulted: ArticleIndexItem[]
  sections: { section: RessourcesHubContent["sections"][number]; articles: ArticleIndexItem[] }[]
}

/** Hub éditorial Ressources — hero + plus consultés + sections thématiques (données JSON). */
export function RessourcesHub({ hub, mostConsulted, sections }: RessourcesHubProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f5f7f8_42%,#eef2f4_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(ellipse_at_top,_rgba(23,71,94,0.06),_transparent_60%)]"
      />

      <div className="relative mx-auto max-w-[1140px] px-5 pb-20 pt-12 sm:px-8 lg:pt-16">
        <header className="max-w-2xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-accent">
            {hub.title}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-navy text-balance">
            {hub.h1 || hub.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-pretty text-muted sm:text-[17px]">
            {hub.intro}
          </p>
        </header>

        {mostConsulted.length ? (
          <HubSection title={hub.mostConsulted.title} articles={mostConsulted} />
        ) : null}

        {sections.map(({ section, articles }) =>
          articles.length ? (
            <HubSection
              key={section.id}
              title={section.title}
              description={section.description}
              articles={articles}
              seeAllHref={section.seeAllHref}
              seeAllLabel={section.seeAllLabel}
            />
          ) : null
        )}
      </div>
    </main>
  )
}

function HubSection({
  title,
  description,
  articles,
  seeAllHref,
  seeAllLabel,
}: {
  title: string
  description?: string
  articles: ArticleIndexItem[]
  seeAllHref?: string
  seeAllLabel?: string
}) {
  return (
    <section className="mt-14 lg:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-display text-[clamp(1.35rem,2.5vw,1.75rem)] font-medium tracking-[-0.02em] text-navy">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="text-sm font-medium text-accent underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {seeAllLabel || "Voir tout"}
          </Link>
        ) : null}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <PostCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  )
}

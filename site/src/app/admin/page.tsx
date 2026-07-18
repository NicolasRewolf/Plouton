import Link from "next/link"
import { resolveAdminArticleList } from "@/lib/posts-public"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Blog — Admin",
  robots: { index: false, follow: false },
}

export default async function AdminBlogPage() {
  const articles = await resolveAdminArticleList()
  const published = articles.filter((a) => a.status === "published").length
  const drafts = articles.length - published

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
            Backoffice
          </p>
          <h1 className="font-display mt-1 text-[28px] font-medium text-navy sm:text-[32px]">
            Blog
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Rédigez, publiez — visible sur le site sans redéployer.
          </p>
        </div>
        <Link href="/admin/nouveau" className="admin-btn admin-btn-primary">
          Nouvel article
        </Link>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={articles.length} />
        <StatCard label="Publiés" value={published} tone="ok" />
        <StatCard label="Brouillons" value={drafts} tone="muted" />
      </section>

      <section className="mt-8 overflow-hidden rounded-[16px] border border-[rgba(23,71,94,0.1)] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04),0_8px_24px_rgba(23,71,94,0.05)]">
        <div className="flex items-center justify-between border-b border-[rgba(23,71,94,0.08)] px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-navy">Articles</h2>
          <span className="text-[12px] text-muted">{articles.length} au total</span>
        </div>
        <ul className="divide-y divide-[rgba(23,71,94,0.06)]">
          {articles.map((a) => (
            <li key={a.slug}>
              <div className="group flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-fog/70">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy">{a.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {a.publishedAt}
                    {a.categories[0] ? ` · ${a.categories[0]}` : ""}
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex items-center gap-2 text-[13px]">
                  <Link
                    href={`/post/${a.slug}`}
                    className="rounded-full px-3 py-1.5 text-navy/60 opacity-80 transition-opacity hover:bg-white hover:text-navy hover:opacity-100"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/admin/${a.slug}`}
                    className="rounded-full bg-navy/8 px-3 py-1.5 font-medium text-navy transition-colors hover:bg-navy hover:text-white"
                  >
                    Éditer
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {!articles.length ? (
          <p className="px-5 py-12 text-center text-[14px] text-muted">
            Aucun article pour l&apos;instant.
          </p>
        ) : null}
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "ok" | "muted"
}) {
  const valueClass =
    tone === "ok"
      ? "text-navy"
      : tone === "muted"
        ? "text-navy/55"
        : "text-navy"
  return (
    <div className="rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
      <p className="text-[12px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1 font-display text-[28px] leading-none tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published")
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(23,71,94,0.1)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-navy uppercase">
        Publié
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-[rgba(254,75,66,0.1)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
      Brouillon
    </span>
  )
}

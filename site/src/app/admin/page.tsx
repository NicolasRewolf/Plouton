import Link from "next/link"
import { resolveAdminArticleList } from "@/lib/posts-public"
import { isPostStatus, statusLabel, type PostStatus } from "@/lib/post-status"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Blog — Admin",
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 25

interface SearchParams {
  q?: string
  status?: string
  page?: string
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = (sp.q || "").trim().toLowerCase()
  const statusFilter = isPostStatus(sp.status) ? sp.status : "all"
  const page = Math.max(1, Number.parseInt(sp.page || "1", 10) || 1)

  const articles = await resolveAdminArticleList()
  const published = articles.filter((a) => a.status === "published").length
  const drafts = articles.filter((a) => a.status === "draft").length
  const scheduled = articles.filter((a) => a.status === "scheduled").length
  const archived = articles.filter((a) => a.status === "archived").length

  let filtered = articles
  if (statusFilter !== "all")
    filtered = filtered.filter((a) => a.status === statusFilter)
  if (q) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.categories.some((c) => c.toLowerCase().includes(q))
    )
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function hrefFor(overrides: Partial<{ q: string; status: string; page: number }>) {
    const params = new URLSearchParams()
    const nextQ = overrides.q !== undefined ? overrides.q : sp.q || ""
    const nextStatus =
      overrides.status !== undefined ? overrides.status : sp.status || "all"
    const nextPage = overrides.page !== undefined ? overrides.page : safePage
    if (nextQ) params.set("q", nextQ)
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus)
    if (nextPage > 1) params.set("page", String(nextPage))
    const s = params.toString()
    return s ? `/admin?${s}` : "/admin"
  }

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

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={articles.length} />
        <StatCard label="Publiés" value={published} tone="ok" />
        <StatCard label="Brouillons" value={drafts} tone="muted" />
        <StatCard
          label="Prog. / arch."
          value={scheduled + archived}
          tone="muted"
        />
      </section>

      <form
        method="get"
        action="/admin"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]"
      >
        <label className="grid min-w-[200px] flex-1 gap-1 text-[12px] font-medium text-navy">
          Recherche
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Titre, slug, catégorie…"
            className="admin-input"
          />
        </label>
        <label className="grid gap-1 text-[12px] font-medium text-navy">
          Statut
          <select
            name="status"
            defaultValue={statusFilter === "all" ? "all" : statusFilter}
            className="admin-input min-w-[140px]"
          >
            <option value="all">Tous</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="scheduled">Programmés</option>
            <option value="archived">Archivés</option>
          </select>
        </label>
        <button type="submit" className="admin-btn admin-btn-secondary">
          Filtrer
        </button>
        {q || statusFilter !== "all" ? (
          <Link href="/admin" className="text-[13px] text-muted hover:text-navy">
            Réinitialiser
          </Link>
        ) : null}
      </form>

      <section className="mt-4 overflow-hidden rounded-[16px] border border-[rgba(23,71,94,0.1)] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04),0_8px_24px_rgba(23,71,94,0.05)]">
        <div className="flex items-center justify-between border-b border-[rgba(23,71,94,0.08)] px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-navy">Articles</h2>
          <span className="text-[12px] text-muted">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            {filtered.length !== articles.length ? ` / ${articles.length}` : ""}
          </span>
        </div>
        <ul className="divide-y divide-[rgba(23,71,94,0.06)]">
          {slice.map((a) => (
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
        {!slice.length ? (
          <p className="px-5 py-12 text-center text-[14px] text-muted">
            Aucun article pour ces filtres.
          </p>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(23,71,94,0.08)] px-5 py-3.5">
            <p className="text-[12px] text-muted">
              Page {safePage} / {totalPages}
            </p>
            <div className="flex gap-2">
              {safePage > 1 ? (
                <Link
                  href={hrefFor({ page: safePage - 1 })}
                  className="admin-btn admin-btn-secondary text-[12px]"
                >
                  ← Précédent
                </Link>
              ) : null}
              {safePage < totalPages ? (
                <Link
                  href={hrefFor({ page: safePage + 1 })}
                  className="admin-btn admin-btn-secondary text-[12px]"
                >
                  Suivant →
                </Link>
              ) : null}
            </div>
          </div>
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

function StatusBadge({ status }: { status: PostStatus }) {
  const label = statusLabel(status)
  if (status === "published")
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(23,71,94,0.1)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-navy uppercase">
        {label}
      </span>
    )
  if (status === "scheduled")
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(23,71,94,0.06)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-navy/70 uppercase">
        {label}
      </span>
    )
  if (status === "archived")
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(23,71,94,0.04)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-[rgba(254,75,66,0.1)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
      {label}
    </span>
  )
}

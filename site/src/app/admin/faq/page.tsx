import Link from "next/link"
import { redirect } from "next/navigation"
import { listFaqAdmin } from "@/lib/faq-db"
import {
  FAQ_EXPERTISE_OPTIONS,
  faqExpertiseLabel,
} from "@/lib/faq-expertises"
import { supabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "FAQ — Admin",
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 40

function buildHref(opts: {
  q?: string
  expertise?: string
  status?: string
  page?: number
}) {
  const params = new URLSearchParams()
  if (opts.q) params.set("q", opts.q)
  if (opts.expertise) params.set("expertise", opts.expertise)
  if (opts.status && opts.status !== "all") params.set("status", opts.status)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  const qs = params.toString()
  return qs ? `/admin/faq?${qs}` : "/admin/faq"
}

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    expertise?: string
    status?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const q = (sp.q || "").trim().slice(0, 80)
  const expertise = FAQ_EXPERTISE_OPTIONS.some((o) => o.slug === sp.expertise)
    ? sp.expertise
    : undefined
  const status =
    sp.status === "draft" || sp.status === "published" ? sp.status : "all"
  const page = Math.max(1, Number.parseInt(sp.page || "1", 10) || 1)

  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const result = await listFaqAdmin({
    q: q || undefined,
    expertiseSlug: expertise,
    status,
    page,
    pageSize: PAGE_SIZE,
  })

  if (!result) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <h1 className="font-display text-[28px] font-medium text-navy">FAQ</h1>
        <p className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-navy">
          Base FAQ indisponible. Vérifiez la clé Supabase et que la migration{" "}
          <code className="text-[13px]">0006_faq.sql</code> a bien été appliquée.
        </p>
      </main>
    )
  }

  const { items, total } = result
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
            Backoffice
          </p>
          <h1 className="font-display mt-1 text-[28px] font-medium text-navy sm:text-[32px]">
            FAQ
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {total} question{total > 1 ? "s" : ""}
            {expertise ? ` · ${faqExpertiseLabel(expertise)}` : ""}
            {q ? ` · « ${q} »` : ""}
          </p>
        </div>
        <Link href="/admin/faq/new" className="admin-btn admin-btn-primary">
          Nouvelle question
        </Link>
      </header>

      <form
        method="get"
        action="/admin/faq"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-[14px] border border-[rgba(23,71,94,0.1)] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04)]"
      >
        <label className="grid min-w-[180px] flex-1 gap-1 text-[12px] font-medium text-navy">
          Recherche
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Question, réponse, sous-sujet…"
            className="admin-input min-h-11 text-[14px]"
          />
        </label>
        <label className="grid min-w-[180px] gap-1 text-[12px] font-medium text-navy">
          Expertise
          <select
            name="expertise"
            defaultValue={expertise || ""}
            className="admin-input min-h-11 text-[14px]"
          >
            <option value="">Toutes</option>
            {FAQ_EXPERTISE_OPTIONS.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-[140px] gap-1 text-[12px] font-medium text-navy">
          Statut
          <select
            name="status"
            defaultValue={status}
            className="admin-input min-h-11 text-[14px]"
          >
            <option value="all">Tous</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
          </select>
        </label>
        <button type="submit" className="admin-btn admin-btn-primary min-h-11 px-5">
          Filtrer
        </button>
        {q || expertise || status !== "all" ? (
          <Link
            href="/admin/faq"
            className="admin-btn inline-flex min-h-11 items-center px-4 text-[13px]"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <ul className="mt-6 space-y-2">
        {items.length === 0 ? (
          <li className="rounded-[14px] border border-dashed border-[rgba(23,71,94,0.15)] bg-white px-4 py-8 text-center text-[14px] text-muted">
            Aucune question. Importez le CSV ou créez-en une.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/faq/${item.id}`}
                className="flex flex-col gap-1 rounded-[14px] border border-[rgba(23,71,94,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(23,71,94,0.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(23,71,94,0.08)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-navy">
                    {item.question}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {faqExpertiseLabel(item.expertiseSlug)}
                    {item.sousExpertise ? ` · ${item.sousExpertise}` : ""}
                  </p>
                </div>
                <span
                  className={
                    item.status === "published"
                      ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
                      : "shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600"
                  }
                >
                  {item.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex items-center justify-between gap-3"
          aria-label="Pagination FAQ"
        >
          {safePage > 1 ? (
            <Link
              href={buildHref({
                q: q || undefined,
                expertise,
                status,
                page: safePage - 1,
              })}
              className="admin-btn text-[13px]"
            >
              ← Précédent
            </Link>
          ) : (
            <span />
          )}
          <p className="text-[13px] text-muted">
            Page {safePage} / {totalPages}
          </p>
          {safePage < totalPages ? (
            <Link
              href={buildHref({
                q: q || undefined,
                expertise,
                status,
                page: safePage + 1,
              })}
              className="admin-btn text-[13px]"
            >
              Suivant →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  )
}

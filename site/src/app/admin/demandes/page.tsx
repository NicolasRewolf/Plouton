import Link from "next/link"
import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/server"
import { STATUTS, badgeClass } from "./statuts"

export const metadata = { title: "Demandes — Admin", robots: { index: false, follow: false } }

const PAGE_SIZE = 40

interface DemandeRow {
  id: string
  received_at: string
  prenom: string | null
  nom: string | null
  email: string | null
  objet: string | null
  statut: string
  candidature: boolean
  fichiers: string[]
}

function sanitizeQuery(raw: string | undefined): string {
  if (!raw) return ""
  return raw.trim().slice(0, 80).replace(/[%_,."()\\]/g, " ").replace(/\s+/g, " ")
}

/** Pattern ilike PostgREST, entre guillemets (espaces OK). */
function ilikePattern(q: string): string {
  return `"%${q.replace(/"/g, "")}%"`
}

function buildHref(opts: { statut?: string; q?: string; page?: number }) {
  const params = new URLSearchParams()
  if (opts.statut) params.set("statut", opts.statut)
  if (opts.q) params.set("q", opts.q)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  const qs = params.toString()
  return qs ? `/admin/demandes?${qs}` : "/admin/demandes"
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; page?: string }>
}) {
  const sp = await searchParams
  const statut = sp.statut && STATUTS.includes(sp.statut) ? sp.statut : undefined
  const q = sanitizeQuery(sp.q)
  const page = Math.max(1, Number.parseInt(sp.page || "1", 10) || 1)

  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from("demandes")
    .select("id, received_at, prenom, nom, email, objet, statut, candidature, fichiers", {
      count: "exact",
    })
    .order("received_at", { ascending: false })
    .range(from, to)

  if (statut) query = query.eq("statut", statut)
  if (q) {
    const p = ilikePattern(q)
    query = query.or(
      `prenom.ilike.${p},nom.ilike.${p},email.ilike.${p},objet.ilike.${p},message.ilike.${p},entreprise.ilike.${p}`
    )
  }

  const { data: demandes, error, count } = await query
  if (error) throw new Error(`Lecture demandes : ${error.message}`)

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <header>
        <p className="text-[12px] font-medium tracking-[0.12em] text-navy/45 uppercase">
          Backoffice
        </p>
        <h1 className="font-display mt-1 text-[28px] font-medium text-navy sm:text-[32px]">
          Demandes
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {total} demande{total > 1 ? "s" : ""}
          {statut ? ` · ${statut}` : ""}
          {q ? ` · « ${q} »` : ""} — {user.email}
        </p>
      </header>

      <form action="/admin/demandes" method="get" className="mt-6 flex flex-wrap gap-2">
        {statut ? <input type="hidden" name="statut" value={statut} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nom, e-mail, objet, message…"
          className="admin-input min-h-11 min-w-[220px] flex-1 text-[14px]"
          aria-label="Rechercher dans les demandes"
        />
        <button type="submit" className="admin-btn admin-btn-primary min-h-11 px-5">
          Rechercher
        </button>
        {q ? (
          <Link
            href={buildHref({ statut })}
            className="admin-btn inline-flex min-h-11 items-center px-4 text-[13px]"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        <FilterChip href={buildHref({ q })} active={!statut} label="Toutes" />
        {STATUTS.map((s) => (
          <FilterChip
            key={s}
            href={buildHref({ statut: s, q })}
            active={statut === s}
            label={s}
          />
        ))}
      </nav>

      <ul className="mt-6 space-y-2.5">
        {(demandes as DemandeRow[] | null)?.map((d) => (
          <li key={d.id}>
            <Link
              href={`/admin/demandes/${d.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(23,71,94,0.06),0_6px_18px_rgba(23,71,94,0.05)] hover:shadow-[0_2px_6px_rgba(23,71,94,0.09),0_10px_26px_rgba(23,71,94,0.08)]"
            >
              <span className="min-w-32 text-[13px] tabular-nums text-muted">
                {new Date(d.received_at).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="min-w-40 font-medium text-navy">
                {[d.prenom, d.nom].filter(Boolean).join(" ") || "(sans nom)"}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                {d.objet}
                {d.email ? ` · ${d.email}` : ""}
              </span>
              {d.candidature ? (
                <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-medium text-navy">
                  Candidature
                </span>
              ) : null}
              {d.fichiers?.length ? (
                <span className="text-[12px] text-muted">📎 {d.fichiers.length}</span>
              ) : null}
              <span className={badgeClass(d.statut)}>{d.statut}</span>
            </Link>
          </li>
        ))}
      </ul>

      {!demandes?.length ? (
        <p className="mt-10 text-center text-[14px] text-muted">
          Aucune demande
          {statut ? ` en « ${statut} »` : ""}
          {q ? ` pour « ${q} »` : ""}.
        </p>
      ) : null}

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex flex-wrap items-center justify-between gap-3"
          aria-label="Pagination"
        >
          <p className="text-[13px] text-muted">
            Page {safePage} / {totalPages}
          </p>
          <div className="flex gap-2">
            {safePage > 1 ? (
              <Link
                href={buildHref({ statut, q, page: safePage - 1 })}
                className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-navy shadow-[inset_0_0_0_1px_rgba(23,71,94,0.12)] hover:bg-fog"
              >
                ← Précédent
              </Link>
            ) : null}
            {safePage < totalPages ? (
              <Link
                href={buildHref({ statut, q, page: safePage + 1 })}
                className="rounded-full bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy-soft"
              >
                Suivant →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </main>
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-navy px-3.5 py-1.5 text-[13px] font-medium text-white"
          : "rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-navy shadow-[inset_0_0_0_1px_rgba(23,71,94,0.12)] hover:bg-fog"
      }
    >
      {label}
    </Link>
  )
}

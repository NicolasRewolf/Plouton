import Link from "next/link"
import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/server"
import { STATUTS, badgeClass } from "./statuts"

export const metadata = { title: "Demandes — Admin", robots: { index: false, follow: false } }

interface DemandeRow {
  id: string
  received_at: string
  prenom: string | null
  nom: string | null
  objet: string | null
  statut: string
  candidature: boolean
  fichiers: string[]
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>
}) {
  const { statut } = await searchParams
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  // Client lié à la session → la lecture passe par les policies « avocats ».
  let query = supabase
    .from("demandes")
    .select("id, received_at, prenom, nom, objet, statut, candidature, fichiers")
    .order("received_at", { ascending: false })
    .limit(200)
  if (statut && STATUTS.includes(statut)) query = query.eq("statut", statut)
  const { data: demandes, error } = await query
  if (error) throw new Error(`Lecture demandes : ${error.message}`)

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
          {demandes?.length ?? 0} demande{(demandes?.length ?? 0) > 1 ? "s" : ""}
          {statut ? ` · ${statut}` : ""} — {user.email}
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        <FilterChip href="/admin/demandes" active={!statut} label="Toutes" />
        {STATUTS.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/demandes?statut=${encodeURIComponent(s)}`}
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
              <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{d.objet}</span>
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
          Aucune demande{statut ? ` en « ${statut} »` : ""}.
        </p>
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

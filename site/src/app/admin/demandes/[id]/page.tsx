import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import { STATUTS, badgeClass } from "../statuts"

export const metadata = { title: "Demande — Admin", robots: { index: false, follow: false } }

async function changerStatut(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  const statut = String(formData.get("statut") || "")
  if (!id || !STATUTS.includes(statut)) return
  const supabase = await supabaseServer()
  // Update via la session utilisateur : policies + GRANT colonnes (statut,
  // notes) font autorité — toute autre colonne serait refusée par Postgres.
  const { error } = await supabase.from("demandes").update({ statut }).eq("id", id)
  if (error) throw new Error(`Statut : ${error.message}`)
  revalidatePath(`/admin/demandes/${id}`)
  revalidatePath("/admin/demandes")
}

async function enregistrerNotes(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  const notes = String(formData.get("notes") || "").slice(0, 8000)
  if (!id) return
  const supabase = await supabaseServer()
  const { error } = await supabase.from("demandes").update({ notes }).eq("id", id)
  if (error) throw new Error(`Notes : ${error.message}`)
  revalidatePath(`/admin/demandes/${id}`)
}

export default async function DemandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: d, error } = await supabase.from("demandes").select("*").eq("id", id).single()
  if (error || !d) notFound()

  // URLs signées (1 h) pour les pièces jointes — la policy « avocats lisent
  // les pieces-jointes » autorise la signature avec la session utilisateur.
  const fichiers: { path: string; nom: string; url: string | null }[] = []
  for (const path of (d.fichiers as string[]) || []) {
    const { data: signed } = await supabase.storage.from("pieces-jointes").createSignedUrl(path, 3600)
    fichiers.push({ path, nom: path.split("/").pop() || path, url: signed?.signedUrl ?? null })
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/admin/demandes" className="text-[13px] text-muted hover:text-navy">
        ← Toutes les demandes
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[24px] font-medium text-navy">
          {[d.prenom, d.nom].filter(Boolean).join(" ") || "(sans nom)"}
          {d.candidature ? (
            <span className="ml-3 align-middle rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-medium text-navy">
              Candidature
            </span>
          ) : null}
        </h1>
        <span className={badgeClass(d.statut)}>{d.statut}</span>
      </header>
      <p className="mt-1 text-[13px] text-muted">
        Reçue le{" "}
        {new Date(d.received_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
        {d.page_source ? ` · depuis ${d.page_source}` : ""}
      </p>

      <section className="mt-6 grid gap-3 rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.06),0_8px_22px_rgba(23,71,94,0.05)] sm:grid-cols-2">
        <Info label="Objet" value={d.objet} />
        <Info label="Entreprise" value={d.entreprise} />
        <Info label="E-mail" value={d.email} href={d.email ? `mailto:${d.email}` : undefined} />
        <Info
          label="Téléphone"
          value={d.telephone}
          href={d.telephone ? `tel:${String(d.telephone).replace(/\s/g, "")}` : undefined}
        />
      </section>

      <section className="mt-4 rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.06),0_8px_22px_rgba(23,71,94,0.05)]">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-navy/50">Message</h2>
        <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-navy">{d.message}</p>
        {d.utm && Object.keys(d.utm).length ? (
          <p className="mt-4 text-[12px] text-muted">
            Mesure : {Object.entries(d.utm as Record<string, string>).map(([k, v]) => `${k}=${v}`).join(" · ")}
          </p>
        ) : null}
      </section>

      {fichiers.length ? (
        <section className="mt-4 rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.06),0_8px_22px_rgba(23,71,94,0.05)]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-navy/50">
            Pièces jointes ({fichiers.length})
          </h2>
          <ul className="mt-2 space-y-1.5">
            {fichiers.map((f) => (
              <li key={f.path}>
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener"
                    className="text-[14px] font-medium text-navy underline-offset-2 hover:text-accent hover:underline"
                  >
                    📎 {f.nom}
                  </a>
                ) : (
                  <span className="text-[14px] text-muted">📎 {f.nom} (lien indisponible)</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-muted">Liens valables 1 h — bucket privé.</p>
        </section>
      ) : null}

      <section className="mt-4 rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.06),0_8px_22px_rgba(23,71,94,0.05)]">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-navy/50">Traitement</h2>
        <form action={changerStatut} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={d.id} />
          {STATUTS.map((s) => (
            <button
              key={s}
              type="submit"
              name="statut"
              value={s}
              disabled={s === d.statut}
              className={
                s === d.statut
                  ? "rounded-full bg-navy px-3.5 py-1.5 text-[13px] font-medium text-white"
                  : "rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-navy shadow-[inset_0_0_0_1px_rgba(23,71,94,0.15)] hover:bg-fog"
              }
            >
              {s}
            </button>
          ))}
        </form>
        <form action={enregistrerNotes} className="mt-4 space-y-2">
          <input type="hidden" name="id" value={d.id} />
          <textarea
            name="notes"
            rows={4}
            defaultValue={d.notes ?? ""}
            placeholder="Notes internes (rappels, contexte, suite à donner…)"
            className="w-full resize-y rounded-[12px] border-0 bg-fog/50 px-4 py-3 text-[14px] leading-relaxed text-navy shadow-[inset_0_0_0_1px_rgba(23,71,94,0.1)] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-navy)]"
          />
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-full bg-navy px-5 text-[13px] font-semibold text-white hover:bg-navy-soft"
          >
            Enregistrer les notes
          </button>
        </form>
      </section>
    </main>
  )
}

function Info({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">{label}</p>
      {value ? (
        href ? (
          <a href={href} className="mt-0.5 block text-[14px] font-medium text-navy hover:text-accent">
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-[14px] font-medium text-navy">{value}</p>
        )
      ) : (
        <p className="mt-0.5 text-[14px] text-muted">—</p>
      )}
    </div>
  )
}

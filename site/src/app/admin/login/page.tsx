import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/server"

export const metadata = { title: "Connexion — Admin", robots: { index: false, follow: false } }

async function envoyerLien(formData: FormData) {
  "use server"
  const email = String(formData.get("email") || "").trim().toLowerCase()
  if (!email || !email.includes("@")) redirect("/admin/login?erreur=email")
  const supabase = await supabaseServer()
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3000"
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Comptes créés côté serveur uniquement — jamais d'inscription libre.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/admin`,
    },
  })
  // Réponse identique que le compte existe ou non (pas d'énumération).
  if (error && !/signups not allowed|user not found/i.test(error.message)) {
    console.error("signInWithOtp:", error.message)
    redirect("/admin/login?erreur=envoi")
  }
  redirect("/admin/login?envoye=1")
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; erreur?: string }>
}) {
  const params = await searchParams
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-[20px] border border-[rgba(23,71,94,0.1)] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(23,71,94,0.05),0_16px_40px_rgba(23,71,94,0.08)] sm:px-8">
        <p className="text-[12px] font-medium tracking-[0.14em] text-navy/45 uppercase">
          Cabinet Plouton
        </p>
        <h1 className="font-display mt-2 text-[26px] font-medium text-navy">
          Espace cabinet
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Entrez votre adresse e-mail professionnelle : vous recevrez un lien de
          connexion sécurisé (aucun mot de passe à retenir).
        </p>
        {params.envoye ? (
          <p
            className="mt-6 rounded-[12px] bg-navy/5 px-4 py-3 text-[14px] text-navy"
            role="status"
          >
            Si un compte existe pour cette adresse, un lien de connexion vient
            d&apos;être envoyé. Pensez aux indésirables.
          </p>
        ) : (
          <form action={envoyerLien} className="mt-6 space-y-3">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="prenom@jplouton-avocat.fr"
              className="admin-input min-h-12 w-full text-base"
            />
            {params.erreur ? (
              <p className="text-[13px] text-accent" role="alert">
                {params.erreur === "email"
                  ? "Adresse invalide."
                  : "Envoi impossible — réessayez."}
              </p>
            ) : null}
            <button type="submit" className="admin-btn admin-btn-primary w-full min-h-12">
              Recevoir le lien de connexion
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

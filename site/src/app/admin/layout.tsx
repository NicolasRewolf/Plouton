import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/AdminShell"
import { supabaseServer } from "@/lib/supabase/server"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin",
}

async function signOutAction() {
  "use server"
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell signOutAction={signOutAction}>
      {children}
    </AdminShell>
  )
}

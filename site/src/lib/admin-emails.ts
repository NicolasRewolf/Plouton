/**
 * Allowlist optionnelle des e-mails admin (V1 légère).
 * Si `ADMIN_EMAILS` est vide / absent → tout compte Auth Supabase existant
 * peut entrer (comportement historique : shouldCreateUser: false).
 * Si renseigné → seuls ces e-mails (virgules) passent le proxy `/admin`.
 */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const raw = process.env.ADMIN_EMAILS?.trim()
  if (!raw) return true
  if (!email) return false
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (!allow.length) return true
  return allow.includes(email.trim().toLowerCase())
}

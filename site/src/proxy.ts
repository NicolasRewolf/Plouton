import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Proxy (ex-middleware, Next 16) — périmètre /admin uniquement :
 * rafraîchit la session Supabase (cookies) et redirige les anonymes vers
 * /admin/login. Vérification optimiste : les pages et actions revérifient
 * l'utilisateur, et RLS reste le juge final côté données.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options)
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLogin = pathname.startsWith("/admin/login")
  if (!user && !isLogin) {
    const login = request.nextUrl.clone()
    login.pathname = "/admin/login"
    login.searchParams.set("next", pathname)
    return NextResponse.redirect(login)
  }
  if (user && isLogin) {
    const boite = request.nextUrl.clone()
    boite.pathname = "/admin/demandes"
    boite.search = ""
    return NextResponse.redirect(boite)
  }
  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}

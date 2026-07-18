"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const NAV = [
  {
    href: "/admin",
    label: "Blog",
    match: (p: string) =>
      p === "/admin" ||
      (p.startsWith("/admin/") &&
        !p.startsWith("/admin/demandes") &&
        p !== "/admin/login"),
  },
  {
    href: "/admin/demandes",
    label: "Demandes",
    match: (p: string) => p.startsWith("/admin/demandes"),
  },
]

interface AdminShellProps {
  children: ReactNode
  signOutAction: () => Promise<void>
}

export function AdminShell({ children, signOutAction }: AdminShellProps) {
  const pathname = usePathname() || ""
  const isLogin = pathname === "/admin/login"

  if (isLogin) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-[#eef1f3]">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-[rgba(23,71,94,0.1)] bg-navy text-white lg:flex">
        <div className="px-5 pt-7 pb-6">
          <Link href="/admin" className="block">
            <p className="font-display text-[22px] leading-none tracking-tight">Plouton</p>
            <p className="mt-1.5 text-[11px] tracking-[0.14em] text-white/55 uppercase">
              Espace cabinet
            </p>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-[10px] bg-white/12 px-3.5 py-2.5 text-[14px] font-medium text-white"
                    : "rounded-[10px] px-3.5 py-2.5 text-[14px] text-white/70 transition-colors hover:bg-white/8 hover:text-white"
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[10px] px-3.5 py-2.5 text-[13px] text-white/65 transition-colors hover:bg-white/8 hover:text-white"
          >
            Voir le site ↗
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-[10px] px-3.5 py-2.5 text-left text-[13px] text-white/55 transition-colors hover:bg-white/8 hover:text-white"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[rgba(23,71,94,0.1)] bg-[#eef1f3]/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link href="/admin" className="font-display text-lg text-navy">
            Plouton
          </Link>
          <nav className="flex items-center gap-1" aria-label="Admin mobile">
            {NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-full bg-navy px-3 py-1.5 text-[12px] font-medium text-white"
                      : "rounded-full px-3 py-1.5 text-[12px] font-medium text-navy/70 hover:bg-white"
                  }
                >
                  {item.label}
                </Link>
              )
            })}
            <form action={signOutAction}>
              <button type="submit" className="px-2 text-[12px] text-muted hover:text-navy">
                Sortir
              </button>
            </form>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

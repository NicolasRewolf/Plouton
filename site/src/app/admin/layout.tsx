import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin blog",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-offwhite min-h-[70vh]">{children}</div>
}

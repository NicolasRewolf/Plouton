import type { Metadata } from "next"
import localFont from "next/font/local"
import { getSite } from "@/lib/content"
import "./globals.css"

const source = localFont({
  src: "../fonts/SourceSans3-var.woff2",
  variable: "--font-source",
  display: "swap",
})

const googleSans = localFont({
  src: "../fonts/GoogleSans-var.woff2",
  variable: "--font-google-sans",
  display: "swap",
})

const site = getSite()

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
    url: site.url,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${source.variable} ${googleSans.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-navy antialiased">{children}</body>
    </html>
  )
}

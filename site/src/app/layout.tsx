import type { Metadata } from "next"
import { getSite } from "@/lib/content"
import "./globals.css"

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
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-white text-navy">
        {/* Polices réelles du live (voir fonts.wix.css) — préchargées pour éviter le FOUT */}
        <link
          rel="preload"
          href="/fonts/wix/orig_source_sans_3_regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/wix/orig_google_sans_medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  )
}

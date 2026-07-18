import fs from "node:fs"
import path from "node:path"
import type { NextConfig } from "next"

type Redirect = { source: string; destination: string; permanent: boolean }

/** 161 règles 301 de l'export Wix, régénérées par scripts/generate-redirects.py */
const wixRedirects: Redirect[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "contenu", "redirects.json"), "utf8")
)

const nextConfig: NextConfig = {
  // Le site lit `contenu/` (racine du repo). Sans ce tracing, Vercel ne
  // déploie que `site/` et toutes les pages dynamiques tombent en 500.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/**": ["../contenu/**/*.json"],
  },
  images: {
    // Transition : images encore chez Wix tant que l'import ne les a pas rapatriées
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
    ],
  },
  async redirects() {
    // Règles propres au nouveau site — prioritaires sur l'export Wix
    const manual: Redirect[] = [
      { source: "/contact", destination: "/honoraires-rendez-vous", permanent: true },
      {
        source: "/rendez-vous-acces-honoraires",
        destination: "/honoraires-rendez-vous",
        permanent: true,
      },
      {
        source: "/defense-penale/trafic-de-stupefiant",
        destination: "/defense-penale/trafic-de-stupefiants",
        permanent: true,
      },
      {
        source: "/indemnisation-des-victimes/accident-de-la-route",
        destination: "/indemnisation-des-victimes/accidents-de-la-route",
        permanent: true,
      },
      // Live Wix : /medias = 404 ; grille réelle = catégorie blog Médias
      {
        source: "/medias",
        destination: "/blog/categories/médias",
        permanent: true,
      },
    ]
    const manualSources = new Set(manual.map((r) => r.source))
    return [...manual, ...wixRedirects.filter((r) => !manualSources.has(r.source))]
  },
}

export default nextConfig

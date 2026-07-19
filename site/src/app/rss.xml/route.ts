import { getSite } from "@/lib/content"
import { publishedIndex } from "@/lib/queries"

export const dynamic = "force-static"
export const revalidate = 3600

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function toRfc822(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return new Date().toUTCString()
  return d.toUTCString()
}

export async function GET() {
  const site = getSite()
  const articles = (await publishedIndex()).slice(0, 50)
  const feedUrl = `${site.url}/rss.xml`

  const items = articles
    .map((a) => {
      const link = `${site.url}/post/${encodeURIComponent(a.slug)}`
      const desc = escapeXml((a.excerpt || "").slice(0, 500))
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc822(a.publishedAt)}</pubDate>
      <description>${desc}</description>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)} — articles</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>fr-fr</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

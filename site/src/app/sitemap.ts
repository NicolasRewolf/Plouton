import type { MetadataRoute } from "next"
import { getSite, publishedArticles } from "@/lib/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const posts = publishedArticles().map((a) => ({
    url: `${site.url}/post/${a.slug}`,
    lastModified: new Date(a.publishedAt),
  }))
  return [
    { url: site.url, lastModified: new Date() },
    { url: `${site.url}/contact`, lastModified: new Date() },
    { url: `${site.url}/defense-penale/droit-penal`, lastModified: new Date() },
    ...posts,
  ]
}

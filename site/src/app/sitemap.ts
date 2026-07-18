import type { MetadataRoute } from "next"
import { getCategories, getSite, listExpertises, publishedArticles } from "@/lib/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const posts = publishedArticles().map((a) => ({
    url: `${site.url}/post/${a.slug}`,
    lastModified: new Date(a.publishedAt),
  }))
  const categories = getCategories().map((c) => ({
    url: `${site.url}/blog/categories/${c.slug}`,
    lastModified: new Date(),
  }))
  const expertises = listExpertises().map((e) => ({
    url: `${site.url}${e.path || `/${e.pole}/${e.slug}`}`,
    lastModified: new Date(),
  }))
  const pages = [
    "",
    "/honoraires-rendez-vous",
    "/notre-cabinet",
    "/nos-affaires",
    "/comprendre-le-droit",
    "/mentions-legales",
    "/politique-de-confidentialite",
    "/cookies",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
  }))
  return [...pages, { url: `${site.url}/blog`, lastModified: new Date() }, ...categories, ...expertises, ...posts]
}

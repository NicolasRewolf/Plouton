import type { MetadataRoute } from "next"
import { getSite, listAuthors, listExpertises } from "@/lib/content"
import { publishedIndex } from "@/lib/queries"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSite()
  const posts = (await publishedIndex()).map((a) => ({
    url: `${site.url}/post/${a.slug}`,
    lastModified: new Date(a.publishedAt),
  }))
  const expertises = listExpertises().map((e) => ({
    url: `${site.url}${e.path || `/${e.pole}/${e.slug}`}`,
    lastModified: new Date(),
  }))
  const auteurs = listAuthors().map((a) => ({
    url: `${site.url}/auteur/${a.id}`,
    lastModified: new Date(),
  }))
  const pages = [
    "",
    "/honoraires-rendez-vous",
    "/notre-cabinet",
    "/nos-affaires",
    "/medias",
    "/comprendre-le-droit",
    "/defense-penale",
    "/indemnisation-des-victimes",
    "/droit-des-contrats-et-des-personnes",
    "/mentions-legales",
    "/politique-de-confidentialite",
    "/cookies",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
  }))
  return [...pages, ...expertises, ...auteurs, ...posts]
}

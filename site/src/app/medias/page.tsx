import type { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { getContentPage, getSite, publishedArticles } from "@/lib/content"

export function generateMetadata(): Metadata {
  const page = getContentPage("medias")
  return {
    title: { absolute: page?.metaTitle || "Médias" },
    description: page?.metaDescription || page?.intro,
  }
}

export default function MediasPage() {
  const page = getContentPage("medias")
  const medias = publishedArticles().filter((a) =>
    a.categories.some((c) => c.toLowerCase().includes("média"))
  )
  const list = medias.length ? medias : publishedArticles().slice(0, 24)

  return (
    <>
      <Header variant="site" />
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-navy">
          {page?.title || "Médias"}
        </h1>
        {page?.intro ? (
          <p className="mt-5 text-[15px] leading-relaxed text-navy">{page.intro}</p>
        ) : null}
        <div className="mt-12 divide-y divide-line">
          {list.map((a) => (
            <Link key={a.slug} href={`/post/${a.slug}`} className="group block py-5">
              <h2 className="font-display text-xl font-semibold text-navy group-hover:text-accent">
                {a.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}

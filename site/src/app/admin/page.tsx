import Link from "next/link"
import { listArticleIndex } from "@/lib/content"

export const metadata = {
  title: "Admin blog",
  robots: { index: false, follow: false },
}

export default function AdminBlogPage() {
  const articles = listArticleIndex()
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Backoffice blog</h1>
          <p className="mt-1 text-sm text-muted">
            {articles.length} articles importés depuis Wix · fichiers dans{" "}
            <code>contenu/articles/</code>
          </p>
        </div>
        <Link
          href="/admin/nouveau"
          className="bg-accent px-4 py-2 text-white hover:bg-accent-hover"
        >
          Nouvel article
        </Link>
      </div>
      <ul className="divide-y divide-line border border-line bg-white">
        {articles.map((a) => (
          <li key={a.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs text-muted">
                {a.publishedAt} · {a.categories.slice(0, 2).join(" · ")}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/post/${a.slug}`} className="text-navy hover:underline">
                Voir
              </Link>
              <Link href={`/admin/${a.slug}`} className="text-accent hover:underline">
                Éditer
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm">
        <Link href="/" className="hover:text-accent">
          ← Retour site
        </Link>
      </p>
    </div>
  )
}

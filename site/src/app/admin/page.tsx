import Link from "next/link"
import { listArticles } from "@/lib/content"

export const metadata = {
  title: "Admin blog",
  robots: { index: false, follow: false },
}

export default function AdminBlogPage() {
  const articles = listArticles()
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">Backoffice blog</h1>
          <p className="text-sm text-graytext mt-1">
            POC local — fichiers dans <code>contenu/articles/</code>. noindex.
          </p>
        </div>
        <Link href="/admin/nouveau" className="bg-accent text-white px-4 py-2 hover:bg-accent-hover">
          Nouvel article
        </Link>
      </div>
      <ul className="divide-y divide-line border border-line bg-white">
        {articles.map((a) => (
          <li key={a.slug} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-graytext mt-1">
                {a.status === "published" ? "Publié" : "Brouillon"} · {a.slug}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              {a.status === "published" ? (
                <Link href={`/post/${a.slug}`} className="text-petrol hover:underline">
                  Voir
                </Link>
              ) : null}
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

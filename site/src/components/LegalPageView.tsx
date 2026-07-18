import Link from "next/link"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { LegalToc, type LegalTocItem } from "@/components/LegalToc"
import type { LegalPageContent } from "@/lib/content"

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-pretty">
          {renderInline(p)}
        </p>
      ))}
    </>
  )
}

/** Liens markdown simples `[label](url)` + retours ligne. */
function renderInline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!m) return <span key={i}>{part}</span>
    const href = m[2]
    const isExternal = href.startsWith("http") || href.startsWith("mailto:")
    if (isExternal)
      return (
        <a
          key={i}
          href={href}
          className="font-medium text-navy underline decoration-navy/25 underline-offset-4 transition-colors hover:decoration-accent hover:text-accent"
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {m[1]}
        </a>
      )
    return (
      <Link
        key={i}
        href={href}
        className="font-medium text-navy underline decoration-navy/25 underline-offset-4 transition-colors hover:decoration-accent hover:text-accent"
      >
        {m[1]}
      </Link>
    )
  })
}

export function LegalPageView({ page }: { page: LegalPageContent }) {
  const tocItems: LegalTocItem[] = (page.sections || [])
    .filter((s) => s.id && s.title)
    .map((s) => ({ id: s.id!, label: s.title! }))

  const related = page.relatedLinks || []

  return (
    <>
      <Header variant="site" />
      <main className="min-h-[60vh] bg-page">
        <div className="border-b border-line/60 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/45">
              Informations légales
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-navy text-balance">
              {page.h1 || page.title}
            </h1>
            {page.intro ? (
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy/70 text-pretty">
                {page.intro}
              </p>
            ) : null}
            {page.updatedAt ? (
              <p className="mt-4 text-[13px] text-muted">
                Mise à jour : {formatDateFr(page.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <LegalToc items={tocItems} variant="bar" />

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-16 lg:px-8 lg:py-14">
          <aside className="hidden lg:block">
            <LegalToc items={tocItems} variant="rail" />
          </aside>

          <article className="min-w-0">
            {page.todos?.length ? (
              <aside
                className="mb-10 rounded-[14px] border border-accent/25 bg-accent/[0.06] px-4 py-3.5 text-[14px] leading-relaxed text-navy"
                role="note"
              >
                <p className="font-medium text-accent">À confirmer</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-navy/80">
                  {page.todos.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </aside>
            ) : null}

            <div className="space-y-12">
              {(page.sections || []).map((section) => (
                <section
                  key={section.id || section.title}
                  id={section.id}
                  className="scroll-mt-36"
                >
                  {section.title ? (
                    <h2 className="font-display text-[1.55rem] font-medium leading-tight tracking-[-0.02em] text-navy text-balance">
                      {section.title}
                    </h2>
                  ) : null}
                  {section.paragraphs?.length ? (
                    <div className="prose-plouton mt-4 space-y-4 text-[16.5px] leading-[1.65] text-navy/85">
                      <Paragraphs paragraphs={section.paragraphs} />
                    </div>
                  ) : null}
                  {section.subsections?.map((sub) => (
                    <div
                      key={sub.id || sub.title}
                      id={sub.id}
                      className="mt-8 scroll-mt-36"
                    >
                      <h3 className="font-display text-[1.15rem] font-medium tracking-[-0.015em] text-navy">
                        {sub.title}
                      </h3>
                      <div className="prose-plouton mt-3 space-y-3 text-[16px] leading-[1.65] text-navy/80">
                        <Paragraphs paragraphs={sub.paragraphs} />
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>

            {related.length > 0 ? (
              <nav
                aria-label="Pages liées"
                className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-8 text-[14px]"
              >
                {related.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-medium text-navy underline decoration-navy/20 underline-offset-4 transition-colors hover:decoration-accent hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}

function formatDateFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

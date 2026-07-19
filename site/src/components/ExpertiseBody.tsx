import Link from "next/link"
import dynamic from "next/dynamic"
import type { ReactNode } from "react"

/** Simulateurs divorce — client islands, hors bundle hero. */
const SimulatorPension = dynamic(() =>
  import("@/components/simulators/SimulatorPension").then((m) => m.SimulatorPension)
)
const SimulatorPrestation = dynamic(() =>
  import("@/components/simulators/SimulatorPrestation").then(
    (m) => m.SimulatorPrestation
  )
)

interface Block {
  heading: string
  body: string
}

type SectionSimulator = "pension-alimentaire" | "prestation-compensatoire"

interface Section {
  id: string
  title: string
  titleAccent?: string | null
  lead?: string | null
  simulator?: SectionSimulator
  blocks: Block[]
}

function SectionSimulatorSlot({ type }: { type: SectionSimulator }) {
  if (type === "pension-alimentaire") return <SimulatorPension />
  if (type === "prestation-compensatoire") return <SimulatorPrestation />
  return null
}

export interface InlineLink {
  text: string
  href: string
}

interface BulletItem {
  title: string
  body: string
}

interface CaseItem {
  title: string
  amount?: string
  paragraphs: string[]
}

function cleanText(raw: string) {
  return raw.replace(/\u200b/g, "").replace(/\s+/g, " ").trim()
}

function isJunk(text: string) {
  const t = cleanText(text)
  if (!t) return true
  if (/^\d+$/.test(t)) return true
  return false
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Token court alphanumérique → bornes de mot (évite CIVI dans « civile »). */
function linkPattern(text: string) {
  const escaped = escapeRegExp(text)
  if (text.length <= 6 && /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/i.test(text))
    return `\\b${escaped}\\b`
  return escaped
}

/** Réinjecte les liens internes harvestés du live (phrases → URLs). */
function linkify(text: string, links: InlineLink[]): ReactNode[] {
  if (!text) return []
  if (!links.length) return [text]

  const usable = [...links]
    .filter((l) => l.text && l.href && l.text.length >= 4)
    .sort((a, b) => b.text.length - a.text.length)

  if (!usable.length) return [text]

  const pattern = usable.map((l) => linkPattern(l.text)).join("|")
  const re = new RegExp(`(${pattern})`, "gi")
  const hrefByLower = new Map(usable.map((l) => [l.text.toLowerCase(), l.href]))

  const parts = text.split(re)
  return parts.map((part, i) => {
    const href = hrefByLower.get(part.toLowerCase())
    if (!href) return <span key={i}>{part}</span>
    return (
      <Link key={i} href={href} className="link-inline font-medium">
        {part}
      </Link>
    )
  })
}


function accentSplit(title: string, titleAccent?: string | null) {
  if (titleAccent && title.includes(titleAccent)) {
    const idx = title.indexOf(titleAccent)
    return {
      before: title.slice(0, idx).trim(),
      accent: titleAccent,
      after: title.slice(idx + titleAccent.length).trim(),
    }
  }
  const colon = title.indexOf(":")
  if (colon > 0 && colon < 48)
    return {
      before: "",
      accent: title.slice(0, colon + 1),
      after: title.slice(colon + 1).trim(),
    }
  const first = title.split(/\s+/)[0]
  if (first && first.length > 3 && title.length > first.length + 8)
    return {
      before: "",
      accent: first,
      after: title.slice(first.length).trim(),
    }
  return { before: "", accent: null, after: title }
}

/** Dédoublonne le scrape Wix (paragraphes / titres répétés, numéros orphelins). */
function normalizeBlocks(blocks: Block[]): Block[] {
  const out: Block[] = []
  const seenBodies = new Set<string>()

  for (const b of blocks) {
    const heading = cleanText(b.heading || "")
    const body = (b.body || "").replace(/\u200b/g, "").trim()
    if (isJunk(body) && !heading) continue

    const bodyKey = cleanText(body).slice(0, 160).toLowerCase()
    if (bodyKey && seenBodies.has(bodyKey) && !heading) continue
    if (bodyKey) seenBodies.add(bodyKey)

    // Drop body that only repeats the previous heading block
    if (out.length) {
      const prev = out[out.length - 1]
      if (
        prev.heading &&
        bodyKey &&
        cleanText(prev.body).slice(0, 120).toLowerCase() === bodyKey.slice(0, 120)
      )
        continue
    }

    out.push({ heading, body })
  }
  return out
}

function parseBulletItems(text: string): BulletItem[] | null {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  const bulletLines = lines.filter((l) => /^[•\-–—]\s*/.test(l) || /^\d+[\.)]\s+/.test(l))
  if (bulletLines.length < 2) return null

  const items: BulletItem[] = []
  for (const line of bulletLines) {
    const raw = line.replace(/^[•\-–—]\s*/, "").replace(/^\d+[\.)]\s+/, "").trim()
    const m = raw.match(/^(.{3,90}?)(?:\s*[:：]\s*|\s+[—–-]\s+)([\s\S]+)$/)
    if (m) items.push({ title: m[1].trim(), body: m[2].trim() })
    else items.push({ title: "", body: raw })
  }
  return items.length ? items : null
}

function extractAmount(title: string) {
  const m = title.match(/(\d[\d\s.,]*\s*€)/)
  return m ? m[1].replace(/\s+/g, "\u00a0") : undefined
}

function looksLikeCaseTitle(title: string) {
  return /\d[\d\s.,]*\s*€|indemnisation|soutien|réévaluation|multipliée/i.test(title)
}

function groupCases(blocks: Block[]): CaseItem[] | null {
  const headed = blocks.filter((b) => b.heading && looksLikeCaseTitle(b.heading))
  if (headed.length < 2) return null

  const cases: CaseItem[] = []
  let current: CaseItem | null = null
  for (const b of blocks) {
    if (b.heading && looksLikeCaseTitle(b.heading)) {
      current = {
        title: b.heading,
        amount: extractAmount(b.heading),
        paragraphs: b.body && !isJunk(b.body) ? [b.body] : [],
      }
      cases.push(current)
      continue
    }
    if (current && b.body && !isJunk(b.body)) current.paragraphs.push(b.body)
  }
  return cases.length >= 2 ? cases : null
}

function proseParas(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !isJunk(p))
}

function Paragraphs({
  text,
  className,
  links,
}: {
  text: string
  className?: string
  links: InlineLink[]
}) {
  return (
    <>
      {proseParas(text).map((para, i) => (
        <p key={i} className={className || "text-[15px] leading-[1.7] text-pretty text-navy/90"}>
          {linkify(para, links)}
        </p>
      ))}
    </>
  )
}

function SectionHeading({ title, titleAccent }: { title: string; titleAccent?: string | null }) {
  const { before, accent, after } = accentSplit(title, titleAccent)
  return (
    <h2 className="max-w-3xl font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-balance">
      {accent ? (
        <>
          {before ? <span className="text-navy">{before} </span> : null}
          <span className="text-accent">{accent}</span>
          {after ? <span className="text-navy"> {after}</span> : null}
        </>
      ) : (
        <span className="text-navy">{title}</span>
      )}
    </h2>
  )
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 max-w-3xl border-l-2 border-accent/80 pl-4 text-[15px] leading-[1.7] text-pretty text-navy/85 sm:pl-5">
      {children}
    </div>
  )
}

function StepList({ items, links }: { items: BulletItem[]; links: InlineLink[] }) {
  return (
    <ol className="mt-8 space-y-4">
      {items.map((item, i) => (
        <li
          key={`${item.title}-${i}`}
          className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(23,71,94,0.04),0_10px_28px_rgba(23,71,94,0.06)] sm:gap-x-5 sm:p-5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[13px] font-semibold tabular-nums text-white">
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            {item.title ? (
              <p className="font-display text-[16px] font-medium leading-snug tracking-[-0.015em] text-navy">
                {linkify(item.title, links)}
              </p>
            ) : null}
            <p
              className={`text-[14px] leading-[1.65] text-pretty text-navy/80 sm:text-[15px] ${item.title ? "mt-1.5" : ""}`}
            >
              {linkify(item.body, links)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function HeadedSteps({ blocks, links }: { blocks: Block[]; links: InlineLink[] }) {
  const steps = blocks.filter((b) => b.heading)
  if (!steps.length) return null
  return (
    <ol className="mt-8 space-y-0">
      {steps.map((step, i) => {
        const bullets = step.body ? parseBulletItems(step.body) : null
        const titledBullets = bullets?.filter((b) => b.title) || []
        const intro =
          bullets && titledBullets.length >= 3
            ? step.body
                .split(/\n+/)
                .map((l) => l.trim())
                .filter((l) => l && !/^[•\-–—]/.test(l) && !isJunk(l))
                .join("\n\n")
            : null

        return (
          <li key={`${step.heading}-${i}`} className="relative grid grid-cols-[auto_1fr] gap-x-4 sm:gap-x-5">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[13px] font-semibold tabular-nums text-white">
                {i + 1}
              </span>
              {i < steps.length - 1 ? (
                <span className="mt-2 w-px flex-1 bg-line" aria-hidden />
              ) : null}
            </div>
            <div className={`min-w-0 ${i < steps.length - 1 ? "pb-8" : ""}`}>
              <h3 className="font-display text-[17px] font-medium leading-snug tracking-[-0.015em] text-navy text-balance sm:text-[18px]">
                {linkify(step.heading, links)}
              </h3>
              {intro ? (
                <div className="mt-2.5 space-y-3">
                  <Paragraphs text={intro} links={links} />
                </div>
              ) : null}
              {titledBullets.length >= 3 ? (
                <div className="mt-4">
                  <DefGrid items={titledBullets} links={links} />
                </div>
              ) : step.body && !isJunk(step.body) && !intro ? (
                <div className="mt-2.5 space-y-3">
                  <Paragraphs text={step.body} links={links} />
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CaseGrid({ cases, links }: { cases: CaseItem[]; links: InlineLink[] }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {cases.map((c) => (
        <article
          key={c.title}
          className="flex flex-col rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(23,71,94,0.04),0_12px_32px_rgba(23,71,94,0.07)] sm:p-6"
        >
          {c.amount ? (
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">
              {c.amount}
            </p>
          ) : null}
          <h3 className="mt-2 font-display text-[16px] font-medium leading-snug tracking-[-0.015em] text-navy text-balance sm:text-[17px]">
            {linkify(c.title, links)}
          </h3>
          <div className="mt-3 flex-1 space-y-2.5 text-[14px] leading-[1.65] text-navy/80">
            {c.paragraphs.slice(0, 3).map((p, i) => (
              <p key={i} className="text-pretty">
                {linkify(p, links)}
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function DefGrid({ items, links }: { items: BulletItem[]; links: InlineLink[] }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`} className="rounded-[16px] bg-fog/70 px-4 py-4 sm:px-5">
          {item.title ? (
            <p className="text-[14px] font-semibold leading-snug text-navy">
              {linkify(item.title, links)}
            </p>
          ) : null}
          <p
            className={`text-[13px] leading-[1.6] text-pretty text-navy/75 sm:text-[14px] ${item.title ? "mt-1.5" : ""}`}
          >
            {linkify(item.body, links)}
          </p>
        </div>
      ))}
    </div>
  )
}

function ProseBlocks({ blocks, links }: { blocks: Block[]; links: InlineLink[] }) {
  return (
    <div className="mt-7 space-y-8">
      {blocks.map((b, i) => (
        <div key={i} className="max-w-3xl">
          {b.heading ? (
            <h3 className="font-display text-[17px] font-medium leading-snug tracking-[-0.015em] text-navy">
              {linkify(b.heading, links)}
            </h3>
          ) : null}
          {b.body && !isJunk(b.body) ? (
            <div className={b.heading ? "mt-2.5 space-y-3" : "space-y-3"}>
              <Paragraphs text={b.body} links={links} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function renderSectionBody(blocks: Block[], links: InlineLink[]) {
  if (blocks.length === 1 && !blocks[0].heading) {
    const bullets = parseBulletItems(blocks[0].body)
    if (bullets && bullets.length >= 3) {
      const titled = bullets.filter((b) => b.title).length
      if (titled >= Math.ceil(bullets.length * 0.5)) return <StepList items={bullets} links={links} />
      if (titled >= 4) return <DefGrid items={bullets} links={links} />
      return <StepList items={bullets} links={links} />
    }
  }

  const cases = groupCases(blocks)
  if (cases) return <CaseGrid cases={cases} links={links} />

  const headed = blocks.filter((b) => b.heading)
  if (headed.length >= 2 && headed.length >= blocks.length * 0.4)
    return <HeadedSteps blocks={blocks} links={links} />

  const defBlock = blocks.find((b) => {
    if (!b.body) return false
    const bullets = parseBulletItems(b.body)
    return !!bullets && bullets.filter((x) => x.title).length >= 4
  })
  if (defBlock) {
    const bullets = parseBulletItems(defBlock.body)!
    const introLines = defBlock.body
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l && !/^[•\-–—]/.test(l) && !/^\d+[\.)]\s+/.test(l) && !isJunk(l))
    const otherBlocks = blocks.filter((b) => b !== defBlock)

    return (
      <div className="mt-7 space-y-8">
        {defBlock.heading ? (
          <h3 className="font-display text-[17px] font-medium leading-snug tracking-[-0.015em] text-navy">
            {linkify(defBlock.heading, links)}
          </h3>
        ) : null}
        {introLines.length ? (
          <div className="max-w-3xl space-y-3">
            <Paragraphs text={introLines.join("\n\n")} links={links} />
          </div>
        ) : null}
        <DefGrid items={bullets.filter((x) => x.title)} links={links} />
        {otherBlocks.length ? <ProseBlocks blocks={otherBlocks} links={links} /> : null}
      </div>
    )
  }

  return <ProseBlocks blocks={blocks} links={links} />
}

/** Corps éditorial expertise — étapes, cartes, grilles + liens internes du live. */
export function ExpertiseBody({
  sections,
  links = [],
}: {
  sections: Section[]
  links?: InlineLink[]
}) {
  return (
    <div className="bg-[#f7f8f9]">
      {sections.map((section, si) => {
        const blocks = normalizeBlocks(section.blocks || [])
        const lead = section.lead && !isJunk(section.lead) ? section.lead : null
        const zebra = si % 2 === 1

        return (
          <section
            key={section.id}
            id={section.id}
            className={`scroll-mt-36 border-b border-line/50 ${zebra ? "bg-white" : "bg-transparent"}`}
          >
            <div className="mx-auto max-w-6xl px-5 py-12 sm:py-14 lg:px-8 lg:py-16">
              <SectionHeading title={section.title} titleAccent={section.titleAccent} />
              {lead ? (
                <Lead>
                  <Paragraphs
                    text={lead}
                    links={links}
                    className="text-[15px] leading-[1.7] text-pretty text-navy/85"
                  />
                </Lead>
              ) : null}
              {section.simulator ? (
                <SectionSimulatorSlot type={section.simulator} />
              ) : null}
              {blocks.length ? renderSectionBody(blocks, links) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

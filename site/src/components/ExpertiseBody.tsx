import Link from "next/link"
import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import {
  chooseSectionLayout,
  isJunk,
  isTelHref,
  makeLinkResolver,
  normalizeBlocks,
  parseBulletItems,
  splitBodyChunks,
  type Block,
  type BulletItem,
  type CaseItem,
  type InlineLink,
  type LinkResolver,
  type Rich as RichText,
} from "@/lib/expertise-content"

/** Simulateurs divorce — client islands, hors bundle hero. */
const SimulatorPension = dynamic(() =>
  import("@/components/simulators/SimulatorPension").then((m) => m.SimulatorPension)
)
const SimulatorPrestation = dynamic(() =>
  import("@/components/simulators/SimulatorPrestation").then(
    (m) => m.SimulatorPrestation
  )
)

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

/**
 * Affiche du texte déjà résolu en segments.
 *
 * Les liens ne sont plus recollés ici par une regex : ils arrivent en données,
 * décidés une fois pour toute la page par `makeLinkResolver`.
 */
export function Rich({ parts }: { parts: RichText }) {
  return (
    <>
      {parts.map((part, i) =>
        !part.href ? (
          <span key={i}>{part.text}</span>
        ) : isTelHref(part.href) ? (
          <a key={i} href={part.href} className="link-inline font-medium">
            {part.text}
          </a>
        ) : (
          <Link key={i} href={part.href} className="link-inline font-medium">
            {part.text}
          </Link>
        )
      )}
    </>
  )
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

function BulletList({ items, links }: { items: string[]; links: LinkResolver }) {
  if (!items.length) return null
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.7] text-pretty text-navy/90 marker:text-accent">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {<Rich parts={links.resolve(item)} />}
        </li>
      ))}
    </ul>
  )
}

function Paragraphs({
  text,
  className,
  links,
}: {
  text: string
  className?: string
  links: LinkResolver
}) {
  const chunks = splitBodyChunks(text)
  if (!chunks.length) return null

  return (
    <>
      {chunks.map((chunk, i) => {
        if (chunk.type === "ul")
          return <BulletList key={i} items={chunk.value as string[]} links={links} />
        if (chunk.type === "h4")
          return (
            <h4
              key={i}
              className="font-display text-[15px] font-medium leading-snug tracking-[-0.015em] text-navy text-balance sm:text-[16px]"
            >
              {<Rich parts={links.resolve(chunk.value as string)} />}
            </h4>
          )
        return (
          <p key={i} className={className || "text-[15px] leading-[1.7] text-pretty text-navy/90"}>
            {<Rich parts={links.resolve(chunk.value as string)} />}
          </p>
        )
      })}
    </>
  )
}

function BlockHeading({
  heading,
  level,
  links,
}: {
  heading: string
  level: 3 | 4
  links: LinkResolver
}) {
  if (level === 4)
    return (
      <h4 className="font-display text-[15px] font-medium leading-snug tracking-[-0.015em] text-navy text-balance sm:text-[16px]">
        {<Rich parts={links.resolve(heading)} />}
      </h4>
    )
  return (
    <h3 className="font-display text-[17px] font-medium leading-snug tracking-[-0.015em] text-navy text-balance sm:text-[18px]">
      {<Rich parts={links.resolve(heading)} />}
    </h3>
  )
}

function BlockContent({ block, links }: { block: Block; links: LinkResolver }) {
  const level: 3 | 4 = block.headingLevel === 4 ? 4 : 3
  const hasBody = Boolean(block.body && !isJunk(block.body))
  const hasBullets = Boolean(block.bullets?.length)
  const hasChildren = Boolean(block.children?.length)

  return (
    <div className="max-w-3xl">
      {block.heading ? <BlockHeading heading={block.heading} level={level} links={links} /> : null}
      {hasBody ? (
        <div className={block.heading ? "mt-2.5 space-y-3" : "space-y-3"}>
          <Paragraphs text={block.body} links={links} />
        </div>
      ) : null}
      {hasBullets ? <BulletList items={block.bullets!} links={links} /> : null}
      {hasChildren ? (
        <div className={`space-y-5 ${block.heading || hasBody || hasBullets ? "mt-5" : ""}`}>
          {block.children!.map((child, i) => (
            <BlockContent key={i} block={{ ...child, headingLevel: child.headingLevel || 4 }} links={links} />
          ))}
        </div>
      ) : null}
    </div>
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

function StepList({ items, links }: { items: BulletItem[]; links: LinkResolver }) {
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
                {<Rich parts={links.resolve(item.title)} />}
              </p>
            ) : null}
            <p
              className={`text-[14px] leading-[1.65] text-pretty text-navy/80 sm:text-[15px] ${item.title ? "mt-1.5" : ""}`}
            >
              {<Rich parts={links.resolve(item.body)} />}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function HeadedSteps({ blocks, links }: { blocks: Block[]; links: LinkResolver }) {
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
              <BlockHeading
                heading={step.heading}
                level={step.headingLevel === 4 ? 4 : 3}
                links={links}
              />
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
              {step.bullets?.length ? (
                <BulletList items={step.bullets} links={links} />
              ) : null}
              {step.children?.length ? (
                <div className="mt-5 space-y-6">
                  <ProseBlocks blocks={step.children} links={links} />
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CaseGrid({ cases, links }: { cases: CaseItem[]; links: LinkResolver }) {
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
            {<Rich parts={links.resolve(c.title)} />}
          </h3>
          <div className="mt-3 flex-1 space-y-2.5 text-[14px] leading-[1.65] text-navy/80">
            {c.paragraphs.map((p, i) => (
              <p key={i} className="text-pretty">
                {<Rich parts={links.resolve(p)} />}
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function DefGrid({ items, links }: { items: BulletItem[]; links: LinkResolver }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`} className="rounded-[16px] bg-fog/70 px-4 py-4 sm:px-5">
          {item.title ? (
            <p className="text-[14px] font-semibold leading-snug text-navy">
              {<Rich parts={links.resolve(item.title)} />}
            </p>
          ) : null}
          <p
            className={`text-[13px] leading-[1.6] text-pretty text-navy/75 sm:text-[14px] ${item.title ? "mt-1.5" : ""}`}
          >
            {<Rich parts={links.resolve(item.body)} />}
          </p>
        </div>
      ))}
    </div>
  )
}

function ProseBlocks({ blocks, links }: { blocks: Block[]; links: LinkResolver }) {
  return (
    <div className="mt-7 space-y-8">
      {blocks.map((b, i) => (
        <BlockContent key={i} block={b} links={links} />
      ))}
    </div>
  )
}

/**
 * Rend le corps d'une section.
 *
 * Le CHOIX de la disposition n'est plus fait ici : `chooseSectionLayout` le
 * décide sur le contenu seul, et se teste sans monter un composant. Cette
 * fonction ne fait plus que traduire cette décision en balisage.
 */
function renderSectionBody(blocks: Block[], links: LinkResolver) {
  const layout = chooseSectionLayout(blocks)

  switch (layout.kind) {
    case "fidelity":
    case "prose":
      return <ProseBlocks blocks={blocks} links={links} />
    case "steps":
      return <StepList items={layout.items} links={links} />
    case "definitions-only":
      return <DefGrid items={layout.items} links={links} />
    case "cases":
      return <CaseGrid cases={layout.cases} links={links} />
    case "headed-steps":
      return <HeadedSteps blocks={blocks} links={links} />
    case "definitions":
      return (
        <div className="mt-7 space-y-8">
          {layout.block.heading ? (
            <BlockHeading
              heading={layout.block.heading}
              level={layout.block.headingLevel === 4 ? 4 : 3}
              links={links}
            />
          ) : null}
          {layout.intro.length ? (
            <div className="max-w-3xl space-y-3">
              <Paragraphs text={layout.intro.join("\n\n")} links={links} />
            </div>
          ) : null}
          <DefGrid items={layout.items} links={links} />
          {layout.others.length ? (
            <ProseBlocks blocks={layout.others} links={links} />
          ) : null}
        </div>
      )
  }
}

/** Corps éditorial expertise — étapes, cartes, grilles + liens internes du live. */
export function ExpertiseBody({
  sections,
  linker,
  links,
}: {
  sections: Section[]
  /** Linker partagé avec le reste de la page (chapô compris). */
  linker?: LinkResolver
  /** Rétrocompat : liens nus, mémoire limitée à ce composant. */
  links?: InlineLink[]
}) {
  const pageLinker = linker ?? makeLinkResolver(links)
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
                    links={pageLinker}
                    className="text-[15px] leading-[1.7] text-pretty text-navy/85"
                  />
                </Lead>
              ) : null}
              {section.simulator ? (
                <SectionSimulatorSlot type={section.simulator} />
              ) : null}
              {blocks.length ? renderSectionBody(blocks, pageLinker) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// Réexport : la page englobante crée LE resolver de la page.
export { makeLinkResolver }

/**
 * Lire le contenu d'expertise — l'interprétation, séparée de l'affichage.
 *
 * Les 15 pages d'expertise viennent d'un JSON semi-structuré, moissonné du
 * site Wix : des blocs `{ heading, body }` où les listes sont des lignes
 * commençant par un tiret, les sous-titres du Markdown, et les liens internes
 * une simple table `(phrase → URL)`.
 *
 * Tout cela était redeviné À CHAQUE RENDU, à l'intérieur du composant React :
 * 700 lignes où « qu'est-ce que ce contenu ? » et « comment je l'affiche ? »
 * étaient la même fonction, et où rien n'était vérifiable sans monter un
 * arbre React.
 *
 * Ce module ne rend rien. Il répond à la première question seulement, avec des
 * fonctions pures — donc testables, et épinglées par `check:expertise`.
 *
 * Le changement qui compte : **les liens deviennent des données**. Ils étaient
 * recollés au rendu par une regex construite sur le texte, si bien qu'une
 * phrase reformulée perdait son lien en silence, et qu'une expression fréquente
 * devenait un lien à chacune de ses apparitions. Ils sont désormais résolus une
 * fois, en segments (`Rich`), et l'affichage n'a plus qu'à les parcourir.
 */

export interface InlineLink {
  text: string
  href: string
}

/** Un fragment de texte, lié ou non. */
export interface Inline {
  text: string
  href?: string
}

/** Du texte enrichi : la forme que consomme l'affichage. */
export type Rich = Inline[]

export interface BulletItem {
  title: string
  body: string
}

export interface CaseItem {
  title: string
  amount?: string
  paragraphs: string[]
}

export interface Block {
  heading: string
  body: string
  headingLevel?: 3 | 4
  bullets?: string[]
  children?: Block[]
}

export type BodyChunk =
  | { type: "p"; value: string }
  | { type: "h4"; value: string }
  | { type: "ul"; value: string[] }

/* ────────────────────────── nettoyage ────────────────────────── */

export function cleanText(raw: string): string {
  return raw.replace(/​/g, "").replace(/\s+/g, " ").trim()
}

/** Rebut du moissonnage Wix : vide, ou purement numérique (numéro orphelin). */
export function isJunk(text: string): boolean {
  const t = cleanText(text)
  if (!t) return true
  return /^\d+$/.test(t)
}

/* ────────────────────────── liens ────────────────────────── */

const EMERGENCY_TELS: InlineLink[] = [
  { text: "3919", href: "tel:3919" },
  { text: "119", href: "tel:119" },
  { text: "17", href: "tel:17" },
]

export function isTelHref(href: string): boolean {
  return href.startsWith("tel:")
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Token court alphanumérique → bornes de mot (évite CIVI dans « civile »). */
function linkPattern(text: string): string {
  const escaped = escapeRegExp(text)
  if (text.length <= 6 && /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/i.test(text))
    return `\\b${escaped}\\b`
  return escaped
}

/**
 * Le résolveur de liens d'UNE page.
 *
 * Il porte la mémoire de ce qui a déjà été lié : une expression n'est liée
 * qu'à sa première occurrence de la page. Sans cette mémoire, « garde à vue »
 * devenait un lien sept fois sur la même page — lecture alourdie, maillage
 * interne dilué.
 *
 * Les numéros d'urgence font exception : on veut qu'ils restent composables
 * partout où ils sont cités.
 */
export interface LinkResolver {
  resolve(text: string): Rich
}

export function makeLinkResolver(links: InlineLink[] = []): LinkResolver {
  const usable = [...links, ...EMERGENCY_TELS]
    .filter((l) => l.text && l.href)
    .filter((l) => isTelHref(l.href) || l.text.length >= 4)
    .sort((a, b) => b.text.length - a.text.length)

  if (!usable.length) return { resolve: (text) => (text ? [{ text }] : []) }

  const re = new RegExp(`(${usable.map((l) => linkPattern(l.text)).join("|")})`, "gi")
  const hrefByLower = new Map(usable.map((l) => [l.text.toLowerCase(), l.href]))
  const linked = new Set<string>()

  return {
    resolve(text: string): Rich {
      if (!text) return []
      const out: Rich = []
      for (const part of text.split(re)) {
        if (!part) continue
        const key = part.toLowerCase()
        const href = hrefByLower.get(key)
        if (!href) {
          out.push({ text: part })
          continue
        }
        if (!isTelHref(href)) {
          if (linked.has(key)) {
            out.push({ text: part })
            continue
          }
          linked.add(key)
        }
        out.push({ text: part, href })
      }
      return out
    },
  }
}

/* ────────────────────────── structure ────────────────────────── */

/** Dédoublonne le moissonnage Wix (paragraphes / titres répétés). */
export function normalizeBlocks(blocks: Block[]): Block[] {
  const out: Block[] = []
  const seenBodies = new Set<string>()

  for (const b of blocks) {
    const heading = cleanText(b.heading || "")
    const body = (b.body || "").replace(/​/g, "").trim()
    const headingLevel = b.headingLevel === 4 ? 4 : b.headingLevel === 3 ? 3 : undefined
    const bullets = Array.isArray(b.bullets)
      ? b.bullets.map((x) => cleanText(x)).filter(Boolean)
      : undefined
    const children = b.children?.length ? normalizeBlocks(b.children) : undefined

    if (isJunk(body) && !heading && !bullets?.length && !children?.length) continue

    const bodyKey = cleanText(body).slice(0, 160).toLowerCase()
    if (bodyKey && seenBodies.has(bodyKey) && !heading && !bullets?.length) continue
    if (bodyKey) seenBodies.add(bodyKey)

    // Corps qui n'est que l'écho du bloc précédent (double du scrape Wix),
    // mais on garde un titre distinct même si le corps était dupliqué.
    if (out.length) {
      const prev = out[out.length - 1]
      const bodyEchoesPrev =
        Boolean(bodyKey) &&
        cleanText(prev.body).slice(0, 120).toLowerCase() === bodyKey.slice(0, 120)
      if (
        bodyEchoesPrev &&
        (!heading || heading === prev.heading) &&
        !bullets?.length &&
        !children?.length
      )
        continue
    }

    out.push({
      heading,
      body,
      ...(headingLevel ? { headingLevel } : {}),
      ...(bullets?.length ? { bullets } : {}),
      ...(children?.length ? { children } : {}),
    })
  }
  return out
}

export function parseBulletItems(text: string): BulletItem[] | null {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const bulletLines = lines.filter(
    (l) => /^[•\-–—]\s*/.test(l) || /^\d+[\.)]\s+/.test(l)
  )
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

export function extractAmount(title: string): string | undefined {
  const m = title.match(/(\d[\d\s.,]*\s*€)/)
  return m ? m[1].replace(/\s+/g, " ") : undefined
}

/**
 * Titre d'affaire = résultat chiffré (montant €, gain multiplié, réévaluation).
 * Les mots seuls « indemnisation » / « soutien » sont trop courants dans les
 * titres d'étapes : les inclure faisait basculer des sections d'accompagnement
 * en grille d'affaires, et du contenu se perdait.
 */
export function looksLikeCaseTitle(title: string): boolean {
  return /\d[\d\s.,]*\s*€|multipliée\s+par\s+\d|réévaluation/i.test(title)
}

export function groupCases(blocks: Block[]): CaseItem[] | null {
  const headedBlocks = blocks.filter((b) => b.heading)
  const headed = headedBlocks.filter((b) => looksLikeCaseTitle(b.heading))
  if (headed.length < 2) return null
  // Section mixte (titres d'étapes + titres d'affaires) → ce n'est pas une
  // grille d'affaires : laisser tous les titres se rendre.
  if (headed.length !== headedBlocks.length) return null

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

function isBulletLine(line: string): boolean {
  return /^[•\-–—*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^[•\-–—*]\s+/, "").replace(/^\d+[\.)]\s+/, "").trim()
}

/** Découpe un corps en paragraphes, listes et sous-titres Markdown. */
export function splitBodyChunks(text: string): BodyChunk[] {
  const lines = text.replace(/​/g, "").split(/\n/)
  const chunks: BodyChunk[] = []
  let paraBuf: string[] = []
  let listBuf: string[] = []

  function flushPara() {
    const t = paraBuf.join("\n").trim()
    paraBuf = []
    if (!t || isJunk(t)) return
    const mdHeading = t.match(/^#{2,4}\s+(.+)$/)
    if (mdHeading) {
      chunks.push({ type: "h4", value: mdHeading[1].trim() })
      return
    }
    chunks.push({ type: "p", value: t })
  }

  function flushList() {
    if (!listBuf.length) return
    chunks.push({ type: "ul", value: [...listBuf] })
    listBuf = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      flushPara()
      continue
    }
    if (isBulletLine(line)) {
      flushPara()
      listBuf.push(stripBulletPrefix(line))
      continue
    }
    flushList()
    paraBuf.push(line)
  }
  flushList()
  flushPara()
  return chunks
}

/** Structure explicite (H3/H4, puces, sous-blocs) → rendu fidèle, sans heuristique. */
export function wantsFidelityLayout(blocks: Block[]): boolean {
  return blocks.some(
    (b) =>
      b.headingLevel === 4 ||
      Boolean(b.bullets?.length) ||
      Boolean(b.children?.length)
  )
}

/**
 * Ce qu'est le corps d'une section — la décision, séparée de son rendu.
 *
 * Elle vivait à l'intérieur d'une fonction qui retournait du JSX : impossible
 * de savoir quelle disposition une section obtenait sans monter un composant.
 */
export type SectionLayout =
  | { kind: "fidelity" }
  | { kind: "steps"; items: BulletItem[] }
  | { kind: "definitions-only"; items: BulletItem[] }
  | { kind: "cases"; cases: CaseItem[] }
  | { kind: "headed-steps" }
  | { kind: "definitions"; block: Block; items: BulletItem[]; intro: string[]; others: Block[] }
  | { kind: "prose" }

export function chooseSectionLayout(blocks: Block[]): SectionLayout {
  if (wantsFidelityLayout(blocks)) return { kind: "fidelity" }

  if (blocks.length === 1 && !blocks[0].heading) {
    const bullets = parseBulletItems(blocks[0].body)
    if (bullets && bullets.length >= 3) {
      const titled = bullets.filter((b) => b.title).length
      if (titled >= Math.ceil(bullets.length * 0.5)) return { kind: "steps", items: bullets }
      if (titled >= 4) return { kind: "definitions-only", items: bullets }
      return { kind: "steps", items: bullets }
    }
  }

  const cases = groupCases(blocks)
  if (cases) return { kind: "cases", cases }

  const headed = blocks.filter((b) => b.heading)
  if (headed.length >= 2 && headed.length >= blocks.length * 0.4)
    return { kind: "headed-steps" }

  const defBlock = blocks.find((b) => {
    if (!b.body) return false
    const bullets = parseBulletItems(b.body)
    return !!bullets && bullets.filter((x) => x.title).length >= 4
  })
  if (defBlock) {
    const items = parseBulletItems(defBlock.body)!
    const intro = defBlock.body
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(
        (l) => l && !/^[•\-–—]/.test(l) && !/^\d+[\.)]\s+/.test(l) && !isJunk(l)
      )
    return {
      kind: "definitions",
      block: defBlock,
      items: items.filter((x) => x.title),
      intro,
      others: blocks.filter((b) => b !== defBlock),
    }
  }

  return { kind: "prose" }
}

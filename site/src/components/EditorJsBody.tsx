import type { ReactNode } from "react"
import type { EditorJsBlock, EditorJsDocument } from "@/lib/editorjs"
import { stripHtml } from "@/lib/editorjs"

/**
 * Rendu public RSC d’un document Editor.js.
 * Pas de HTML brut : inline limité → JSX (liens http/https/mailto uniquement).
 */
export function EditorJsBody({ doc }: { doc: EditorJsDocument }) {
  const blocks = doc.blocks || []
  if (!blocks.length) return null

  return (
    <>
      {blocks.map((block, i) => (
        <EditorJsBlockView key={block.id || `b-${i}`} block={block} />
      ))}
    </>
  )
}

function EditorJsBlockView({ block }: { block: EditorJsBlock }) {
  const data = block.data || {}

  switch (block.type) {
    case "header": {
      const level = Math.min(4, Math.max(2, Number(data.level) || 2))
      const text = String(data.text || "")
      if (level === 3) return <h3><InlineText html={text} /></h3>
      if (level === 4) return <h4><InlineText html={text} /></h4>
      return <h2><InlineText html={text} /></h2>
    }
    case "paragraph": {
      const text = String(data.text || "")
      if (!stripHtml(text).trim()) return null
      return <p><InlineText html={text} /></p>
    }
    case "quote": {
      const text = String(data.text || "")
      const caption = String(data.caption || "").trim()
      if (!stripHtml(text).trim()) return null
      return (
        <blockquote>
          <p><InlineText html={text} /></p>
          {caption ? <cite className="mt-2 block text-sm not-italic opacity-70">{caption}</cite> : null}
        </blockquote>
      )
    }
    case "delimiter":
      return <hr className="mx-auto my-10 w-56 border-line" />
    case "list": {
      const style = String(data.style || "unordered")
      const items = listItemTexts(data.items)
      if (!items.length) return null
      const Tag = style === "ordered" ? "ol" : "ul"
      return (
        <Tag>
          {items.map((item, i) => (
            <li key={i}><InlineText html={item} /></li>
          ))}
        </Tag>
      )
    }
    case "linkTool": {
      const meta = (data.meta || {}) as { title?: string; description?: string; site_name?: string }
      const link = String(data.link || "")
      const href = safeHref(link)
      if (!href) return null
      return (
        <p>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {meta.title || href}
          </a>
          {meta.description ? (
            <span className="mt-1 block text-sm text-ink/70">{meta.description}</span>
          ) : null}
        </p>
      )
    }
    default:
      return null
  }
}

function listItemTexts(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "content" in item)
        return String((item as { content: unknown }).content || "")
      return ""
    })
    .filter((t) => stripHtml(t).trim())
}

function safeHref(raw: string): string | null {
  const href = raw.trim()
  if (!href) return null
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href
  if (href.startsWith("/") && !href.startsWith("//")) return href
  return null
}

/** Parse minimal : texte + <b>/<i>/<em>/<strong>/<a>/<br>/<code>/<u>/<mark>. */
function InlineText({ html }: { html: string }) {
  const nodes = parseInline(html)
  return <>{nodes}</>
}

type InlineNode = string | { type: string; href?: string; children: InlineNode[] }

function parseInline(html: string): ReactNode[] {
  const tokens = tokenize(html)
  return tokens.map((node, i) => renderNode(node, i))
}

function renderNode(node: InlineNode, key: number): ReactNode {
  if (typeof node === "string") return <span key={key}>{node}</span>
  const kids = node.children.map((c, i) => renderNode(c, i))
  switch (node.type) {
    case "b":
    case "strong":
      return <strong key={key}>{kids}</strong>
    case "i":
    case "em":
      return <em key={key}>{kids}</em>
    case "u":
      return <u key={key}>{kids}</u>
    case "mark":
      return <mark key={key}>{kids}</mark>
    case "code":
      return <code key={key}>{kids}</code>
    case "br":
      return <br key={key} />
    case "a": {
      const href = node.href ? safeHref(node.href) : null
      if (!href) return <span key={key}>{kids}</span>
      const external = /^https?:\/\//i.test(href)
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {kids}
        </a>
      )
    }
    default:
      return <span key={key}>{kids}</span>
  }
}

const TAG_RE = /<\/?(b|strong|i|em|u|mark|code|br|a)(\s+[^>]*)?\/?>/gi

function tokenize(html: string): InlineNode[] {
  const root: InlineNode[] = []
  const stack: { type: string; href?: string; children: InlineNode[] }[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(TAG_RE)
  TAG_RE.lastIndex = 0

  function current(): InlineNode[] {
    return stack.length ? stack[stack.length - 1].children : root
  }

  function pushText(text: string) {
    if (!text) return
    current().push(decodeEntities(text))
  }

  while ((match = re.exec(html))) {
    pushText(html.slice(last, match.index))
    last = re.lastIndex
    const full = match[0]
    const tag = match[1].toLowerCase()
    const isClose = full.startsWith("</")
    const isSelf = tag === "br" || full.endsWith("/>")

    if (isSelf && tag === "br") {
      current().push({ type: "br", children: [] })
      continue
    }
    if (isClose) {
      if (stack.length && stack[stack.length - 1].type === tag) {
        const node = stack.pop()!
        current().push(node)
      }
      continue
    }
    if (tag === "a") {
      const hrefMatch = full.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
      const href = hrefMatch ? (hrefMatch[2] || hrefMatch[3] || hrefMatch[4] || "") : ""
      stack.push({ type: "a", href, children: [] })
      continue
    }
    stack.push({ type: tag, children: [] })
  }
  pushText(html.slice(last))
  // Orphelins non fermés → texte plat
  while (stack.length) {
    const node = stack.pop()!
    current().push(node)
  }
  return root
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

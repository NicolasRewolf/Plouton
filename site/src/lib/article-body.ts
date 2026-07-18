/**
 * Corps article admin (TipTap) : HTML dans `bodyHtml`.
 * `body` reste `string[]` (extrait / signature / fallback).
 * Legacy Editor.js (blocs) encore reconnu en lecture seule.
 */

export interface EditorJsBlock {
  id?: string
  type: string
  data: Record<string, unknown>
}

export interface EditorJsDocument {
  time?: number
  blocks: EditorJsBlock[]
  version?: string
}

export type ArticleBody = string[] | EditorJsDocument

export function isEditorJsDoc(value: unknown): value is EditorJsDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Array.isArray((value as EditorJsDocument).blocks)
}

export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** HTML TipTap → paragraphes texte (signature / excerpt). */
export function htmlToParagraphs(html: string): string[] {
  const text = stripHtml(html || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return text.length ? text : ["Contenu à rédiger."]
}

/** string[] / legacy → HTML pour TipTap. */
export function articleToEditorHtml(article: {
  bodyHtml?: string
  body?: ArticleBody
}): string {
  if (article.bodyHtml?.trim()) return article.bodyHtml
  if (isEditorJsDoc(article.body)) return editorJsToHtml(article.body)
  if (Array.isArray(article.body) && article.body.length)
    return paragraphsToHtml(article.body)
  return "<p></p>"
}

export function paragraphsToHtml(paragraphs: string[]): string {
  const parts: string[] = []
  for (const raw of paragraphs) {
    const p = raw.trim()
    if (!p) continue
    if (p === "---") {
      parts.push("<hr>")
      continue
    }
    if (p.startsWith("## ")) {
      parts.push(`<h2>${escapeHtml(p.slice(3).trim())}</h2>`)
      continue
    }
    if (p.startsWith("# ")) {
      parts.push(`<h2>${escapeHtml(p.slice(2).trim())}</h2>`)
      continue
    }
    if (p.startsWith("> ")) {
      parts.push(`<blockquote><p>${escapeHtml(p.slice(2).trim())}</p></blockquote>`)
      continue
    }
    parts.push(`<p>${escapeHtml(p)}</p>`)
  }
  return parts.length ? parts.join("") : "<p></p>"
}

export function editorJsToHtml(doc: EditorJsDocument): string {
  const parts: string[] = []
  for (const block of doc.blocks || []) {
    const data = block.data || {}
    switch (block.type) {
      case "header": {
        const level = Math.min(4, Math.max(2, Number(data.level) || 2))
        const text = String(data.text || "")
        parts.push(`<h${level}>${text}</h${level}>`)
        break
      }
      case "paragraph":
        parts.push(`<p>${String(data.text || "")}</p>`)
        break
      case "quote":
        parts.push(
          `<blockquote><p>${String(data.text || "")}</p></blockquote>`
        )
        break
      case "delimiter":
        parts.push("<hr>")
        break
      case "list": {
        const style = data.style === "ordered" ? "ol" : "ul"
        const items = normalizeListItems(data.items)
        if (items.length)
          parts.push(
            `<${style}>${items.map((i) => `<li>${i}</li>`).join("")}</${style}>`
          )
        break
      }
      default:
        break
    }
  }
  return parts.length ? parts.join("") : "<p></p>"
}

export function hasUsableHtml(html: string | undefined | null): boolean {
  if (!html?.trim()) return false
  const text = stripHtml(html).trim()
  return Boolean(text && text !== "Contenu à rédiger.")
}

export function hasUsableArticleBody(body: ArticleBody | undefined | null): boolean {
  if (isEditorJsDoc(body)) {
    return (body.blocks || []).some((b) => {
      if (b.type === "delimiter") return true
      if (b.type === "list")
        return normalizeListItems(b.data?.items).some((t) => stripHtml(t).trim())
      return Boolean(stripHtml(String(b.data?.text || "")).trim())
    })
  }
  if (!Array.isArray(body)) return false
  return body.some((p) => p.trim() && p !== "Contenu à rédiger.")
}

function normalizeListItems(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    if (typeof item === "string") return item
    if (item && typeof item === "object" && "content" in item)
      return String((item as { content: unknown }).content || "")
    return ""
  })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

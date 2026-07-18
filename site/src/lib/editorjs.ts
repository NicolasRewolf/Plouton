/**
 * Document Editor.js stocké dans `posts.body` (jsonb).
 * Compat : les articles seed restent en `string[]` jusqu’à édition admin.
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
  const doc = value as EditorJsDocument
  return Array.isArray(doc.blocks)
}

export function emptyEditorJsDoc(placeholder = ""): EditorJsDocument {
  return {
    time: Date.now(),
    version: "2.31.0",
    blocks: [
      {
        type: "paragraph",
        data: { text: placeholder },
      },
    ],
  }
}

/** Convertit l’ancien corps admin `string[]` en blocs Editor.js. */
export function paragraphsToEditorJs(paragraphs: string[]): EditorJsDocument {
  const blocks: EditorJsBlock[] = []
  for (const raw of paragraphs) {
    const p = raw.trim()
    if (!p) continue
    if (p === "---") {
      blocks.push({ type: "delimiter", data: {} })
      continue
    }
    if (p.startsWith("## ")) {
      blocks.push({
        type: "header",
        data: { text: p.slice(3).trim(), level: 2 },
      })
      continue
    }
    if (p.startsWith("# ")) {
      blocks.push({
        type: "header",
        data: { text: p.slice(2).trim(), level: 2 },
      })
      continue
    }
    if (p.startsWith("> ")) {
      blocks.push({
        type: "quote",
        data: { text: p.slice(2).trim(), caption: "" },
      })
      continue
    }
    blocks.push({ type: "paragraph", data: { text: p } })
  }
  if (!blocks.length) return emptyEditorJsDoc()
  return { time: Date.now(), version: "2.31.0", blocks }
}

/** Extrait du texte plat (excerpt / signature). */
export function editorJsToPlainParagraphs(doc: EditorJsDocument): string[] {
  const out: string[] = []
  for (const block of doc.blocks || []) {
    const data = block.data || {}
    switch (block.type) {
      case "header":
      case "paragraph":
      case "quote": {
        const text = stripHtml(String(data.text || "")).trim()
        if (text) out.push(text)
        break
      }
      case "list": {
        const items = normalizeListItems(data.items)
        for (const item of items) {
          const text = stripHtml(item).trim()
          if (text) out.push(text)
        }
        break
      }
      case "delimiter":
        out.push("---")
        break
      default:
        break
    }
  }
  return out
}

export function articleBodyToEditorJs(body: ArticleBody | undefined | null): EditorJsDocument {
  if (isEditorJsDoc(body)) {
    if (body.blocks?.length) return body
    return emptyEditorJsDoc()
  }
  if (Array.isArray(body) && body.length) return paragraphsToEditorJs(body)
  return emptyEditorJsDoc()
}

export function hasUsableArticleBody(body: ArticleBody | undefined | null): boolean {
  if (isEditorJsDoc(body)) {
    return (body.blocks || []).some((b) => {
      if (b.type === "delimiter") return true
      if (b.type === "list") return normalizeListItems(b.data?.items).some((t) => stripHtml(t).trim())
      const text = stripHtml(String(b.data?.text || "")).trim()
      return Boolean(text && text !== "Contenu à rédiger.")
    })
  }
  if (!Array.isArray(body)) return false
  return body.some((p) => p.trim() && p !== "Contenu à rédiger.")
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

function normalizeListItems(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    if (typeof item === "string") return item
    if (item && typeof item === "object" && "content" in item)
      return String((item as { content: unknown }).content || "")
    return ""
  })
}

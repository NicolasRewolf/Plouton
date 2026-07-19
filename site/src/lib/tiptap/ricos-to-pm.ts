/**
 * Convertisseur Ricos → document ProseMirror TipTap (direct, jamais via HTML).
 * P1-C — sous-ensemble aligné sur buildEditorExtensions.
 */
import type { RicosDoc, RicosNode } from "@/lib/ricos/types"

export type PMMark = { type: string; attrs?: Record<string, unknown> }
export type PMNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: PMNode[]
  marks?: PMMark[]
  text?: string
}

function wixMediaUrl(id?: string, url?: string): string {
  if (url) return url
  if (!id) return ""
  if (id.startsWith("http")) return id
  return `https://static.wixstatic.com/media/${id}`
}

function textMarks(decorations: unknown[] | undefined): PMMark[] {
  const marks: PMMark[] = []
  for (const d of decorations || []) {
    const dec = d as { type?: string; linkData?: { link?: { url?: string } } }
    if (dec.type === "BOLD") marks.push({ type: "bold" })
    if (dec.type === "ITALIC") marks.push({ type: "italic" })
    if (dec.type === "UNDERLINE") marks.push({ type: "underline" })
    if (dec.type === "LINK" && dec.linkData?.link?.url) {
      marks.push({
        type: "link",
        attrs: { href: dec.linkData.link.url },
      })
    }
  }
  return marks
}

function inlineFromNodes(nodes: RicosNode[] | undefined): PMNode[] {
  const out: PMNode[] = []
  for (const n of nodes || []) {
    if (n.type === "TEXT" && n.textData) {
      const text = n.textData.text || ""
      if (!text) continue
      const marks = textMarks(n.textData.decorations as unknown[])
      out.push(marks.length ? { type: "text", text, marks } : { type: "text", text })
    }
  }
  if (!out.length) out.push({ type: "text", text: "" })
  return out
}

function paragraph(nodes?: RicosNode[]): PMNode {
  return { type: "paragraph", content: inlineFromNodes(nodes) }
}

function convertNode(node: RicosNode): PMNode | PMNode[] | null {
  switch (node.type) {
    case "PARAGRAPH":
      return paragraph(node.nodes)
    case "HEADING": {
      const level = Math.min(4, Math.max(2, node.headingData?.level || 2))
      return {
        type: "heading",
        attrs: { level },
        content: inlineFromNodes(node.nodes),
      }
    }
    case "BLOCKQUOTE":
      return {
        type: "blockquote",
        content: (node.nodes || []).flatMap((c) => {
          const r = convertNode(c)
          if (!r) return []
          return Array.isArray(r) ? r : [r]
        }),
      }
    case "BULLETED_LIST":
    case "ORDERED_LIST": {
      const listType =
        node.type === "ORDERED_LIST" ? "orderedList" : "bulletList"
      const items = (node.nodes || [])
        .filter((c) => c.type === "LIST_ITEM")
        .map((item) => ({
          type: "listItem",
          content: (item.nodes || []).flatMap((c) => {
            const r = convertNode(c)
            if (!r) return [paragraph()]
            return Array.isArray(r) ? r : [r]
          }),
        }))
      return { type: listType, content: items }
    }
    case "DIVIDER":
      return { type: "horizontalRule" }
    case "IMAGE": {
      const src = wixMediaUrl(
        node.imageData?.image?.src?.id,
        node.imageData?.image?.src?.url
      )
      if (!src) return null
      return {
        type: "image",
        attrs: {
          src,
          alt: node.imageData?.altText || node.imageData?.caption || "",
        },
      }
    }
    case "VIDEO": {
      const src =
        node.videoData?.video?.src?.url ||
        wixMediaUrl(node.videoData?.video?.src?.id)
      if (!src) return null
      // YouTube embed si possible
      if (/youtu/.test(src)) {
        return { type: "youtube", attrs: { src } }
      }
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: src,
            marks: [{ type: "link", attrs: { href: src } }],
          },
        ],
      }
    }
    case "GALLERY": {
      const images = (node.galleryData?.items || [])
        .map((it) => {
          const src =
            it.image?.media?.src?.url ||
            wixMediaUrl(
              (it.image?.media?.src as { id?: string } | undefined)?.id
            )
          return src ? { src, alt: "" } : null
        })
        .filter(Boolean) as { src: string; alt: string }[]
      if (!images.length) return null
      return { type: "gallery", attrs: { images } }
    }
    case "BUTTON": {
      const href = node.buttonData?.link?.url || "#"
      const label = node.buttonData?.text || "En savoir plus"
      return {
        type: "ctaButton",
        attrs: { href, label },
      }
    }
    case "COLLAPSIBLE_LIST": {
      return (node.nodes || [])
        .filter((c) => c.type === "COLLAPSIBLE_ITEM")
        .map((item) => {
          const title = item.nodes?.find((n) => n.type === "COLLAPSIBLE_ITEM_TITLE")
          const body = item.nodes?.find((n) => n.type === "COLLAPSIBLE_ITEM_BODY")
          const summaryContent = inlineFromNodes(title?.nodes || [])
          const bodyContent = (body?.nodes || []).flatMap((c) => {
            const r = convertNode(c)
            if (!r) return []
            return Array.isArray(r) ? r : [r]
          })
          return {
            type: "details",
            attrs: { open: false },
            content: [
              {
                type: "detailsSummary",
                content: summaryContent.length
                  ? summaryContent
                  : [{ type: "text", text: "Détail" }],
              },
              {
                type: "detailsContent",
                content: bodyContent.length ? bodyContent : [paragraph()],
              },
            ],
          } as PMNode
        })
    }
    case "TABLE": {
      const rows = (node.nodes || [])
        .filter((r) => r.type === "TABLE_ROW")
        .map((row) => {
          const cells = (row.nodes || [])
            .filter((c) => c.type === "TABLE_CELL")
            .map((cell) => {
              const content = (cell.nodes || []).flatMap((c) => {
                const r = convertNode(c)
                if (!r) return []
                return Array.isArray(r) ? r : [r]
              })
              return {
                type: "tableCell",
                content: content.length ? content : [paragraph()],
              }
            })
          return { type: "tableRow", content: cells }
        })
      if (!rows.length) return null
      return { type: "table", content: rows }
    }
    case "HTML": {
      const html = node.htmlData?.html || ""
      if (!html.trim()) return null
      return {
        type: "paragraph",
        content: [{ type: "text", text: html.replace(/<[^>]+>/g, " ").trim() }],
      }
    }
    case "LINK_PREVIEW": {
      const href = node.linkPreviewData?.link?.url
      const title = node.linkPreviewData?.title || href || "Lien"
      if (!href) return null
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: title,
            marks: [{ type: "link", attrs: { href } }],
          },
        ],
      }
    }
    default:
      // Conteneurs génériques : aplatir les enfants
      if (node.nodes?.length) {
        return node.nodes.flatMap((c) => {
          const r = convertNode(c)
          if (!r) return []
          return Array.isArray(r) ? r : [r]
        })
      }
      return null
  }
}

/** Ricos → doc TipTap `{ type: 'doc', content: [...] }`. */
export function ricosToProseMirror(doc: RicosDoc): PMNode {
  const content: PMNode[] = []
  for (const n of doc.nodes || []) {
    const r = convertNode(n)
    if (!r) continue
    if (Array.isArray(r)) content.push(...r)
    else content.push(r)
  }
  if (!content.length) content.push(paragraph())
  return { type: "doc", content }
}

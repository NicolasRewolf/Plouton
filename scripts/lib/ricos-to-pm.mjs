/**
 * Convertisseur Ricos → document ProseMirror TipTap (direct, jamais via HTML).
 * Miroir de site/src/lib/tiptap/ricos-to-pm.ts — brief #18 §3.
 */

/** Types Ricos connus du convertisseur (inventaire 422). */
const KNOWN_TYPES = new Set([
  "PARAGRAPH",
  "HEADING",
  "BLOCKQUOTE",
  "BULLETED_LIST",
  "ORDERED_LIST",
  "LIST_ITEM",
  "DIVIDER",
  "IMAGE",
  "VIDEO",
  "GALLERY",
  "BUTTON",
  "COLLAPSIBLE_LIST",
  "COLLAPSIBLE_ITEM",
  "COLLAPSIBLE_ITEM_TITLE",
  "COLLAPSIBLE_ITEM_BODY",
  "TABLE",
  "TABLE_ROW",
  "TABLE_CELL",
  "HTML",
  "LINK_PREVIEW",
  "CODE_BLOCK",
  "CAPTION",
  "FILE",
  "LAYOUT",
  "LAYOUT_CELL",
  "TEXT",
])

function wixMediaUrl(id, url) {
  if (url) return url
  if (!id) return ""
  if (String(id).startsWith("http")) return id
  return `https://static.wixstatic.com/media/${id}`
}

function textMarks(decorations) {
  const marks = []
  for (const d of decorations || []) {
    if (d.type === "BOLD") marks.push({ type: "bold" })
    if (d.type === "ITALIC") marks.push({ type: "italic" })
    if (d.type === "UNDERLINE") marks.push({ type: "underline" })
    if (d.type === "SUPERSCRIPT") marks.push({ type: "superscript" })
    // COLOR / FONT_SIZE : non portés (brief §3)
    if (d.type === "LINK" && d.linkData?.link?.url) {
      marks.push({
        type: "link",
        attrs: { href: d.linkData.link.url },
      })
    }
  }
  return marks
}

/** Échappe une URL destinée à un attribut HTML (embeds synthétisés). */
function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function inlineFromNodes(nodes) {
  const out = []
  for (const n of nodes || []) {
    if (n.type === "TEXT" && n.textData) {
      const text = n.textData.text || ""
      if (!text) continue // ProseMirror interdit les text nodes vides
      const marks = textMarks(n.textData.decorations)
      out.push(marks.length ? { type: "text", text, marks } : { type: "text", text })
      continue
    }
    // Ricos enveloppe souvent l'inline dans un bloc (HEADING/PARAGRAPH) — c'est
    // le cas des titres d'accordéon (COLLAPSIBLE_ITEM_TITLE > HEADING > TEXT).
    // Sans cette descente, les 104 titres retombaient sur le libellé générique.
    if (n.nodes?.length) out.push(...inlineFromNodes(n.nodes))
  }
  return out
}

function paragraph(nodes) {
  const content = inlineFromNodes(nodes)
  return content.length
    ? { type: "paragraph", content }
    : { type: "paragraph" }
}

function convertChildren(nodes) {
  return (nodes || []).flatMap((c) => {
    const r = convertNode(c)
    if (!r) return []
    return Array.isArray(r) ? r : [r]
  })
}

function convertNode(node) {
  if (node.type && !KNOWN_TYPES.has(node.type)) {
    throw new Error(`Ricos type inconnu (non inventorié) : ${node.type}`)
  }

  switch (node.type) {
    case "TEXT":
      return null
    case "PARAGRAPH":
      return paragraph(node.nodes)
    case "HEADING": {
      const raw = node.headingData?.level || 2
      const level = Math.min(4, Math.max(2, raw === 1 ? 2 : raw))
      const content = inlineFromNodes(node.nodes)
      return content.length
        ? { type: "heading", attrs: { level }, content }
        : { type: "heading", attrs: { level } }
    }
    case "BLOCKQUOTE":
      return {
        type: "blockquote",
        content: convertChildren(node.nodes).length
          ? convertChildren(node.nodes)
          : [paragraph()],
      }
    case "CODE_BLOCK": {
      const content = inlineFromNodes(node.nodes)
      return content.length
        ? { type: "codeBlock", content }
        : { type: "codeBlock" }
    }
    case "CAPTION": {
      const content = inlineFromNodes(node.nodes).map((n) =>
        n.type === "text"
          ? {
              ...n,
              marks: [...(n.marks || []), { type: "italic" }],
            }
          : n
      )
      return content.length
        ? { type: "paragraph", content }
        : { type: "paragraph" }
    }
    case "BULLETED_LIST":
    case "ORDERED_LIST": {
      const listType =
        node.type === "ORDERED_LIST" ? "orderedList" : "bulletList"
      const items = (node.nodes || [])
        .filter((c) => c.type === "LIST_ITEM")
        .map((item) => {
          const content = convertChildren(item.nodes)
          return {
            type: "listItem",
            content: content.length ? content : [paragraph()],
          }
        })
      return { type: listType, content: items }
    }
    case "LIST_ITEM":
      return {
        type: "listItem",
        content: convertChildren(node.nodes).length
          ? convertChildren(node.nodes)
          : [paragraph()],
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
          title: node.imageData?.caption || null,
        },
      }
    }
    case "VIDEO": {
      const src =
        node.videoData?.video?.src?.url ||
        wixMediaUrl(node.videoData?.video?.src?.id)
      if (!src) return null
      if (/youtu\.be|youtube\.com/i.test(src)) {
        return { type: "youtube", attrs: { src } }
      }
      return {
        type: "videoEmbed",
        attrs: { src, title: "Vidéo" },
      }
    }
    case "GALLERY": {
      const images = (node.galleryData?.items || [])
        .map((it) => {
          const src =
            it.image?.media?.src?.url ||
            wixMediaUrl(it.image?.media?.src?.id)
          return src ? { src, alt: "" } : null
        })
        .filter(Boolean)
      if (!images.length) return null
      return { type: "gallery", attrs: { images } }
    }
    case "BUTTON": {
      return {
        type: "ctaButton",
        attrs: {
          href: node.buttonData?.link?.url || "#",
          label: node.buttonData?.text || "En savoir plus",
        },
      }
    }
    case "COLLAPSIBLE_LIST": {
      return (node.nodes || [])
        .filter((c) => c.type === "COLLAPSIBLE_ITEM")
        .map((item) => {
          const title = item.nodes?.find(
            (n) => n.type === "COLLAPSIBLE_ITEM_TITLE"
          )
          const body = item.nodes?.find(
            (n) => n.type === "COLLAPSIBLE_ITEM_BODY"
          )
          const summaryContent = inlineFromNodes(title?.nodes || [])
          const bodyContent = convertChildren(body?.nodes)
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
          }
        })
    }
    case "COLLAPSIBLE_ITEM":
    case "COLLAPSIBLE_ITEM_TITLE":
    case "COLLAPSIBLE_ITEM_BODY":
      return convertChildren(node.nodes)
    case "TABLE": {
      const rows = (node.nodes || [])
        .filter((r) => r.type === "TABLE_ROW")
        .map((row) => {
          const cells = (row.nodes || [])
            .filter((c) => c.type === "TABLE_CELL")
            .map((cell) => {
              const content = convertChildren(cell.nodes)
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
    case "TABLE_ROW":
    case "TABLE_CELL":
      return convertChildren(node.nodes)
    case "HTML": {
      const html = node.htmlData?.html || ""
      if (html.trim()) return { type: "htmlEmbed", attrs: { html } }
      // Wix stocke aussi les embeds distants sous `url` seul (sans `html`) —
      // ex. un replay TF1. Sans ce cas, l'embed disparaissait silencieusement.
      // On synthétise l'iframe pour rester sur la même forme que les 5 autres
      // embeds (le nœud ne déclare que l'attribut `html`).
      const url = node.htmlData?.url || ""
      if (!url.trim()) return null
      const height = Number(node.htmlData?.containerData?.height?.custom) || 550
      return {
        type: "htmlEmbed",
        attrs: {
          html: `<iframe src="${escapeAttr(url)}" width="100%" height="${height}" frameborder="0" allowfullscreen loading="lazy"></iframe>`,
        },
      }
    }
    case "LINK_PREVIEW": {
      const href = node.linkPreviewData?.link?.url
      if (!href) return null
      return {
        type: "linkPreview",
        attrs: {
          href,
          title: node.linkPreviewData?.title || href,
          description: node.linkPreviewData?.description || "",
          thumbnailUrl: node.linkPreviewData?.thumbnailUrl || null,
        },
      }
    }
    case "FILE": {
      const name = node.fileData?.name || "Fichier"
      const id = node.fileData?.src?.id
      const href = id ? wixMediaUrl(id) : "#"
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: name,
            marks: [{ type: "link", attrs: { href } }],
          },
        ],
      }
    }
    case "LAYOUT":
    case "LAYOUT_CELL":
      return convertChildren(node.nodes)
    default:
      if (node.nodes?.length) return convertChildren(node.nodes)
      return null
  }
}

/** Ricos → doc TipTap `{ type: 'doc', content: [...] }`. */
export function ricosToProseMirror(doc) {
  const content = []
  for (const n of doc.nodes || []) {
    const r = convertNode(n)
    if (!r) continue
    if (Array.isArray(r)) content.push(...r)
    else content.push(r)
  }
  if (!content.length) content.push(paragraph())
  return { type: "doc", content }
}

/** Texte brut normalisé (pour diff CI) — ignore htmlEmbed (HTML brut non éditorial). */
export function pmPlainText(doc) {
  const parts = []
  function walk(n) {
    if (n.type === "htmlEmbed") return
    if (n.text) parts.push(n.text)
    for (const c of n.content || []) walk(c)
  }
  walk(doc)
  return parts
    .join(" ")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function ricosPlainText(doc) {
  const parts = []
  function walk(nodes) {
    for (const n of nodes || []) {
      if (n.type === "HTML") continue
      if (n.type === "TEXT" && n.textData?.text) parts.push(n.textData.text)
      if (n.nodes) walk(n.nodes)
    }
  }
  walk(doc.nodes)
  return parts
    .join(" ")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function countPmTypes(doc) {
  const acc = {}
  function walk(n) {
    acc[n.type] = (acc[n.type] || 0) + 1
    for (const c of n.content || []) walk(c)
  }
  walk(doc)
  return acc
}

export function countRicosTypes(doc) {
  const acc = {}
  function walk(nodes) {
    for (const n of nodes || []) {
      acc[n.type] = (acc[n.type] || 0) + 1
      if (n.nodes) walk(n.nodes)
    }
  }
  walk(doc.nodes)
  return acc
}

export function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

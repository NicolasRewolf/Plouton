#!/usr/bin/env node
/**
 * P1-C — Convertit contenu/ricos/*.json → contenu/body-docs/{slug}.json
 * Convertisseur Ricos→PM (miroir de site/src/lib/tiptap/ricos-to-pm.ts).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const RICOS = path.join(ROOT, "contenu", "ricos")
const OUT = path.join(ROOT, "contenu", "body-docs")

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
    if (d.type === "LINK" && d.linkData?.link?.url) {
      marks.push({ type: "link", attrs: { href: d.linkData.link.url } })
    }
  }
  return marks
}

function inlineFromNodes(nodes) {
  const out = []
  for (const n of nodes || []) {
    if (n.type === "TEXT" && n.textData) {
      const text = n.textData.text || ""
      if (!text) continue
      const marks = textMarks(n.textData.decorations)
      out.push(marks.length ? { type: "text", text, marks } : { type: "text", text })
    }
  }
  if (!out.length) out.push({ type: "text", text: "" })
  return out
}

function paragraph(nodes) {
  return { type: "paragraph", content: inlineFromNodes(nodes) }
}

function convertNode(node) {
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
      const listType = node.type === "ORDERED_LIST" ? "orderedList" : "bulletList"
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
      if (/youtu/.test(src)) return { type: "youtube", attrs: { src } }
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
    case "COLLAPSIBLE_LIST":
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
          }
        })
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
        content: [
          {
            type: "text",
            text: html.replace(/<[^>]+>/g, " ").trim(),
          },
        ],
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

function ricosToDoc(ricos) {
  const content = []
  for (const n of ricos.nodes || []) {
    const r = convertNode(n)
    if (!r) continue
    if (Array.isArray(r)) content.push(...r)
    else content.push(r)
  }
  if (!content.length) content.push(paragraph())
  return { type: "doc", content }
}

function countNodes(node, acc = {}) {
  if (!node) return acc
  const t = node.type || "?"
  acc[t] = (acc[t] || 0) + 1
  for (const c of node.content || []) countNodes(c, acc)
  return acc
}

const args = process.argv.slice(2)
const dry = args.includes("--dry-run")
const write = args.includes("--write-files")
const limIdx = args.indexOf("--limit")
const limit = limIdx >= 0 ? Number(args[limIdx + 1] || 0) : 0

let files = fs.readdirSync(RICOS).filter((f) => f.endsWith(".json")).sort()
if (limit > 0) files = files.slice(0, limit)

if (!dry && write) fs.mkdirSync(OUT, { recursive: true })

let ok = 0
const totals = {}
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(RICOS, file), "utf8"))
  const slug = raw.slug || file.replace(/\.json$/, "")
  const doc = ricosToDoc(raw.ricos || raw)
  const counts = countNodes(doc)
  for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v
  ok++
  if (write && !dry) {
    fs.writeFileSync(
      path.join(OUT, `${slug}.json`),
      JSON.stringify(doc, null, 0) + "\n"
    )
  }
}

console.log(`convertis : ${ok}/${files.length}`)
console.log("types PM :", Object.keys(totals).sort().join(", "))
if (write && !dry) console.log(`écrits → ${path.relative(ROOT, OUT)}/`)

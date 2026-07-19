#!/usr/bin/env node
/**
 * Régénère contenu/body-html/{slug}.html depuis body-docs/*.json.
 * Mapper PM→HTML maison (pas TipTap) — évite les soucis d'install en scripts.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DOCS = path.join(ROOT, "contenu", "body-docs")
const OUT = path.join(ROOT, "contenu", "body-html")

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;")
}

function applyMarks(text, marks) {
  let html = escapeHtml(text)
  const list = marks || []
  // Liens en dernier (enveloppe externe) — ordre stable
  const ordered = [...list].sort((a, b) => {
    const rank = (t) =>
      t === "link" ? 5 : t === "bold" ? 1 : t === "italic" ? 2 : t === "underline" ? 3 : t === "superscript" ? 4 : 0
    return rank(a.type) - rank(b.type)
  })
  for (const m of ordered) {
    if (m.type === "bold") html = `<strong>${html}</strong>`
    else if (m.type === "italic") html = `<em>${html}</em>`
    else if (m.type === "underline") html = `<u>${html}</u>`
    else if (m.type === "superscript") html = `<sup>${html}</sup>`
    else if (m.type === "link" && m.attrs?.href)
      html = `<a href="${escapeAttr(m.attrs.href)}">${html}</a>`
  }
  return html
}

function renderInline(nodes) {
  return (nodes || [])
    .map((n) => {
      if (n.type === "text") return applyMarks(n.text || "", n.marks)
      return ""
    })
    .join("")
}

function renderChildren(nodes) {
  return (nodes || []).map(renderNode).join("")
}

function youtubeEmbedSrc(src) {
  if (!src) return ""
  const m =
    src.match(/youtu\.be\/([A-Za-z0-9_-]+)/) ||
    src.match(/[?&]v=([A-Za-z0-9_-]+)/) ||
    src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return src
}

function renderNode(node) {
  if (!node || !node.type) return ""

  switch (node.type) {
    case "doc":
      return renderChildren(node.content)
    case "paragraph": {
      const inner = renderInline(node.content)
      return `<p>${inner}</p>`
    }
    case "heading": {
      const level = Math.min(4, Math.max(2, node.attrs?.level || 2))
      return `<h${level}>${renderInline(node.content)}</h${level}>`
    }
    case "bulletList":
      return `<ul>${renderChildren(node.content)}</ul>`
    case "orderedList":
      return `<ol>${renderChildren(node.content)}</ol>`
    case "listItem":
      return `<li>${renderChildren(node.content)}</li>`
    case "blockquote":
      return `<blockquote>${renderChildren(node.content)}</blockquote>`
    case "horizontalRule":
      return `<hr>`
    case "codeBlock":
      return `<pre><code>${renderInline(node.content)}</code></pre>`
    case "table":
      return `<table>${renderChildren(node.content)}</table>`
    case "tableRow":
      return `<tr>${renderChildren(node.content)}</tr>`
    case "tableCell":
    case "tableHeader":
      return `<td>${renderChildren(node.content)}</td>`
    case "image": {
      const src = node.attrs?.src || ""
      if (!src) return ""
      const alt = escapeAttr(node.attrs?.alt || "")
      const title = node.attrs?.title
        ? ` title="${escapeAttr(node.attrs.title)}"`
        : ""
      return `<img src="${escapeAttr(src)}" alt="${alt}"${title}>`
    }
    case "details": {
      const open = node.attrs?.open ? " open" : ""
      return `<details${open}>${renderChildren(node.content)}</details>`
    }
    case "detailsSummary":
      return `<summary>${renderInline(node.content)}</summary>`
    case "detailsContent":
      return renderChildren(node.content)
    case "youtube": {
      const src = youtubeEmbedSrc(node.attrs?.src)
      if (!src) return ""
      return `<iframe src="${escapeAttr(src)}" title="YouTube" loading="lazy" allowfullscreen frameborder="0"></iframe>`
    }
    case "videoEmbed": {
      const src = node.attrs?.src || ""
      if (!src) return ""
      const title = escapeAttr(node.attrs?.title || "Vidéo")
      return `<iframe src="${escapeAttr(src)}" title="${title}" loading="lazy" allowfullscreen frameborder="0"></iframe>`
    }
    case "gallery": {
      const images = node.attrs?.images || []
      const imgs = images
        .map(
          (im) =>
            `<img src="${escapeAttr(im.src || "")}" alt="${escapeAttr(im.alt || "")}">`
        )
        .join("")
      return `<div data-type="gallery" class="prose-gallery">${imgs}</div>`
    }
    case "ctaButton": {
      const href = escapeAttr(node.attrs?.href || "#")
      const label = escapeHtml(node.attrs?.label || "En savoir plus")
      return `<a data-type="cta-button" class="btn-pill btn-pill-primary" href="${href}">${label}</a>`
    }
    case "linkPreview": {
      const href = escapeAttr(node.attrs?.href || "#")
      const title = escapeHtml(node.attrs?.title || node.attrs?.href || "Lien")
      const desc = node.attrs?.description
        ? `<span>${escapeHtml(node.attrs.description)}</span>`
        : ""
      return `<a data-type="link-preview" class="prose-link-preview" href="${href}"><strong>${title}</strong>${desc}</a>`
    }
    case "htmlEmbed": {
      const raw = node.attrs?.html || ""
      return `<div data-type="html-embed" class="prose-html-embed" data-html="${escapeAttr(raw)}"></div>`
    }
    case "text":
      return applyMarks(node.text || "", node.marks)
    default:
      if (node.content) return renderChildren(node.content)
      return ""
  }
}

export function pmToHtml(doc) {
  return renderNode(doc)
}

// CLI
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  fs.mkdirSync(OUT, { recursive: true })
  const files = fs
    .readdirSync(DOCS)
    .filter((f) => f.endsWith(".json"))
    .sort()
  let written = 0
  for (const file of files) {
    const slug = file.replace(/\.json$/, "")
    const doc = JSON.parse(fs.readFileSync(path.join(DOCS, file), "utf8"))
    const html = pmToHtml(doc)
    fs.writeFileSync(path.join(OUT, `${slug}.html`), html + "\n")
    written++
  }
  console.log(`écrits : ${written} → ${path.relative(ROOT, OUT)}/`)
}

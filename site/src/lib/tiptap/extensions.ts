/**
 * Schéma TipTap partagé (admin + rendu HTML cache) — P1-B.
 * Couvre le sous-ensemble Ricos critique : table, details, H4, image+alt, vidéo.
 */
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Superscript from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details"
import { Node, Mark, mergeAttributes } from "@tiptap/core"

/** Figure avec alt (image block + légende optionnelle). */
export const FigureImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: { default: "" },
      title: { default: null },
    }
  },
})

/** Callout / encadré (blockquote enrichi). */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: 'aside[data-type="callout"]' }, { tag: "aside.callout" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        class: "prose-callout",
      }),
      0,
    ]
  },
})

/** Bouton CTA (lien stylé). */
export const CtaButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      href: { default: "#" },
      label: { default: "En savoir plus" },
      target: { default: "_self" },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-type="cta-button"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { label, ...attrs } = HTMLAttributes
    return [
      "a",
      mergeAttributes(attrs, {
        "data-type": "cta-button",
        class: "btn-pill btn-pill-primary",
      }),
      label || "En savoir plus",
    ]
  },
})

/** Galerie simple (liste d’URLs). */
export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      images: {
        default: [] as { src: string; alt?: string }[],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-images") || "[]")
          } catch {
            return []
          }
        },
        renderHTML: (attrs) => ({
          "data-images": JSON.stringify(attrs.images || []),
        }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "gallery",
        class: "prose-gallery",
      }),
    ]
  },
})

/** Vidéo non-YouTube (Vimeo, Facebook, Wix…) — iframe. */
export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Vidéo" },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"] iframe' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-type": "video-embed",
        class: "prose-video-embed",
      },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          src: HTMLAttributes.src,
          title: HTMLAttributes.title || "Vidéo",
          loading: "lazy",
          allowfullscreen: "true",
          frameborder: "0",
        }),
      ],
    ]
  },
})

/** Carte de lien enrichie (Ricos LINK_PREVIEW). */
export const LinkPreview = Node.create({
  name: "linkPreview",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      href: { default: null },
      title: { default: "" },
      description: { default: "" },
      thumbnailUrl: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-type="link-preview"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { title, description, ...attrs } = HTMLAttributes
    return [
      "a",
      mergeAttributes(attrs, {
        "data-type": "link-preview",
        class: "prose-link-preview",
        href: HTMLAttributes.href,
      }),
      ["strong", {}, title || HTMLAttributes.href || "Lien"],
      description ? ["span", {}, description] : "",
    ]
  },
})

/**
 * HTML embarqué (Ricos HTML) — ex. calculateur Glasgow.
 * Conservé tel quel ; ne jamais aplatir en texte (perte / fuite de styles).
 */
export const HtmlEmbed = Node.create({
  name: "htmlEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-html") || el.innerHTML,
        renderHTML: (attrs) => ({ "data-html": attrs.html || "" }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="html-embed"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "html-embed", class: "prose-html-embed" },
        { "data-html": HTMLAttributes.html || "" }
      ),
    ]
  },
})

/** Lien enrichi (mark avec title). */
export const EnrichedLink = Mark.create({
  name: "enrichedLink",
  inclusive: false,
  addAttributes() {
    return {
      href: { default: null },
      title: { default: null },
      target: { default: null },
      rel: { default: "noopener noreferrer" },
    }
  },
  parseHTML() {
    return [{ tag: "a[data-enriched]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, { "data-enriched": "true" }),
      0,
    ]
  },
})

/**
 * Schéma partagé par l'éditeur admin et le rendu serveur (`body-doc.ts`) —
 * c'est ce qui garantit qu'un article s'affiche comme il a été écrit.
 * Le Placeholder est ajouté par `AdminEditor` seul (il n'a pas de sens au
 * rendu) : ne pas réintroduire d'options ici sans les utiliser.
 */
export function buildEditorExtensions() {
  const list = [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      codeBlock: {},
    }),
    Underline,
    Superscript,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "admin-editor-link" },
    }),
    EnrichedLink,
    FigureImage.configure({
      HTMLAttributes: { class: "admin-editor-image" },
      allowBase64: false,
    }),
    Youtube.configure({
      modestBranding: true,
      HTMLAttributes: { class: "admin-editor-youtube" },
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Details.configure({ persist: true, openClassName: "is-open" }),
    DetailsSummary,
    DetailsContent,
    Callout,
    CtaButton,
    Gallery,
    VideoEmbed,
    LinkPreview,
    HtmlEmbed,
  ]
  return list
}

/** Allowlist tags HTML dérivés du schéma (sanitize serveur). */
export const ALLOWED_HTML_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "sup",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "hr",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "details",
  "summary",
  "aside",
  "div",
  "iframe",
  "span",
])

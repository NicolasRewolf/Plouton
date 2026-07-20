/**
 * body_doc (ProseMirror) → HTML cache via @tiptap/static-renderer.
 */
import { renderToHTMLString } from "@tiptap/static-renderer"
import { buildEditorExtensions } from "@/lib/tiptap/extensions"
import type { PMNode } from "@/lib/tiptap/pm-types"

const HTML_ENTITIES: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&amp;": "&",
}

/**
 * Les embeds (`htmlEmbed`) transportent leur markup dans `data-html` — c'est
 * ce que le schéma TipTap sait relire. Mais un attribut ne s'affiche pas : sans
 * cette étape, les 6 replays TV du corpus étaient stockés et invisibles.
 * On réinjecte donc le markup DANS le div au moment du rendu public.
 * (Le corps entier est déjà servi via dangerouslySetInnerHTML : cela n'ajoute
 * aucune surface d'attaque — le contenu vient du CMS, pas du visiteur.)
 */
function inlineHtmlEmbeds(html: string): string {
  // L'ordre des attributs dépend de mergeAttributes : on matche la balise
  // entière puis on en extrait data-html, plutôt que de supposer un ordre.
  return html.replace(
    /<div([^>]*data-type="html-embed"[^>]*)><\/div>/g,
    (match, attrs: string) => {
      const found = /data-html="([^"]*)"/.exec(attrs)
      if (!found?.[1]) return match
      const decoded = found[1].replace(
        /&lt;|&gt;|&quot;|&#39;|&amp;/g,
        (e) => HTML_ENTITIES[e] ?? e
      )
      return `<div${attrs}>${decoded}</div>`
    }
  )
}

export function bodyDocToHtml(doc: PMNode | Record<string, unknown> | null | undefined): string {
  if (!doc || typeof doc !== "object") return "<p></p>"
  try {
    const html = renderToHTMLString({
      content: doc as Parameters<typeof renderToHTMLString>[0]["content"],
      extensions: buildEditorExtensions(),
    })
    return inlineHtmlEmbeds(html)
  } catch (e) {
    console.warn("[body-doc] render failed", e)
    return "<p></p>"
  }
}

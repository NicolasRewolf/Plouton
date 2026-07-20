/**
 * body_doc (ProseMirror) → HTML cache via @tiptap/static-renderer.
 */
import { renderToHTMLString } from "@tiptap/static-renderer"
import { buildEditorExtensions } from "@/lib/tiptap/extensions"
import type { PMNode } from "@/lib/tiptap/pm-types"

export function bodyDocToHtml(doc: PMNode | Record<string, unknown> | null | undefined): string {
  if (!doc || typeof doc !== "object") return "<p></p>"
  try {
    return renderToHTMLString({
      content: doc as Parameters<typeof renderToHTMLString>[0]["content"],
      extensions: buildEditorExtensions(),
    })
  } catch (e) {
    console.warn("[body-doc] render failed", e)
    return "<p></p>"
  }
}

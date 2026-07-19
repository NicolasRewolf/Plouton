/**
 * Sanitize HTML admin → allowlist tags du schéma TipTap (P1-B).
 * Pas de DOMPurify : strip tags hors liste, conserve le texte.
 */
import { ALLOWED_HTML_TAGS } from "@/lib/tiptap/extensions"

export function sanitizeEditorHtml(html: string): string {
  if (!html) return "<p></p>"
  // Retire scripts / event handlers
  let out = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
  // Strip tags hors allowlist (garde le contenu)
  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string) => {
    const t = tag.toLowerCase()
    if (ALLOWED_HTML_TAGS.has(t)) return full
    return ""
  })
  return out.trim() || "<p></p>"
}

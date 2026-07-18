"use client"

import { useEffect, useId, useRef } from "react"
import type {
  default as EditorJS,
  OutputData,
} from "@editorjs/editorjs"
import type { EditorJsDocument } from "@/lib/editorjs"

interface AdminEditorProps {
  initialData: EditorJsDocument
  onChange: (doc: EditorJsDocument) => void
  placeholder?: string
}

/**
 * Éditeur Editor.js — client only (pas de SSR).
 * Monté via dynamic(..., { ssr: false }) depuis les pages admin.
 */
export function AdminEditor({
  initialData,
  onChange,
  placeholder = "Écrivez votre article…",
}: AdminEditorProps) {
  const holderId = useId().replace(/:/g, "")
  const editorRef = useRef<EditorJS | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let destroyed = false

    async function mount() {
      const [
        { default: EditorJSClass },
        { default: Header },
        { default: List },
        { default: Quote },
        { default: Delimiter },
        { default: Paragraph },
        { default: LinkTool },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
        import("@editorjs/paragraph"),
        import("@editorjs/link"),
      ])

      if (destroyed) return

      const editor = new EditorJSClass({
        holder: `admin-editor-${holderId}`,
        placeholder,
        data: initialData as OutputData,
        minHeight: 280,
        tools: {
          header: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Header as any,
            inlineToolbar: true,
            config: { levels: [2, 3, 4], defaultLevel: 2 },
          },
          paragraph: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Paragraph as any,
            inlineToolbar: true,
          },
          list: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: List as any,
            inlineToolbar: true,
            config: { defaultStyle: "unordered" },
          },
          quote: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Quote as any,
            inlineToolbar: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delimiter: Delimiter as any,
          linkTool: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: LinkTool as any,
            config: {
              // Pas d’endpoint meta : on stocke juste l’URL saisie.
              endpoint: "/api/admin/link-meta",
            },
          },
        },
        onChange: async (api) => {
          const saved = await api.saver.save()
          onChangeRef.current(saved as EditorJsDocument)
        },
      })

      await editor.isReady
      if (destroyed) {
        editor.destroy()
        return
      }
      editorRef.current = editor
    }

    void mount()

    return () => {
      destroyed = true
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
    // initialData : montage unique (évite destroy/recreate à chaque frappe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holderId, placeholder])

  return (
    <div className="admin-editor overflow-hidden rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
      <div className="border-b border-[rgba(23,71,94,0.08)] bg-fog/60 px-4 py-2.5">
        <p className="text-[12px] font-medium tracking-wide text-navy/60 uppercase">
          Corps de l&apos;article
        </p>
      </div>
      <div
        id={`admin-editor-${holderId}`}
        className="admin-editor-holder min-h-[320px] px-3 py-4 sm:px-5"
      />
    </div>
  )
}

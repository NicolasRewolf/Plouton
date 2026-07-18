"use client"

import { useEffect, useRef } from "react"
import type { default as EditorJS, OutputData } from "@editorjs/editorjs"
import type { EditorJsDocument } from "@/lib/editorjs"

interface AdminEditorProps {
  initialData: EditorJsDocument
  onChange: (doc: EditorJsDocument) => void
  placeholder?: string
}

/**
 * Éditeur Editor.js — client only.
 * Aligné sur https://editorjs.io/getting-started/
 * Important : pas d’overflow:hidden sur le conteneur (sinon + / toolbar coupés).
 */
export function AdminEditor({
  initialData,
  onChange,
  placeholder = "Écrivez votre article… Cliquez sur + pour ajouter un titre, une liste…",
}: AdminEditorProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorJS | null>(null)
  const onChangeRef = useRef(onChange)
  const initialRef = useRef(initialData)
  onChangeRef.current = onChange

  useEffect(() => {
    const holder = holderRef.current
    if (!holder || editorRef.current) return

    let cancelled = false

    async function mount() {
      const [
        { default: EditorJSClass },
        { default: Header },
        { default: List },
        { default: Quote },
        { default: Delimiter },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
      ])

      if (cancelled || !holderRef.current) return

      const editor = new EditorJSClass({
        holder: holderRef.current,
        placeholder,
        autofocus: true,
        data: initialRef.current as OutputData,
        minHeight: 320,
        // Guides : tools = class ou { class, config… }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: {
          header: {
            class: Header as any,
            inlineToolbar: ["link", "bold", "italic"],
            config: { levels: [2, 3, 4], defaultLevel: 2 },
            toolbox: {
              title: "Titre",
            },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
            config: { defaultStyle: "unordered" },
            toolbox: {
              title: "Liste",
            },
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            toolbox: {
              title: "Citation",
            },
          },
          delimiter: {
            class: Delimiter as any,
            toolbox: {
              title: "Séparateur",
            },
          },
        },
        i18n: {
          messages: {
            ui: {
              blockTunes: {
                toggler: {
                  "Click to tune": "Réglages",
                  "or drag to move": "ou glisser",
                },
              },
              inlineToolbar: {
                converter: {
                  "Convert to": "Convertir en",
                },
              },
              toolbar: {
                toolbox: {
                  Add: "Ajouter",
                },
              },
            },
            toolNames: {
              Text: "Texte",
              Heading: "Titre",
              List: "Liste",
              Quote: "Citation",
              Delimiter: "Séparateur",
              Link: "Lien",
              Bold: "Gras",
              Italic: "Italique",
            },
          },
        },
        onChange: async (api) => {
          try {
            const saved = await api.saver.save()
            onChangeRef.current(saved as EditorJsDocument)
          } catch {
            // ignore pendant destroy
          }
        },
      })

      try {
        await editor.isReady
      } catch {
        return
      }

      if (cancelled) {
        editor.destroy()
        return
      }
      editorRef.current = editor
    }

    void mount()

    return () => {
      cancelled = true
      if (editorRef.current) {
        try {
          editorRef.current.destroy()
        } catch {
          // noop
        }
        editorRef.current = null
      }
    }
  }, [placeholder])

  return (
    <div className="admin-editor rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
      <div className="border-b border-[rgba(23,71,94,0.08)] bg-fog/60 px-4 py-2.5">
        <p className="text-[12px] font-medium tracking-wide text-navy/60 uppercase">
          Corps de l&apos;article
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          Survolez un bloc → bouton <strong className="font-semibold text-navy">+</strong> pour
          titre, liste, citation…
        </p>
      </div>
      <div
        ref={holderRef}
        className="admin-editor-holder relative min-h-[360px] px-2 py-5 sm:px-4"
      />
    </div>
  )
}

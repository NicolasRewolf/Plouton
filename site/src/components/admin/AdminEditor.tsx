"use client"

import { useEffect, type ReactNode } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import { buildEditorExtensions } from "@/lib/tiptap/extensions"

interface AdminEditorProps {
  /** HTML TipTap */
  initialHtml: string
  onChange: (html: string, json?: Record<string, unknown>) => void
  placeholder?: string
}

/**
 * Éditeur TipTap enrichi (P1-B) — table, details, H4, superscript, image+alt.
 */
export function AdminEditor({
  initialHtml,
  onChange,
  placeholder = "Écrivez votre article…",
}: AdminEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...buildEditorExtensions(),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "admin-tiptap-content prose-plouton focus:outline-none min-h-[360px] px-4 py-5 sm:px-6",
      },
      handlePaste: (_view, event) => {
        // DIY léger : laisse TipTap parser ; Word → après schéma (P1-G paste Start)
        const html = event.clipboardData?.getData("text/html")
        if (html && /mso-|WordDocument|urn:schemas-microsoft/.test(html)) {
          // TipTap parse HTML ; on n’empêche pas — schéma table/details absorbe mieux
          return false
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML(), ed.getJSON() as Record<string, unknown>)
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (initialHtml && initialHtml !== current && !editor.isFocused)
      editor.commands.setContent(initialHtml, { emitUpdate: false })
  }, [editor, initialHtml])

  useEffect(() => {
    if (!editor) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!editor.isEmpty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [editor])

  if (!editor) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white text-[13px] text-muted">
        Chargement de l&apos;éditeur…
      </div>
    )
  }

  return (
    <div className="admin-editor rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white shadow-[0_1px_2px_rgba(23,71,94,0.04)]">
      <div className="sticky top-0 z-30 rounded-t-[14px] border-b border-[rgba(23,71,94,0.1)] bg-white/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 sm:px-3">
          <SelectBlock editor={editor} />
          <Sep />
          <ToolBtn
            label="Gras"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </ToolBtn>
          <ToolBtn
            label="Italique"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolBtn>
          <ToolBtn
            label="Souligné"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolBtn>
          <ToolBtn
            label="Exposant"
            active={editor.isActive("superscript")}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            x²
          </ToolBtn>
          <Sep />
          <ToolBtn
            label="Liste à puces"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            •••
          </ToolBtn>
          <ToolBtn
            label="Liste numérotée"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </ToolBtn>
          <ToolBtn
            label="Citation"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            ”
          </ToolBtn>
          <ToolBtn
            label="Accordéon"
            active={editor.isActive("details")}
            onClick={() => editor.chain().focus().setDetails().run()}
          >
            ▾
          </ToolBtn>
          <ToolBtn
            label="Tableau"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            ⊞
          </ToolBtn>
          <ToolBtn
            label="Séparateur"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            ―
          </ToolBtn>
          <Sep />
          <ToolBtn
            label="Lien"
            active={editor.isActive("link")}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined
              const url = window.prompt("URL du lien", prev || "https://")
              if (url === null) return
              if (!url.trim()) {
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
                return
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url.trim() })
                .run()
            }}
          >
            Lien
          </ToolBtn>
          <ToolBtn
            label="Coller sans mise en forme"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText()
                if (!text.trim()) return
                editor.commands.insertContent(text.replace(/\n+/g, "</p><p>"))
              } catch {
                window.alert(
                  "Impossible de lire le presse-papiers. Utilisez Cmd+Shift+V."
                )
              }
            }}
          >
            Txt
          </ToolBtn>
          <ToolBtn
            label="Image"
            active={editor.isActive("image")}
            onClick={() => void insertImage(editor)}
          >
            Img
          </ToolBtn>
          <ToolBtn
            label="YouTube"
            active={editor.isActive("youtube")}
            onClick={() => {
              const url = window.prompt(
                "URL YouTube",
                "https://www.youtube.com/watch?v="
              )
              if (!url?.trim()) return
              editor.commands.setYoutubeVideo({ src: url.trim() })
            }}
          >
            YT
          </ToolBtn>
          <Sep />
          <ToolBtn
            label="Aligner à gauche"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            ⬅
          </ToolBtn>
          <ToolBtn
            label="Centrer"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            ↔
          </ToolBtn>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

async function insertImage(editor: Editor) {
  const choice = window.prompt(
    "Image : collez une URL, ou laissez vide pour choisir un fichier",
    "https://"
  )
  if (choice === null) return
  let src = ""
  if (choice.trim() && choice.trim() !== "https://") {
    src = choice.trim()
  } else {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/png,image/webp,image/gif"
    const file = await new Promise<File | null>((resolve) => {
      input.onchange = () => resolve(input.files?.[0] || null)
      input.click()
    })
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", "editor")
    try {
      const res = await fetch("/api/posts/media", { method: "POST", body: fd })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        window.alert(data.error || "Upload impossible")
        return
      }
      src = data.url
    } catch {
      window.alert("Upload impossible")
      return
    }
  }
  const alt = window.prompt("Texte alternatif (obligatoire pour l’accessibilité)", "") || ""
  if (!alt.trim()) {
    window.alert("L’alt image est obligatoire.")
    return
  }
  editor.chain().focus().setImage({ src, alt: alt.trim() }).run()
}

function SelectBlock({ editor }: { editor: Editor }) {
  const value = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : editor.isActive("heading", { level: 4 })
        ? "h4"
        : "p"
  return (
    <select
      className="admin-editor-select"
      value={value}
      onChange={(e) => {
        const v = e.target.value
        if (v === "p") editor.chain().focus().setParagraph().run()
        else if (v === "h2")
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        else if (v === "h3")
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        else if (v === "h4")
          editor.chain().focus().toggleHeading({ level: 4 }).run()
      }}
      aria-label="Style de paragraphe"
    >
      <option value="p">Paragraphe</option>
      <option value="h2">Titre 2</option>
      <option value="h3">Titre 3</option>
      <option value="h4">Titre 4</option>
    </select>
  )
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-[rgba(23,71,94,0.12)]" aria-hidden />
}

function ToolBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`admin-editor-btn ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  )
}

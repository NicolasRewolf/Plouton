"use client"

import { useEffect, type ReactNode } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"

interface AdminEditorProps {
  /** HTML TipTap */
  initialHtml: string
  onChange: (html: string) => void
  placeholder?: string
}

/**
 * Éditeur TipTap — barre de formatage sticky (style Wix).
 */
export function AdminEditor({
  initialHtml,
  onChange,
  placeholder = "Écrivez votre article…",
}: AdminEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "admin-editor-link" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class: "admin-tiptap-content prose-plouton focus:outline-none min-h-[360px] px-4 py-5 sm:px-6",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (initialHtml && initialHtml !== current && !editor.isFocused)
      editor.commands.setContent(initialHtml, { emitUpdate: false })
  }, [editor, initialHtml])

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

function SelectBlock({
  editor,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
}) {
  const value = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : "p"

  return (
    <select
      aria-label="Style de paragraphe"
      className="mr-1 h-8 rounded-lg border-0 bg-fog/80 px-2 text-[12px] font-medium text-navy outline-none hover:bg-fog"
      value={value}
      onChange={(e) => {
        const v = e.target.value
        const chain = editor.chain().focus()
        if (v === "h2") chain.toggleHeading({ level: 2 }).run()
        else if (v === "h3") chain.toggleHeading({ level: 3 }).run()
        else chain.setParagraph().run()
      }}
    >
      <option value="p">Paragraphe</option>
      <option value="h2">Titre</option>
      <option value="h3">Sous-titre</option>
    </select>
  )
}

function ToolBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active || false}
      onClick={onClick}
      className={
        active
          ? "inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-navy px-2 text-[13px] font-medium text-white"
          : "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium text-navy/80 hover:bg-fog"
      }
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-[rgba(23,71,94,0.12)]" />
}

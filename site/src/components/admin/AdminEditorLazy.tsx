"use client"

import dynamic from "next/dynamic"
import type { EditorJsDocument } from "@/lib/editorjs"

const AdminEditorInner = dynamic(
  () => import("./AdminEditor").then((m) => m.AdminEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white text-[13px] text-muted">
        Chargement de l&apos;éditeur…
      </div>
    ),
  }
)

interface AdminEditorLazyProps {
  initialData: EditorJsDocument
  onChange: (doc: EditorJsDocument) => void
  placeholder?: string
}

/** Wrapper dynamic SSR=false — à importer depuis les pages admin. */
export function AdminEditorLazy(props: AdminEditorLazyProps) {
  return <AdminEditorInner {...props} />
}

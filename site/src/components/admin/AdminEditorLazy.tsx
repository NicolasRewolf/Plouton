"use client"

import dynamic from "next/dynamic"

const AdminEditorInner = dynamic(
  () => import("./AdminEditor").then((m) => m.AdminEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center rounded-[14px] border border-[rgba(23,71,94,0.12)] bg-white text-[13px] text-muted">
        Chargement de l&apos;éditeur…
      </div>
    ),
  }
)

interface AdminEditorLazyProps {
  initialHtml: string
  onChange: (html: string, json?: Record<string, unknown>) => void
  placeholder?: string
}

/** Wrapper dynamic SSR=false — TipTap client only. */
export function AdminEditorLazy(props: AdminEditorLazyProps) {
  return <AdminEditorInner {...props} />
}

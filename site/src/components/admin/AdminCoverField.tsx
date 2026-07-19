"use client"

import { useRef, useState } from "react"

interface AdminCoverFieldProps {
  value: string
  onChange: (url: string) => void
}

/**
 * Couverture article : URL manuelle + upload bucket `medias` (C5.1).
 * Si Storage indisponible → message clair, l’URL reste utilisable.
 */
export function AdminCoverField({ value, onChange }: AdminCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [hint, setHint] = useState("")

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setHint("")
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", "covers")
    try {
      const res = await fetch("/api/posts/media", { method: "POST", body: fd })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setHint(data.error || "Upload impossible — collez une URL.")
        return
      }
      onChange(data.url)
      setHint("Image envoyée.")
    } catch {
      setHint("Connexion interrompue — collez une URL.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="grid gap-1 text-[13px] text-navy">
        Image de couverture (URL)
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="admin-input font-mono text-[12px]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          className="admin-btn admin-btn-secondary text-[12px]"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Envoi…" : "Uploader"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {value ? (
          <button
            type="button"
            className="text-[12px] text-muted hover:text-navy"
            onClick={() => onChange("")}
          >
            Retirer
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-1 max-h-28 w-full rounded-lg object-cover"
        />
      ) : null}
    </div>
  )
}

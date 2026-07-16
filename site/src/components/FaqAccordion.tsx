"use client"

import { useMemo, useState } from "react"
import type { FaqItem } from "@/lib/content"

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const sous = useMemo(() => {
    const s = new Set(items.map((i) => i.sousExpertise).filter(Boolean) as string[])
    return Array.from(s)
  }, [items])
  const [filter, setFilter] = useState<string>("Tous")
  const visible = filter === "Tous" ? items : items.filter((i) => i.sousExpertise === filter)

  return (
    <div>
      {sous.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFilter("Tous")}
            className={`px-3 py-1 text-sm border ${filter === "Tous" ? "bg-petrol text-white border-petrol" : "border-line"}`}
          >
            Tous
          </button>
          {sous.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-sm border ${filter === s ? "bg-petrol text-white border-petrol" : "border-line"}`}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <div className="divide-y divide-line border border-line">
        {visible.map((item) => (
          <details key={item.question} className="group p-4 open:bg-sand/40">
            <summary className="cursor-pointer font-medium text-petrol list-none flex justify-between gap-4">
              {item.question}
              <span className="text-accent group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-sm text-graytext leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

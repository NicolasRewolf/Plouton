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
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("Tous")}
            className={`border px-3 py-1 text-sm ${filter === "Tous" ? "border-navy bg-navy text-white" : "border-line text-navy"}`}
          >
            Tous
          </button>
          {sous.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`border px-3 py-1 text-sm ${filter === s ? "border-navy bg-navy text-white" : "border-line text-navy"}`}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <div className="divide-y divide-line border border-line">
        {visible.map((item) => (
          <details key={item.question} className="group p-4 open:bg-fog/50">
            <summary className="flex cursor-pointer list-none justify-between gap-4 font-medium text-navy">
              {item.question}
              <span className="text-accent transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-navy">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

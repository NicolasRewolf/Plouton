import { getSite } from "@/lib/content"

/** Barre CTA sticky bas de page — reprise du live (articles + pages expertise) */
export function StickyCta() {
  const site = getSite()
  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="w-full max-w-[470px] rounded-md bg-[#ececec]/95 px-5 py-3 text-center shadow-lg backdrop-blur-sm">
        <p className="text-[13px] text-ink">
          Une question sur vos droits ?{" "}
          <span className="font-semibold">Contactez</span> le{" "}
          <span className="font-semibold">cabinet Plouton</span>.
        </p>
        <div className="mt-2.5 flex items-center justify-center gap-3">
          <a
            href={site.phone.href}
            className="inline-flex items-center gap-2 rounded-sm bg-navy px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-navy-soft"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 fill-none stroke-accent stroke-2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            Nous appeler
          </a>
          <a
            href="/honoraires-rendez-vous"
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 fill-none stroke-white stroke-2">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Je prends rendez-vous&nbsp;!
          </a>
        </div>
      </div>
    </div>
  )
}

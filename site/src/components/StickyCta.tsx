import { SiteCta } from "@/components/SiteCta"
import { getSite } from "@/lib/content"

/** Barre CTA sticky bas de page — boutons via SiteCta (btn-pill). */
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
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5">
          <SiteCta href={site.phone.href} variant="secondary">
            Nous appeler
          </SiteCta>
          <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow>
            Je prends rendez-vous&nbsp;!
          </SiteCta>
        </div>
      </div>
    </div>
  )
}

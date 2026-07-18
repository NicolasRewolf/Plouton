import Image from "next/image"
import { SiteCta } from "@/components/SiteCta"
import { getSite } from "@/lib/content"

/** Pré-footer conversion : photo équipe + note Google + CTA rendez-vous */
export function TeamCtaBanner() {
  const site = getSite()
  return (
    <section className="relative isolate overflow-hidden bg-fog">
      <Image
        src="/brand/equipe-groupe.jpg"
        alt="L'équipe du Cabinet Plouton"
        width={1600}
        height={2058}
        sizes="100vw"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_22%]"
      />
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24 lg:px-8">
        <div className="max-w-xs">
          <p className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
              {/* G de Google */}
              <svg aria-hidden viewBox="0 0 24 24" className="size-6">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
              </svg>
            </span>
            <a
              href={site.googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ink underline underline-offset-2 hover:text-accent"
            >
              {site.rating.value.replace(".", ",")}/5 étoiles ({site.rating.count}+ avis) sur Google
            </a>
          </p>
          <p className="mt-6 text-lg leading-snug text-ink">
            Vous êtes concerné par cette situation&nbsp;?
            <br />
            Nos avocats vous écoutent et vous conseillent.
          </p>
          <SiteCta href="/honoraires-rendez-vous" variant="primary" arrow className="mt-6">
            Prendre rendez-vous
          </SiteCta>
        </div>
      </div>
    </section>
  )
}

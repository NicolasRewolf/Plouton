import type { Metadata } from "next"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { TeamPreviewSwitcher } from "@/components/TeamPreviewSwitcher"
import { getEquipe, getSite, readPageJson } from "@/lib/content"

export const metadata: Metadata = {
  title: "Preview layouts équipe",
  robots: { index: false, follow: false },
}

/** Page temporaire pour arbitrer 3 layouts équipe — ne pas indexer. */
export default function NotreCabinetPreviewPage() {
  const page = readPageJson<{ title: string; intro: string }>("notre-cabinet")
  const equipe = getEquipe()
  const site = getSite()

  const introTitle = page?.title?.includes("—")
    ? page.title.split("—")[0].trim()
    : page?.title || "Notre équipe"

  const introText =
    page?.intro
      ?.replace(/\u200b/g, "")
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)[0] ||
    `Avocats et assistante du cabinet — ${site.name}.`

  return (
    <>
      <Header variant="site" />
      <TeamPreviewSwitcher
        equipe={equipe}
        introTitle={introTitle}
        introText={introText}
      />
      <Footer />
    </>
  )
}

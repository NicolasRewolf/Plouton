import type { Metadata } from "next"
import { ExpertiseRoutePage, expertiseMetadata } from "@/lib/expertise-route"
import { getExpertise, listExpertises } from "@/lib/content"

export function generateStaticParams() {
  return listExpertises()
    .filter((e) => e.pole === "defense-penale")
    .map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return expertiseMetadata(slug)
}

export default async function DefensePenaleSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!getExpertise(slug) || getExpertise(slug)?.pole !== "defense-penale") {
    const { notFound } = await import("next/navigation")
    notFound()
  }
  return <ExpertiseRoutePage slug={slug} />
}

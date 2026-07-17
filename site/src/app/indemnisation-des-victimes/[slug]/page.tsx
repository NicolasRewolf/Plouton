import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExpertiseRoutePage, expertiseMetadata } from "@/lib/expertise-route"
import { getExpertise, listExpertises } from "@/lib/content"

export function generateStaticParams() {
  return listExpertises()
    .filter((e) => e.pole === "indemnisation-des-victimes")
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

export default async function IndemnisationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const expertise = getExpertise(slug)
  if (!expertise || expertise.pole !== "indemnisation-des-victimes") notFound()
  return <ExpertiseRoutePage slug={slug} />
}

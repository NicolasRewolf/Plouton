import type { Metadata } from "next"
import { PoleHubRoutePage, poleHubMetadata } from "@/lib/pole-hub-route"

const POLE = "indemnisation-des-victimes"

export function generateMetadata(): Metadata {
  return poleHubMetadata(POLE)
}

export default function IndemnisationHubPage() {
  return <PoleHubRoutePage poleSlug={POLE} />
}

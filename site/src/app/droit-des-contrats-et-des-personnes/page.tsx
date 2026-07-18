import type { Metadata } from "next"
import { PoleHubRoutePage, poleHubMetadata } from "@/lib/pole-hub-route"

const POLE = "droit-des-contrats-et-des-personnes"

export function generateMetadata(): Metadata {
  return poleHubMetadata(POLE)
}

export default function ContratsHubPage() {
  return <PoleHubRoutePage poleSlug={POLE} />
}

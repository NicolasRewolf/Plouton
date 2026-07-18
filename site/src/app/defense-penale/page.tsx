import type { Metadata } from "next"
import { PoleHubRoutePage, poleHubMetadata } from "@/lib/pole-hub-route"

const POLE = "defense-penale"

export function generateMetadata(): Metadata {
  return poleHubMetadata(POLE)
}

export default function DefensePenaleHubPage() {
  return <PoleHubRoutePage poleSlug={POLE} />
}

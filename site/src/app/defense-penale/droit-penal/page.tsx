import type { Metadata } from "next"
import { ExpertiseRoutePage, expertiseMetadata } from "@/lib/expertise-route"

export function generateMetadata(): Metadata {
  return expertiseMetadata("droit-penal")
}

export default function DroitPenalPage() {
  return <ExpertiseRoutePage slug="droit-penal" />
}

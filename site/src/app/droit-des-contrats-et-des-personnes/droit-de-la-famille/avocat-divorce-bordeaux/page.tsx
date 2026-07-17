import type { Metadata } from "next"
import { ExpertiseRoutePage, expertiseMetadata } from "@/lib/expertise-route"

export function generateMetadata(): Metadata {
  return expertiseMetadata("divorce")
}

export default function DivorcePage() {
  return <ExpertiseRoutePage slug="divorce" />
}

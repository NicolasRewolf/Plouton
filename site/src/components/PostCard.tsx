import { AffaireCard, type AffaireCardItem } from "@/components/AffaireCard"

/**
 * @deprecated Utiliser `AffaireCard` directement.
 * Thin wrapper conservé pour ne pas casser d’anciens imports.
 */
export function PostCard({
  article,
}: {
  article: AffaireCardItem
  /** Ignoré — AffaireCard n’affiche pas l’auteur */
  authorName?: string
}) {
  return <AffaireCard article={article} titleAs="h3" />
}

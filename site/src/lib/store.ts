import fs from "node:fs"
import path from "node:path"
import { contentRoot, saveArticle, type Article } from "@/lib/content"

/**
 * Couche d'écriture — pré-câblage Supabase.
 *
 * Toutes les mutations (demandes de contact, articles admin) passent par ce
 * store. Aujourd'hui : fichiers dans `contenu/` (POC local). Demain : Supabase
 * (tables `demandes` + `posts`, storage pour les pièces jointes) — on écrit
 * l'implémentation SupabaseStore et RIEN d'autre ne change dans le site.
 *
 * Sur Vercel, le filesystem est éphémère : FsStore y refuse d'écrire pour ne
 * jamais perdre une demande en silence. Tant que Supabase n'est pas branché,
 * le déploiement cloud est vitrine seule (formulaires désactivés proprement).
 */

export interface DemandeInput {
  prenom?: string
  nom?: string
  entreprise?: string
  email?: string
  telephone?: string
  objet?: string
  message?: string
  page_source?: string
  utm?: Record<string, string>
  cooked?: { aid?: string; sid?: string }
}

export interface ContentStore {
  createDemande(data: DemandeInput): Promise<{ id: string }>
  saveArticle(article: Article): Promise<void>
}

class FsStore implements ContentStore {
  private assertWritable() {
    if (process.env.VERCEL) {
      throw new Error(
        "FsStore en environnement éphémère (Vercel) : brancher Supabase (NEXT_PUBLIC_SUPABASE_URL) avant d'accepter des écritures."
      )
    }
  }

  async createDemande(data: DemandeInput): Promise<{ id: string }> {
    this.assertWritable()
    const dir = path.join(contentRoot, "demandes")
    fs.mkdirSync(dir, { recursive: true })
    const id = `demande-${Date.now()}`
    fs.writeFileSync(
      path.join(dir, `${id}.json`),
      JSON.stringify({ id, receivedAt: new Date().toISOString(), ...data }, null, 2) + "\n"
    )
    return { id }
  }

  async saveArticle(article: Article): Promise<void> {
    this.assertWritable()
    saveArticle(article)
  }
}

class SupabaseStore implements ContentStore {
  async createDemande(): Promise<{ id: string }> {
    throw new Error("SupabaseStore : implémentation à venir (tables demandes/posts + storage).")
  }
  async saveArticle(): Promise<void> {
    throw new Error("SupabaseStore : implémentation à venir (tables demandes/posts + storage).")
  }
}

export function getStore(): ContentStore {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return new SupabaseStore()
  return new FsStore()
}

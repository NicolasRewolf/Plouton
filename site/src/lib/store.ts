import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
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
  private client() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new Error("Supabase : NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY manquants.")
    // Clé secrète — serveur uniquement (API routes), jamais exposée au client.
    return createClient(url, key, { auth: { persistSession: false } })
  }

  async createDemande(data: DemandeInput): Promise<{ id: string }> {
    const { data: row, error } = await this.client()
      .from("demandes")
      .insert({
        prenom: data.prenom,
        nom: data.nom,
        entreprise: data.entreprise,
        email: data.email,
        telephone: data.telephone,
        objet: data.objet,
        message: data.message,
        page_source: data.page_source,
        utm: data.utm ?? null,
        cooked: data.cooked ?? null,
        candidature: data.objet === "Nous rejoindre",
      })
      .select("id")
      .single()
    if (error) throw new Error(`Supabase demandes: ${error.message}`)
    return { id: row.id }
  }

  async saveArticle(): Promise<void> {
    // V1 : les articles restent des fichiers git (publiés au déploiement).
    // L'écriture admin en prod arrive avec la table `posts` + auth avocats.
    throw new Error("Édition d'articles en prod : à venir avec la table posts + auth.")
  }
}

export function getStore(): ContentStore {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
    return new SupabaseStore()
  return new FsStore()
}

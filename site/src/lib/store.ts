import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { contentRoot, saveArticle, type Article } from "@/lib/content"
import {
  articleToPostRow,
  postRowToArticle,
  type PostRow,
} from "@/lib/posts-db"

/**
 * Couche d'écriture — Supabase (demandes + posts) ou FsStore en local.
 *
 * C5 : `saveArticle` écrit dans `public.posts`. Le site public lit la DB
 * (secret key) avec fallback JSON — voir `posts-public.ts`.
 *
 * Sur Vercel, FsStore refuse d'écrire (filesystem éphémère).
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
  /** Upload des pièces jointes d'une demande, puis met à jour `fichiers[]`.
   * Retourne les chemins stockés. La demande existe déjà : un échec ici ne
   * doit JAMAIS faire perdre le lead (l'appelant décide du fallback). */
  attachFichiers(demandeId: string, files: File[]): Promise<string[]>
  saveArticle(article: Article): Promise<void>
  /** Optionnel : lecture DB (admin dual-run). Absent sur FsStore. */
  getArticleBySlug?(slug: string): Promise<Article | null>
}

/** Nom de fichier sûr pour un chemin Storage (accents/espaces → _). */
function safeFileName(name: string): string {
  return name.normalize("NFC").replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "").slice(-100) || "fichier"
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

  async attachFichiers(demandeId: string, files: File[]): Promise<string[]> {
    this.assertWritable()
    const dir = path.join(contentRoot, "demandes", "fichiers", demandeId)
    fs.mkdirSync(dir, { recursive: true })
    const paths: string[] = []
    for (const [i, f] of files.entries()) {
      const rel = path.join(demandeId, `${i + 1}-${safeFileName(f.name)}`)
      fs.writeFileSync(path.join(dir, `${i + 1}-${safeFileName(f.name)}`), Buffer.from(await f.arrayBuffer()))
      paths.push(rel)
    }
    return paths
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

  async attachFichiers(demandeId: string, files: File[]): Promise<string[]> {
    const client = this.client()
    const paths: string[] = []
    for (const [i, f] of files.entries()) {
      const objectPath = `demandes/${demandeId}/${i + 1}-${safeFileName(f.name)}`
      const { error } = await client.storage
        .from("pieces-jointes")
        .upload(objectPath, f, { contentType: f.type || "application/octet-stream" })
      if (error) throw new Error(`Storage pieces-jointes: ${error.message}`)
      paths.push(objectPath)
    }
    if (paths.length) {
      const { error } = await client.from("demandes").update({ fichiers: paths }).eq("id", demandeId)
      if (error) throw new Error(`Supabase demandes.fichiers: ${error.message}`)
    }
    return paths
  }

  async saveArticle(article: Article): Promise<void> {
    const row = articleToPostRow(article)
    const { error } = await this.client()
      .from("posts")
      .upsert(row, { onConflict: "slug" })
    if (error) throw new Error(`Supabase posts: ${error.message}`)
  }

  /** Lecture admin : préfère la DB si la ligne existe, sinon null (caller → JSON). */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await this.client()
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    if (error) throw new Error(`Supabase posts: ${error.message}`)
    if (!data) return null
    return postRowToArticle(data as PostRow)
  }
}

export function getStore(): ContentStore {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
    return new SupabaseStore()
  return new FsStore()
}

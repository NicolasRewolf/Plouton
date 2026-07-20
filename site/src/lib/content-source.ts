/**
 * D'où vient le contenu — le seam.
 *
 * La migration Wix laisse deux domiciles au contenu : Supabase, et
 * l'instantané JSON de `contenu/` hérité du seed. Jusqu'ici la question
 * « lequel gagne ? » était retranchée dans une dizaine d'endroits, chacun
 * avec sa propre réponse : `posts-public` la posait quatre fois, les routes
 * API trois, la page auteur une de plus — et elles se contredisaient
 * (un article créé en admin disparaissait de la page de son auteur ; une base
 * vide faisait afficher 422 articles à l'admin et zéro au public).
 *
 * Ce module ne tranche PAS. Il se contente de décrire ce qu'une source de
 * contenu sait faire, et d'en fournir deux implémentations. La précédence
 * — l'unique règle « Supabase si disponible, sinon l'instantané » — vit dans
 * `posts-public.ts`, à un seul endroit.
 *
 * Deux adapters, donc un vrai seam (un seul aurait été de l'indirection) :
 *
 *   SUPABASE  la source de vérité
 *   SNAPSHOT  l'instantané JSON — le reliquat Wix
 *
 * L'intérêt n'est pas esthétique : tant que l'instantané est un adapter nommé,
 * « est-ce qu'on est sorti de Wix ? » a UNE réponse, et le jour où on le
 * supprime se constate au lieu de s'espérer.
 *
 * Convention : une méthode renvoie `null` quand la source ne peut pas
 * répondre (non configurée, injoignable, en erreur) et une valeur — fût-elle
 * vide — quand elle répond. C'est cette distinction, et elle seule, qui
 * déclenche le repli. Un tableau vide est une réponse, pas une panne.
 */

import {
  getArticle,
  getBodyDoc,
  getBodyHtmlCache,
  listArticleIndex,
  type Article,
  type ArticleIndexItem,
} from "@/lib/content"
import {
  getPostAnyStatus,
  getPublishedPost,
  isSupabaseConfigured,
  listAdminPosts,
  listPublishedSlugs,
} from "@/lib/posts-db"
import { isPubliclyVisible, type PostStatus } from "@/lib/post-status"

export type AdminIndexItem = ArticleIndexItem & { status: PostStatus }

export interface ContentSource {
  readonly name: "supabase" | "snapshot"
  /** Article publié, ou `null` si absent / source indisponible. */
  publishedArticle(slug: string): Promise<Article | null>
  /** Article tous statuts (admin), ou `null` si absent / indisponible. */
  anyArticle(slug: string): Promise<Article | null>
  /** Index public. `null` = source indisponible ; `[]` = réponse vide. */
  publishedIndex(): Promise<ArticleIndexItem[] | null>
  /** Index admin, tous statuts. */
  adminIndex(): Promise<AdminIndexItem[] | null>
  /** Slugs publiés (generateStaticParams). */
  publishedSlugs(): Promise<string[] | null>
}

const byPublishedDesc = (a: { publishedAt: string }, b: { publishedAt: string }) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()

/** La source de vérité. Indisponible = pas de clé serveur, ou requête en erreur. */
export const SUPABASE: ContentSource = {
  name: "supabase",

  async publishedArticle(slug) {
    if (!isSupabaseConfigured()) return null
    return getPublishedPost(slug)
  },

  async anyArticle(slug) {
    if (!isSupabaseConfigured()) return null
    return getPostAnyStatus(slug)
  },

  async publishedIndex() {
    const meta = await listAdminPosts()
    if (!meta) return null
    return meta
      .filter((p) => isPubliclyVisible(p.status, p.publishedAt))
      .map(({ status: _status, ...item }) => item)
      .sort(byPublishedDesc)
  },

  async adminIndex() {
    return listAdminPosts()
  },

  async publishedSlugs() {
    return listPublishedSlugs()
  },
}

/**
 * L'instantané JSON — le reliquat de la migration Wix.
 *
 * Toujours disponible (lecture disque), donc il ne renvoie jamais `null` :
 * c'est le dernier recours, il doit répondre quelque chose.
 */
export const SNAPSHOT: ContentSource = {
  name: "snapshot",

  async publishedArticle(slug) {
    const a = getArticle(slug)
    return a && a.status === "published" ? a : null
  },

  async anyArticle(slug) {
    return getArticle(slug)
  },

  async publishedIndex() {
    return listArticleIndex()
      .filter((j) => {
        const full = getArticle(j.slug)
        return !full || full.status === "published"
      })
      .sort(byPublishedDesc)
  },

  async adminIndex() {
    // L'instantané ne porte pas de statut : tout ce qu'il contient a été
    // publié sur Wix. C'est une hypothèse du seed, pas une déduction.
    return listArticleIndex().map((a) => ({ ...a, status: "published" as const }))
  },

  async publishedSlugs() {
    const index = await this.publishedIndex()
    return (index ?? []).map((a) => a.slug)
  },
}

/**
 * Complète un article avec les fichiers de corps quand la source ne les porte
 * pas. Cette réparation existait en triple exemplaire, à chaque fois
 * légèrement différente.
 */
export function withBodyFromFiles(article: Article, slug: string): Article {
  if (!article.bodyDoc) {
    const doc = getBodyDoc(slug)
    if (doc) article.bodyDoc = doc
  }
  if (!article.bodyHtml?.trim()) {
    const html = getBodyHtmlCache(slug)
    if (html) article.bodyHtml = html
  }
  return article
}

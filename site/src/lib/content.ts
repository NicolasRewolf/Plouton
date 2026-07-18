import fs from "node:fs"
import path from "node:path"
import { cache } from "react"

/** Racine des données. Surchargée via CONTENT_ROOT (déploiement, tests). */
export const contentRoot = process.env.CONTENT_ROOT
  ? path.resolve(process.env.CONTENT_ROOT)
  : path.join(process.cwd(), "..", "contenu")
const root = contentRoot

function readJson<T>(rel: string): T {
  const full = path.join(root, rel)
  return JSON.parse(fs.readFileSync(full, "utf8")) as T
}

function writeJson(rel: string, data: unknown) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8")
}

export interface SiteConfig {
  url: string
  name: string
  legalName: string
  siren?: string
  siret?: string
  vatNumber?: string
  tagline: string
  title: string
  description: string
  phone: { display: string; href: string; e164: string }
  email: string
  address: { street: string; postalCode: string; city: string; country: string }
  hours: string
  rating: { value: string; count: number }
  googleReviewsUrl: string
  cabinetId: string
  founderId: string
}

export interface Article {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  updatedAt?: string
  status: "draft" | "published"
  author: string
  authorId?: string
  categories: string[]
  tags?: string[]
  categoryIds?: string[]
  coverImage?: string | null
  minutesToRead?: number | null
  viewCount?: number
  url?: string
  wixId?: string
  /** Title / meta live Wix (baseline) — servis tels quels pour la continuité SEO */
  metaTitle?: string
  metaDescription?: string
  /** HTML structuré (titres, listes, liens) depuis Rich Content Wix */
  bodyHtml?: string
  /** Fallback texte / édition admin */
  body: string[]
}

export interface ArticleIndexItem {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  categories: string[]
  coverImage?: string | null
  minutesToRead?: number | null
  url?: string
  viewCount?: number
}

/** Hub éditorial `/comprendre-le-droit` — données dans contenu/pages/. */
export interface RessourcesHubSection {
  id: string
  title: string
  description?: string
  slugs: string[]
  seeAllHref?: string
  seeAllLabel?: string
}

export interface RessourcesHubContent {
  slug: string
  path?: string
  title: string
  h1?: string
  metaTitle?: string
  metaDescription?: string
  intro: string
  tagsNote?: string
  mostConsulted: {
    title: string
    limit: number
    categoryLabel?: string
  }
  sections: RessourcesHubSection[]
}

/** Hub d’un pôle (3) — cards expertises enfants. */
export interface PoleHubCard {
  title: string
  domaine?: string[]
  synthese: string
  url: string
  image?: string
}

export interface PoleHubContent {
  slug: string
  path: string
  title: string
  metaTitle?: string
  metaDescription?: string
  intro: string
  cards: PoleHubCard[]
}

export interface Category {
  id: string
  label: string
  slug: string
  description: string
  postCount: number
  url: string
  metaTitle?: string
  metaDescription?: string
  coverImage?: string | null
  language: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  short: string
  bio: string
  formation: string
  image?: string | null
  imageSquare?: string | null
  linkedin?: string | null
}

export interface Author {
  id: string
  /** GUID membre Wix (champ `author` des articles importés) */
  wixId?: string
  displayName: string
  shortName: string
  avatar: string
  bio: string
}

export interface ExpertisePage {
  slug: string
  path?: string
  pole: string
  poleLabel: string
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  formObjet: string
  faqExpertise: string
  blogCategories: string[]
  toc: { id: string; label: string; shortLabel?: string }[]
  /** Liens internes harvestés du live (réinjectés dans le corps). */
  inlineLinks?: { text: string; href: string }[]
  contactAside?: { title: string; text: string }
  sections: {
    id: string
    title: string
    titleAccent?: string | null
    lead?: string | null
    blocks: { heading: string; body: string }[]
  }[]
}

export interface LegalSubsection {
  id?: string
  title: string
  paragraphs: string[]
}

export interface LegalSection {
  id?: string
  title?: string
  paragraphs?: string[]
  subsections?: LegalSubsection[]
  /** Ancien scrape Wix (pages non légales) */
  body?: string
  blocks?: { heading?: string; body?: string }[]
}

export interface ContentPage {
  slug: string
  path?: string
  title: string
  metaTitle?: string
  metaDescription?: string
  intro?: string
  sections?: LegalSection[]
  fullText?: string
}

/** Pages légales structurées (mentions, confidentialité, cookies). */
export interface LegalPageContent extends ContentPage {
  h1?: string
  updatedAt?: string
  todos?: string[]
  relatedLinks?: { href: string; label: string }[]
  sections?: LegalSection[]
}

export interface FaqItem {
  question: string
  answer: string
  sousExpertise?: string
}

/** Cache process-wide for 422-file scans (SSG + hot paths). */
let articlesCache: Article[] | null = null
let articleIndexCache: ArticleIndexItem[] | null = null
let categoriesCache: Category[] | null = null

export function invalidateContentCaches() {
  articlesCache = null
  articleIndexCache = null
  categoriesCache = null
}

export const getSite = cache(function getSite(): SiteConfig {
  return readJson<SiteConfig>("site.json")
})

/** Liste légère (422 posts) — pour ticker, listes, sitemap. */
export function listArticleIndex(): ArticleIndexItem[] {
  if (articleIndexCache) return articleIndexCache
  articleIndexCache = readJson<ArticleIndexItem[]>("articles-index.json")
  return articleIndexCache
}

export function listArticles(): Article[] {
  if (articlesCache) return articlesCache
  const dir = path.join(root, "articles")
  if (!fs.existsSync(dir)) {
    articlesCache = []
    return articlesCache
  }
  articlesCache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<Article>(path.join("articles", f)))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  return articlesCache
}

export const getArticle = cache(function getArticle(slug: string): Article | null {
  const raw = decodeURIComponent(slug).normalize("NFC")
  const candidates = [raw, slug.normalize("NFC"), slug]
  for (const s of candidates) {
    const rel = path.join("articles", `${s}.json`)
    const full = path.join(root, rel)
    if (fs.existsSync(full)) return readJson<Article>(rel)
  }
  // Fallback: match by normalized filename (accents macOS / URL)
  const dir = path.join(root, "articles")
  if (!fs.existsSync(dir)) return null
  const target = raw.normalize("NFC")
  const hit = fs.readdirSync(dir).find((f) => {
    if (!f.endsWith(".json")) return false
    return f.slice(0, -5).normalize("NFC") === target
  })
  if (!hit) return null
  return readJson<Article>(path.join("articles", hit))
})

/** Arbre Ricos exact du live (contenu/ricos/, harvest Phase 2) — source de
 * vérité du corps d'article ; bodyHtml (import CSV, lossy) reste le fallback. */
export const getRicos = cache(function getRicos(
  slug: string
): { slug: string; ricos: { nodes: unknown[] } } | null {
  const raw = decodeURIComponent(slug).normalize("NFC")
  const candidates = [raw, slug.normalize("NFC"), slug]
  for (const s of candidates) {
    const rel = path.join("ricos", `${s}.json`)
    if (fs.existsSync(path.join(root, rel))) return readJson(rel)
  }
  const dir = path.join(root, "ricos")
  if (!fs.existsSync(dir)) return null
  const target = raw.normalize("NFC")
  const hit = fs
    .readdirSync(dir)
    .find((f) => f.endsWith(".json") && f.slice(0, -5).normalize("NFC") === target)
  return hit ? readJson(path.join("ricos", hit)) : null
})

export function saveArticle(article: Article) {
  writeJson(path.join("articles", `${article.slug}.json`), article)
  invalidateContentCaches()
  // Refresh index entry
  const index = listArticleIndex().filter((a) => a.slug !== article.slug)
  index.push({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    categories: article.categories,
    coverImage: article.coverImage,
    minutesToRead: article.minutesToRead,
    url: article.url || `/post/${article.slug}`,
  })
  index.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  writeJson("articles-index.json", index)
  articleIndexCache = index
}

export const getExpertise = cache(function getExpertise(
  slug: string
): ExpertisePage | null {
  const file = path.join(root, "expertises", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<ExpertisePage>(path.join("expertises", `${slug}.json`))
})

export function listExpertises(): ExpertisePage[] {
  const dir = path.join(root, "expertises")
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<ExpertisePage>(path.join("expertises", f)))
}

export const getContentPage = cache(function getContentPage(
  slug: string
): ContentPage | null {
  const file = path.join(root, "pages", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<ContentPage>(path.join("pages", `${slug}.json`))
})

export const getLegalPage = cache(function getLegalPage(
  slug: string
): LegalPageContent | null {
  const file = path.join(root, "pages", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<LegalPageContent>(path.join("pages", `${slug}.json`))
})

export function readPageJson<T>(slug: string): T | null {
  const file = path.join(root, "pages", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<T>(path.join("pages", `${slug}.json`))
}

export const getFaq = cache(function getFaq(expertiseKey: string): FaqItem[] {
  const file = path.join(root, "faq", `${expertiseKey}.json`)
  if (!fs.existsSync(file)) return []
  return readJson<FaqItem[]>(path.join("faq", `${expertiseKey}.json`))
})

export function listAuthors(): Author[] {
  return readJson<Author[]>("auteurs.json")
}

export function getAuthor(article: Article): Author | null {
  const authors = listAuthors()
  return (
    authors.find((a) => a.wixId === article.author) ??
    authors.find((a) => a.id === article.authorId) ??
    authors.find((a) => a.displayName === article.author) ??
    null
  )
}

export function getExpertiseCards() {
  return readJson<
    { title: string; domaineFiltre: string; url: string; synthese: string }[]
  >("expertises-cards.json")
}

export function getEquipe(): TeamMember[] {
  return readJson<TeamMember[]>("equipe.json")
}

/** Slug catégorie : celui du CMS importé si connu, sinon slugify façon Wix (accents conservés) */
export function categorySlug(label: string): string {
  const known = getCategories().find((c) => c.label === label)
  if (known) return known.slug
  return label.toLowerCase().replace(/\s+/g, "-")
}

export function getCategories(): Category[] {
  if (categoriesCache) return categoriesCache
  categoriesCache = readJson<Category[]>("categories.json")
  return categoriesCache
}

export function getAccueil() {
  return readJson<{
    hero: {
      titleLines: { text: string; color: string }[]
      phone: string
      address: string
      ctas: { label: string; href: string }[]
    }
    tickerLabel: string
    intro: {
      image: string
      imageAlt: string
      heading: string
      headingLines: { text: string; color: string }[]
      body: string
      citation: string
    }
    expertiseIntro: {
      eyebrow: string
      heading: string
      headingAccent: { text: string; accent: boolean }[]
    }
    poles: {
      label: string
      title: string
      intro: string
      items: { title: string; href: string }[]
    }[]
    expertiseBlock: {
      heading: string
      body: string
      cta: { label: string; href: string }
    }
    equipe: { heading: string; cta: { label: string; href: string } }
    affaires: { heading: string; cta: { label: string; href: string } }
  }>("pages/accueil.json")
}

export function publishedArticles(): ArticleIndexItem[] {
  return listArticleIndex()
}

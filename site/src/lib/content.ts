import fs from "node:fs"
import path from "node:path"

const root = path.join(process.cwd(), "..", "contenu")

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
}

export interface Category {
  id: string
  label: string
  slug: string
  description: string
  postCount: number
  url: string
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
  toc: { id: string; label: string }[]
  contactAside?: { title: string; text: string }
  sections: {
    id: string
    title: string
    titleAccent?: string | null
    lead?: string | null
    blocks: { heading: string; body: string }[]
  }[]
}

export interface ContentPage {
  slug: string
  path?: string
  title: string
  metaTitle?: string
  metaDescription?: string
  intro?: string
  sections?: {
    title?: string
    blocks?: { heading?: string; body?: string }[]
  }[]
  fullText?: string
}

export interface FaqItem {
  question: string
  answer: string
  sousExpertise?: string
}

export function getSite(): SiteConfig {
  return readJson<SiteConfig>("site.json")
}

/** Liste légère (422 posts) — pour ticker, listes, sitemap. */
export function listArticleIndex(): ArticleIndexItem[] {
  return readJson<ArticleIndexItem[]>("articles-index.json")
}

export function listArticles(): Article[] {
  const dir = path.join(root, "articles")
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<Article>(path.join("articles", f)))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}

export function getArticle(slug: string): Article | null {
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
}

export function saveArticle(article: Article) {
  writeJson(path.join("articles", `${article.slug}.json`), article)
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
}

export function getExpertise(slug: string): ExpertisePage | null {
  const file = path.join(root, "expertises", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<ExpertisePage>(path.join("expertises", `${slug}.json`))
}

export function listExpertises(): ExpertisePage[] {
  const dir = path.join(root, "expertises")
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<ExpertisePage>(path.join("expertises", f)))
}

export function getContentPage(slug: string): ContentPage | null {
  const file = path.join(root, "pages", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<ContentPage>(path.join("pages", `${slug}.json`))
}

export function readPageJson<T>(slug: string): T | null {
  const file = path.join(root, "pages", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<T>(path.join("pages", `${slug}.json`))
}

export function getFaq(expertiseKey: string): FaqItem[] {
  const file = path.join(root, "faq", `${expertiseKey}.json`)
  if (!fs.existsSync(file)) return []
  return readJson<FaqItem[]>(path.join("faq", `${expertiseKey}.json`))
}

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
  return readJson<Category[]>("categories.json")
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
    intro: { heading: string; body: string; citation: string }
    expertiseIntro: { eyebrow: string; heading: string }
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

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
  status: "draft" | "published"
  author: string
  categories: string[]
  coverImage?: string
  minutesToRead?: number
  body: string[]
}

export interface ExpertisePage {
  slug: string
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
  sections: {
    id: string
    title: string
    blocks: { heading: string; body: string }[]
  }[]
}

export interface FaqItem {
  question: string
  answer: string
  sousExpertise?: string
}

export function getSite(): SiteConfig {
  return readJson<SiteConfig>("site.json")
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
  const file = path.join(root, "articles", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<Article>(path.join("articles", `${slug}.json`))
}

export function saveArticle(article: Article) {
  writeJson(path.join("articles", `${article.slug}.json`), article)
}

export function getExpertise(slug: string): ExpertisePage | null {
  const file = path.join(root, "expertises", `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return readJson<ExpertisePage>(path.join("expertises", `${slug}.json`))
}

export function getFaq(expertiseKey: string): FaqItem[] {
  const file = path.join(root, "faq", `${expertiseKey}.json`)
  if (!fs.existsSync(file)) return []
  return readJson<FaqItem[]>(path.join("faq", `${expertiseKey}.json`))
}

export function getExpertiseCards() {
  return readJson<
    { title: string; domaineFiltre: string; url: string; synthese: string }[]
  >("expertises-cards.json")
}

export function getEquipe() {
  return readJson<{ name: string; role: string }[]>("equipe.json")
}

export function publishedArticles(): Article[] {
  return listArticles().filter((a) => a.status === "published")
}

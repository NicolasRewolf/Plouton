#!/usr/bin/env node
/**
 * P1-D — Backfill posts.body_doc + posts.body_html depuis contenu/.
 * Usage : node --env-file=site/.env.local scripts/backfill-body-to-db.mjs [--dry-run] [--limit=N]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const dry = process.argv.includes("--dry-run")
const limitArg = process.argv.find((a) => a.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "")
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY")
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
}

const docsDir = path.join(root, "contenu/body-docs")
const htmlDir = path.join(root, "contenu/body-html")
const files = fs
  .readdirSync(docsDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .slice(0, Number.isFinite(limit) ? limit : undefined)

let ok = 0
let missHtml = 0
let err = 0

for (const file of files) {
  const slug = file.slice(0, -5)
  const htmlPath = path.join(htmlDir, `${slug}.html`)
  if (!fs.existsSync(htmlPath)) {
    missHtml++
    console.warn(`HTML manquant: ${slug}`)
    continue
  }
  const bodyDoc = JSON.parse(fs.readFileSync(path.join(docsDir, file), "utf8"))
  const bodyHtml = fs.readFileSync(htmlPath, "utf8")
  const plain = bodyHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const word_count = plain ? plain.split(" ").length : 0

  if (dry) {
    ok++
    continue
  }

  const up = await fetch(
    `${url}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        body_doc: bodyDoc,
        body_html: bodyHtml,
        word_count,
      }),
    }
  )
  if (!up.ok) {
    err++
    console.warn(`${slug}: ${await up.text()}`)
    continue
  }
  ok++
  if (ok % 50 === 0) console.log(`… ${ok}/${files.length}`)
}

console.log(
  dry
    ? `dry-run: ${ok} prêts, html manquants=${missHtml}`
    : `ok: ${ok} mis à jour, erreurs=${err}, html manquants=${missHtml}`
)
if (err || missHtml) process.exit(1)

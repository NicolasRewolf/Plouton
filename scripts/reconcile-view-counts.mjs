#!/usr/bin/env node
/**
 * P1-D — Réconcilie posts.view_count = GREATEST(db, stats-posts.json).
 * Usage : node --env-file=site/.env.local scripts/reconcile-view-counts.mjs [--dry-run]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const dry = process.argv.includes("--dry-run")

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

const stats = JSON.parse(
  fs.readFileSync(path.join(root, "contenu/sources/wix/stats-posts.json"), "utf8")
)

const listRes = await fetch(`${url}/rest/v1/posts?select=slug,view_count`, {
  headers,
})
if (!listRes.ok) {
  console.error(await listRes.text())
  process.exit(1)
}
const rows = await listRes.json()

let bumped = 0
let same = 0
for (const row of rows) {
  const fromJson = stats[row.slug]?.views ?? 0
  const fromDb = row.view_count ?? 0
  const next = Math.max(fromJson, fromDb)
  if (next === fromDb) {
    same++
    continue
  }
  bumped++
  if (dry) {
    console.log(`DRY ${row.slug}: ${fromDb} → ${next}`)
    continue
  }
  const up = await fetch(
    `${url}/rest/v1/posts?slug=eq.${encodeURIComponent(row.slug)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ view_count: next }),
    }
  )
  if (!up.ok) console.warn(`${row.slug}: ${await up.text()}`)
}

console.log(
  dry
    ? `dry-run: ${bumped} à monter, ${same} inchangés`
    : `ok: ${bumped} mis à jour, ${same} inchangés`
)

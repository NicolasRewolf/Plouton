#!/usr/bin/env node
/**
 * P1-D — Réconcilie posts.view_count = GREATEST(db, stats-posts.json).
 * À lancer une fois avec SUPABASE_SECRET_KEY (ou SERVICE_ROLE).
 * Après succès : on pourra retirer withViews + le JSON (brief #18).
 *
 * Usage : node scripts/reconcile-view-counts.mjs [--dry-run]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const dry = process.argv.includes("--dry-run")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Manque SUPABASE_URL + SUPABASE_SECRET_KEY")
  process.exit(1)
}

const statsPath = path.join(root, "contenu/stats-posts.json")
const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"))
const client = createClient(url, key, { auth: { persistSession: false } })

const { data: rows, error } = await client
  .from("posts")
  .select("slug, view_count")

if (error) {
  console.error(error.message)
  process.exit(1)
}

let bumped = 0
let same = 0
for (const row of rows || []) {
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
  const { error: upErr } = await client
    .from("posts")
    .update({ view_count: next })
    .eq("slug", row.slug)
  if (upErr) console.warn(`${row.slug}: ${upErr.message}`)
}

console.log(
  dry
    ? `dry-run: ${bumped} à monter, ${same} inchangés`
    : `ok: ${bumped} mis à jour, ${same} inchangés`
)

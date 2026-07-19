/**
 * Rate-limit mémoire (process) — anti-spam basique pour /api/contact.
 * Suffisant en V1 (pas de Redis). Sur serverless, chaque instance a son compteur.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS = 15 * 60 * 1000
const MAX_HITS = 8

export function checkRateLimit(key: string): {
  ok: boolean
  retryAfterSec?: number
} {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (existing.count >= MAX_HITS) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }
  existing.count += 1
  return { ok: true }
}

/** IP depuis headers proxy (Vercel / reverse-proxy). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const real = headers.get("x-real-ip")?.trim()
  if (real) return real.slice(0, 64)
  return "unknown"
}

#!/usr/bin/env node
/**
 * Vérifie que les routes d'écriture refusent un appelant sans session
 * (`src/lib/admin-route.ts`, `src/lib/require-admin.ts`).
 *
 * C'est la propriété la plus sensible du dépôt, et rien ne la testait. Le
 * contexte : `proxy.ts` applique l'allowlist `ADMIN_EMAILS`, mais son matcher
 * est `/admin/:path*` — **il ne voit jamais `/api/*`**. Les routes d'écriture
 * doivent donc se défendre elles-mêmes, et elles écrivent avec la clé secrète,
 * sans RLS derrière pour rattraper. Une route qui oublie son contrôle est une
 * table ouverte à l'internet.
 *
 * La garde ÉNUMÈRE les routes au lieu de les lister : elle balaye
 * `src/app/api/**\/route.ts` et exige que chaque méthode HTTP exportée réponde
 * 401. Une route ajoutée demain sans protection fait rougir la garde sans que
 * personne ait eu à penser à l'inscrire ici. Les rares routes légitimement
 * publiques sont déclarées ci-dessous, une par une, avec leur raison — c'est
 * une liste d'exceptions assumées, pas un angle mort.
 *
 * Sûreté : la garde appelle de vraies routes d'écriture. Elle retire donc
 * `SUPABASE_SECRET_KEY` de l'environnement AVANT tout import, de sorte
 * qu'aucune écriture ne puisse atteindre la base même si un contrôle
 * d'identité venait à manquer — le cas que la garde est précisément là pour
 * détecter.
 *
 * Usage : (depuis site/) npm run check:admin-routes
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// AVANT les imports de routes : aucune écriture ne doit pouvoir aboutir.
delete process.env.SUPABASE_SECRET_KEY
delete process.env.SUPABASE_SERVICE_ROLE_KEY

import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const API = path.join(here, "..", "src", "app", "api")

const { NON_AUTORISE } = await import(
  path.join(here, "..", "src", "lib", "admin-route.ts")
)
const { lireCorps, Refus } = await import(
  path.join(here, "..", "src", "lib", "admin-route.ts")
)

/**
 * Les routes qui n'ont pas à exiger une session admin. Chacune doit avoir une
 * raison qui tient en une ligne — si on ne sait pas l'écrire, c'est un défaut.
 */
const PUBLIQUES = {
  "contact/route.ts":
    "formulaire public du site — défendu par un pot de miel et une limite de débit",
  "categories/route.ts":
    "liste des rubriques, déjà publique sur le site — lecture seule",
  "cron/publish-scheduled/route.ts":
    "appelée par le cron Vercel, authentifiée par CRON_SECRET et non par une session",
}

const METHODES = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]

/** Toutes les routes sous src/app/api, en chemins relatifs à ce dossier. */
function routes(dir = API, prefixe = "") {
  const trouvees = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefixe ? `${prefixe}/${e.name}` : e.name
    if (e.isDirectory()) trouvees.push(...routes(path.join(dir, e.name), rel))
    else if (e.name === "route.ts") trouvees.push(rel)
  }
  return trouvees.sort()
}

const requete = (methode) =>
  new Request("http://localhost/api/sonde?id=1&slug=x", {
    method: methode,
    headers: { "content-type": "application/json" },
    ...(["POST", "PUT", "PATCH"].includes(methode) ? { body: "{}" } : {}),
  })

await garde("routes d'écriture — refus sans session", async (t) => {
  const toutes = routes()
  const protegees = toutes.filter((r) => !(r in PUBLIQUES))

  t.section("l'inventaire")

  // Un balayage qui ne trouve rien passerait tout le reste au vert.
  t.ok(
    `${toutes.length} routes trouvées sous src/app/api`,
    toutes.length >= 8,
    `trouvées : ${toutes.join(", ")}`
  )

  // Une exception déclarée pour une route disparue est une exception qui
  // couvrira silencieusement une future route au même chemin.
  await t.each(
    "chaque route déclarée publique existe encore",
    Object.keys(PUBLIQUES),
    (r) => toutes.includes(r) || `${r} — déclarée publique mais introuvable`
  )

  for (const [r, raison] of Object.entries(PUBLIQUES)) {
    t.ok(`publique assumée — ${r}`, Boolean(raison && raison.length > 20), raison)
  }

  t.section("aucune route protégée ne répond sans session")

  const resultats = []
  for (const rel of protegees) {
    const mod = await import(path.join(API, rel))
    for (const m of METHODES) {
      if (typeof mod[m] !== "function") continue
      let statut, corps
      try {
        const res = await mod[m](requete(m))
        statut = res.status
        corps = await res.json().catch(() => null)
      } catch (e) {
        statut = "exception"
        corps = { error: e instanceof Error ? e.message : String(e) }
      }
      resultats.push({ rel, m, statut, corps })
    }
  }

  t.ok(
    `${resultats.length} méthodes HTTP exercées`,
    resultats.length >= 10,
    `exercées : ${resultats.map((r) => `${r.m} ${r.rel}`).join(", ")}`
  )

  await t.each(
    "chaque méthode répond 401 à un appelant sans session",
    resultats,
    ({ rel, m, statut, corps }) =>
      statut === 401 ||
      `${m} ${rel} → ${statut} ${JSON.stringify(corps)?.slice(0, 90)}`
  )

  t.section("une seule forme d'erreur")

  // Trois enveloppes coexistaient — {error}, {error, code, errors} et
  // {ok: false, error} — obligeant l'admin à brancher selon la route appelée.
  await t.each(
    "chaque refus porte la forme canonique",
    resultats,
    ({ rel, m, corps }) => {
      if (!corps || typeof corps !== "object") return `${m} ${rel} — corps absent`
      if (corps.error !== NON_AUTORISE.error)
        return `${m} ${rel} — error « ${corps.error} » au lieu de « ${NON_AUTORISE.error} »`
      if (corps.code !== NON_AUTORISE.code)
        return `${m} ${rel} — code « ${corps.code} » au lieu de « ${NON_AUTORISE.code} »`
      if ("ok" in corps) return `${m} ${rel} — porte encore un champ « ok »`
      return true
    }
  )

  t.section("un corps illisible est un refus, pas une panne")

  // `readJsonBody` existait pour ça, mais une seule route sur trois l'appelait :
  // le même corps malformé donnait un 400 propre sur /api/posts et un 500
  // opaque sur /api/faq. Le contrôle d'identité passant — à raison — avant la
  // lecture du corps, on exerce la lecture directement.
  const malforme = new Request("http://localhost/api/sonde", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{ceci n'est pas du JSON",
  })
  let leve = null
  try {
    await lireCorps(malforme)
  } catch (e) {
    leve = e
  }
  t.ok("un corps malformé lève un refus", leve instanceof Refus, () =>
    leve ? `levé : ${leve.name} — ${leve.message}` : "rien n'a été levé"
  )
  t.eq("… en 400, pas en 500", leve?.statut, 400)
  t.eq("… avec un code exploitable", leve?.code, "CORPS_ILLISIBLE")

  const bon = new Request("http://localhost/api/sonde", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ titre: "ok" }),
  })
  t.eq("un corps valide passe", await lireCorps(bon), { titre: "ok" })
})

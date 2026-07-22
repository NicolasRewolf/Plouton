#!/usr/bin/env node
/**
 * Vérifie la précédence des sources (`src/lib/posts-precedence.ts`).
 *
 * « Supabase répond, sinon l'instantané. » Une phrase, et deux incidents de
 * production à son actif : un article créé en admin absent de la page de son
 * auteur, et une base joignable mais vide qui affichait 422 articles côté
 * admin pendant que le site public n'en montrait aucun. La règle n'avait
 * pourtant aucune garde — elle était soudée à `unstable_cache`, donc
 * inexécutable hors d'une requête Next.
 *
 * Elle prend maintenant ses sources en paramètre. On lui présente ici des
 * adapters de PAPIER : des objets en mémoire qui satisfont `ContentSource` et
 * qui comptent leurs appels. Ce que ça permet, et qu'aucune base réelle ne
 * permet, c'est d'exercer les états qu'on ne sait pas provoquer :
 *
 *   MUET     Supabase ne répond à rien       → l'instantané doit prendre le relais
 *   VIDE     Supabase répond, sans contenu   → le vide doit gagner, PAS les 422
 *   PLEIN    Supabase répond                 → l'instantané ne doit pas être touché
 *
 * Le cas VIDE est le piège : `null` (muet) et `[]` (vide) se ressemblent à
 * l'œil, et les confondre est exactement ce qui a produit le « 422 côté admin,
 * 0 côté public ».
 *
 * Chaque cas se double d'un compteur d'appels. Une égalité seule ne prouve pas
 * grand-chose quand les deux sources pourraient répondre la même chose : le
 * compteur, lui, dit QUI a répondu — et c'est lui qui casse si la règle est
 * inversée.
 *
 * Usage : (depuis site/) npm run check:precedence
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const {
  decideAdminList,
  decideAnyArticle,
  decidePublishedArticle,
  decidePublishedIndex,
  decidePublishedSlugs,
} = await import(path.join(here, "..", "src", "lib", "posts-precedence.ts"))

/* ───────────────────────── les adapters de papier ───────────────────────── */

const article = (slug, provenance) => ({
  slug,
  title: `Article ${slug} (${provenance})`,
  excerpt: `Venu de ${provenance}.`,
  publishedAt: "2024-03-01T09:00:00.000Z",
  status: "published",
  author: "Cabinet",
  categories: ["droit-pénal"],
})

const entree = (slug, provenance) => ({
  slug,
  title: `Article ${slug} (${provenance})`,
  excerpt: `Venu de ${provenance}.`,
  publishedAt: "2024-03-01T09:00:00.000Z",
  categories: ["droit-pénal"],
})

/**
 * Une source en mémoire qui satisfait `ContentSource` et compte ses appels.
 *
 * `reponses` donne, méthode par méthode, ce que la source renvoie — `null`
 * pour « je ne réponds pas ». Les compteurs sont la vraie mesure : ils
 * distinguent « la bonne valeur » de « la bonne valeur pour la bonne raison ».
 */
function sourcePapier(name, reponses) {
  const appels = { publishedArticle: 0, anyArticle: 0, publishedIndex: 0, adminIndex: 0, publishedSlugs: 0 }
  const rendre = (methode, arg) => {
    appels[methode]++
    const r = reponses[methode]
    return typeof r === "function" ? r(arg) : (r ?? null)
  }
  return {
    name,
    appels,
    get total() {
      return Object.values(appels).reduce((a, b) => a + b, 0)
    },
    async publishedArticle(slug) {
      return rendre("publishedArticle", slug)
    },
    async anyArticle(slug) {
      return rendre("anyArticle", slug)
    },
    async publishedIndex() {
      return rendre("publishedIndex")
    },
    async adminIndex() {
      return rendre("adminIndex")
    },
    async publishedSlugs() {
      return rendre("publishedSlugs")
    },
  }
}

/**
 * L'instantané de papier — il répond TOUJOURS, comme le vrai (lecture disque).
 * Il porte le slug « garde-a-vue », que Supabase possédera ou non selon le cas.
 */
const instantane = () =>
  sourcePapier("snapshot", {
    publishedArticle: (slug) => (slug === "garde-a-vue" ? article(slug, "instantané") : null),
    anyArticle: (slug) => (slug === "garde-a-vue" ? article(slug, "instantané") : null),
    publishedIndex: () => [entree("garde-a-vue", "instantané"), entree("itt-penale", "instantané")],
    adminIndex: () => [
      { ...entree("garde-a-vue", "instantané"), status: "published" },
      { ...entree("itt-penale", "instantané"), status: "published" },
    ],
    publishedSlugs: () => ["garde-a-vue", "itt-penale"],
  })

/** Assemble la précédence et compte, en plus, les coups de sonde. */
function precedence(supabase, snapshot, repond) {
  const sonde = { appels: 0 }
  return {
    p: {
      supabase,
      snapshot,
      async supabaseAnswers() {
        sonde.appels++
        return repond
      },
    },
    sonde,
  }
}

const slugs = (liste) => liste.map((a) => a.slug)

/* ───────────────────────────────── la garde ──────────────────────────────── */

await garde("précédence des sources", async (t) => {
  /* ── Supabase muet ─────────────────────────────────────────────────────
   * Pas de clé serveur, base injoignable, requête en erreur : toutes les
   * méthodes renvoient `null`. C'est l'état du site le jour où la base tombe,
   * et il doit rester servi entièrement par l'instantané. */
  t.section("Supabase muet — l'instantané prend tout")
  {
    const supabase = sourcePapier("supabase", {})
    const snapshot = instantane()
    const { p, sonde } = precedence(supabase, snapshot, false)

    t.eq("l'index est celui de l'instantané", slugs(await decidePublishedIndex(p)), [
      "garde-a-vue",
      "itt-penale",
    ])
    t.eq(
      "l'article est celui de l'instantané (repli)",
      (await decidePublishedArticle(p, "garde-a-vue"))?.title,
      "Article garde-a-vue (instantané)"
    )
    t.eq(
      "la liste admin est celle de l'instantané",
      slugs(await decideAdminList(p)),
      ["garde-a-vue", "itt-penale"]
    )
    t.eq("les slugs sont ceux de l'instantané", await decidePublishedSlugs(p), [
      "garde-a-vue",
      "itt-penale",
    ])
    t.eq(
      "l'article tous statuts aussi",
      (await decideAnyArticle(p, "garde-a-vue"))?.title,
      "Article garde-a-vue (instantané)"
    )

    // Supabase a bien été interrogé d'abord : sans ça, le repli ne prouverait
    // rien — une règle qui ignorerait Supabase passerait tous les cas ci-dessus.
    t.ok(
      "Supabase a été interrogé le premier, sur chaque question",
      supabase.total === 5,
      () => `appels à Supabase : ${JSON.stringify(supabase.appels)}`
    )
    t.ok(
      "la sonde a servi (une fois, pour l'article manquant)",
      sonde.appels === 1,
      `${sonde.appels} coup(s) de sonde`
    )
  }

  /* ── Supabase joignable mais vide ──────────────────────────────────────
   * Le piège. La source RÉPOND — `[]` et `null` sont des réponses — et sa
   * réponse fait autorité même quand l'instantané, lui, a du contenu à
   * offrir. Sinon : 422 articles au tableau de bord, 0 sur le site, et la
   * panne masquée. */
  t.section("Supabase joignable mais vide — le vide fait autorité")
  {
    const supabase = sourcePapier("supabase", {
      publishedIndex: () => [],
      adminIndex: () => [],
      publishedSlugs: () => [],
      publishedArticle: () => null,
    })
    const snapshot = instantane()
    const { p, sonde } = precedence(supabase, snapshot, true)

    t.eq("l'index est vide, PAS les articles de l'instantané", await decidePublishedIndex(p), [])
    t.ok(
      "l'instantané n'a pas été consulté pour l'index",
      snapshot.appels.publishedIndex === 0,
      `${snapshot.appels.publishedIndex} appel(s)`
    )

    t.eq("la liste admin est vide, PAS 422 lignes", await decideAdminList(p), [])
    t.ok(
      "l'instantané n'a pas été consulté pour la liste admin",
      snapshot.appels.adminIndex === 0,
      `${snapshot.appels.adminIndex} appel(s)`
    )

    t.eq("les slugs publiés sont vides", await decidePublishedSlugs(p), [])

    // Un article supprimé en base traîne encore dans `contenu/articles/`. Le
    // silence de Supabase doit le tenir pour supprimé, sinon supprimer un
    // article ne le supprime jamais vraiment.
    t.eq(
      "un article absent de Supabase reste absent, même présent dans l'instantané",
      await decidePublishedArticle(p, "garde-a-vue"),
      null
    )
    t.ok(
      "l'instantané n'a pas été consulté pour cet article",
      snapshot.appels.publishedArticle === 0,
      `${snapshot.appels.publishedArticle} appel(s)`
    )
    t.ok(
      "la sonde a tranché (elle a bien été posée)",
      sonde.appels === 1,
      `${sonde.appels} coup(s) de sonde`
    )
  }

  /* ── Supabase répond ───────────────────────────────────────────────────
   * Le cas nominal. Rien de l'instantané ne doit remonter — pas même « au
   * cas où » : c'est ce mélange des deux sources qui faisait diverger les
   * pages entre elles. */
  t.section("Supabase répond — l'instantané reste fermé")
  {
    const supabase = sourcePapier("supabase", {
      publishedArticle: (slug) => article(slug, "Supabase"),
      anyArticle: (slug) => article(slug, "Supabase"),
      publishedIndex: () => [entree("nouveau", "Supabase")],
      adminIndex: () => [{ ...entree("nouveau", "Supabase"), status: "draft" }],
      publishedSlugs: () => ["nouveau"],
    })
    const snapshot = instantane()
    const { p, sonde } = precedence(supabase, snapshot, true)

    t.eq(
      "l'article servi est celui de Supabase",
      (await decidePublishedArticle(p, "garde-a-vue"))?.title,
      "Article garde-a-vue (Supabase)"
    )
    t.eq("l'index est celui de Supabase", slugs(await decidePublishedIndex(p)), ["nouveau"])
    t.eq("la liste admin est celle de Supabase", slugs(await decideAdminList(p)), ["nouveau"])
    t.eq("le statut admin de Supabase est conservé", (await decideAdminList(p))[0].status, "draft")
    t.eq("les slugs sont ceux de Supabase", await decidePublishedSlugs(p), ["nouveau"])
    t.eq(
      "l'article tous statuts vient de Supabase",
      (await decideAnyArticle(p, "garde-a-vue"))?.title,
      "Article garde-a-vue (Supabase)"
    )

    t.ok(
      "l'instantané n'a été consulté pour RIEN (compteur à 0)",
      snapshot.total === 0,
      () => `appels à l'instantané : ${JSON.stringify(snapshot.appels)}`
    )
    t.ok(
      "la sonde n'a pas été posée (aucun article ne manquait)",
      sonde.appels === 0,
      `${sonde.appels} coup(s) de sonde`
    )
  }

  /* ── la sonde ──────────────────────────────────────────────────────────
   * Sonder coûte une requête. Elle ne sert qu'à lever UNE ambiguïté — pour un
   * article, `null` veut dire « absent » ou « muet », et les deux ne donnent
   * pas le même résultat. Partout ailleurs, `null` est sans ambiguïté : pas de
   * sonde. */
  t.section("la sonde — posée seulement quand elle tranche quelque chose")
  {
    // Article trouvé : rien à trancher.
    const trouve = precedence(
      sourcePapier("supabase", { publishedArticle: (s) => article(s, "Supabase") }),
      instantane(),
      true
    )
    await decidePublishedArticle(trouve.p, "garde-a-vue")
    t.eq("article trouvé → aucune sonde", trouve.sonde.appels, 0)

    // Article manquant : c'est là, et seulement là, qu'elle sert.
    const manquant = precedence(sourcePapier("supabase", {}), instantane(), false)
    await decidePublishedArticle(manquant.p, "garde-a-vue")
    t.eq("article manquant → une sonde, une seule", manquant.sonde.appels, 1)

    // Côté admin, on ne fait pas autorité par le silence : l'écriture doit
    // pouvoir retrouver un brouillon même si la base bafouille.
    const admin = precedence(sourcePapier("supabase", {}), instantane(), true)
    const repli = await decideAnyArticle(admin.p, "garde-a-vue")
    t.eq("`decideAnyArticle` ne sonde JAMAIS", admin.sonde.appels, 0)
    t.eq(
      "et se replie directement sur l'instantané",
      repli?.title,
      "Article garde-a-vue (instantané)"
    )
  }

  /* ── le contrat null / [] ──────────────────────────────────────────────
   * La règle repose entièrement sur cette distinction. Si un jour une source
   * confond les deux, c'est ici qu'on veut l'apprendre — pas en production. */
  t.section("le contrat — `null` n'est pas `[]`")
  {
    const vide = precedence(
      sourcePapier("supabase", { publishedIndex: () => [], adminIndex: () => [] }),
      instantane(),
      true
    )
    const muet = precedence(sourcePapier("supabase", {}), instantane(), false)

    const indexVide = await decidePublishedIndex(vide.p)
    const indexMuet = await decidePublishedIndex(muet.p)
    t.ok(
      "les deux états donnent des résultats DIFFÉRENTS",
      indexVide.length === 0 && indexMuet.length === 2,
      `vide → ${indexVide.length} · muet → ${indexMuet.length}`
    )

    const adminVide = await decideAdminList(vide.p)
    const adminMuet = await decideAdminList(muet.p)
    t.ok(
      "idem pour la liste admin",
      adminVide.length === 0 && adminMuet.length === 2,
      `vide → ${adminVide.length} · muet → ${adminMuet.length}`
    )
  }
})

#!/usr/bin/env node
/**
 * Vérifie le calcul de statut dans le temps (`src/lib/post-status.ts`).
 *
 * Ce module décide de deux choses que personne ne peut relire à l'œil : ce
 * qu'on écrit en base quand l'avocat enregistre, et ce que le site public
 * accepte de montrer. Les deux reposent sur une comparaison de dates, et un
 * signe inversé ne se voit pas — il se constate le jour où un article sous
 * embargo, programmé pour la date d'une décision, sort la veille.
 *
 * `check:submission` couvre déjà `readStatus` : la lecture d'une chaîne
 * envoyée par le formulaire. Elle ne touche jamais aux dates. Tout ce qui suit
 * l'heure qu'il est n'était vérifié nulle part.
 *
 * Aucune date n'est écrite en dur ici. Elles sont toutes dérivées de
 * `todayIsoDate()` — hier, aujourd'hui, demain — sinon la garde deviendrait
 * saisonnière : verte en janvier, rouge en juin, pour des raisons qui n'ont
 * rien à voir avec le code.
 *
 * Usage : (depuis site/) npx tsx scripts/check-statuts.mjs
 */
import path from "node:path"
import { fileURLToPath } from "node:url"

import { garde } from "../../scripts/lib/garde.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const {
  isPostStatus,
  todayIsoDate,
  resolvePersistStatus,
  isPubliclyVisible,
  statusLabel,
} = await import(path.join(here, "..", "src", "lib", "post-status.ts"))

const AUJOURDHUI = todayIsoDate()

/** Un jour d'écart, compté en UTC comme le module lui-même. */
const decale = (jours) =>
  new Date(Date.parse(`${AUJOURDHUI}T00:00:00Z`) + jours * 86_400_000)
    .toISOString()
    .slice(0, 10)

const HIER = decale(-1)
const DEMAIN = decale(1)

/** Le format que la base renvoie parfois : le module tronque à 10 caractères. */
const DEMAIN_HORODATE = `${DEMAIN}T08:30:00.000Z`
const HIER_HORODATE = `${HIER}T23:59:59.000Z`

const STATUTS = ["draft", "published", "archived", "scheduled"]
const DATES = [HIER, AUJOURDHUI, DEMAIN, undefined, "", DEMAIN_HORODATE]

await garde("statuts d'article dans le temps", async (t) => {
  t.section("ce qu'on écrit en base — resolvePersistStatus")

  // Le bord qui compte : « publier » avec une date à venir n'est pas publier.
  t.eq(
    "published + date future → scheduled",
    resolvePersistStatus("published", DEMAIN),
    "scheduled"
  )
  t.eq(
    "published + horodatage futur → scheduled (la date est tronquée à 10)",
    resolvePersistStatus("published", DEMAIN_HORODATE),
    "scheduled"
  )
  t.eq(
    "published + date passée reste published",
    resolvePersistStatus("published", HIER),
    "published"
  )
  // La frontière est aujourd'hui inclus : un article daté du jour est publié,
  // pas programmé pour ce soir.
  t.eq(
    "published + aujourd'hui reste published",
    resolvePersistStatus("published", AUJOURDHUI),
    "published"
  )

  t.eq(
    "scheduled + date passée → published",
    resolvePersistStatus("scheduled", HIER),
    "published"
  )
  t.eq(
    "scheduled + aujourd'hui → published",
    resolvePersistStatus("scheduled", AUJOURDHUI),
    "published"
  )
  t.eq(
    "scheduled + date future reste scheduled",
    resolvePersistStatus("scheduled", DEMAIN),
    "scheduled"
  )
  t.eq(
    "scheduled + horodatage passé → published",
    resolvePersistStatus("scheduled", HIER_HORODATE),
    "published"
  )

  // Une date absente vaut aujourd'hui. Conséquence directe, et voulue : un
  // « publier » sans date publie, il ne programme pas.
  t.eq(
    "published sans date → published (la date manquante vaut aujourd'hui)",
    resolvePersistStatus("published", undefined),
    "published"
  )
  // Même règle, effet moins évident : un « programmé » sans date part
  // immédiatement en published. Voir la section « les deux vues ensemble ».
  t.eq(
    "scheduled sans date → published",
    resolvePersistStatus("scheduled", undefined),
    "published"
  )

  t.section("les deux statuts que la date ne touche jamais")

  // Un archivé est un soft-delete : aucune date ne doit le ressusciter. Un
  // brouillon daté du passé ne doit pas se publier tout seul parce qu'un
  // avocat a rempli le champ date avant d'avoir fini d'écrire.
  await t.each(
    "archived reste archived quelle que soit la date",
    DATES,
    (d) =>
      resolvePersistStatus("archived", d) === "archived" ||
      `date ${JSON.stringify(d)} → ${resolvePersistStatus("archived", d)}`
  )
  await t.each(
    "draft reste draft quelle que soit la date",
    DATES,
    (d) =>
      resolvePersistStatus("draft", d) === "draft" ||
      `date ${JSON.stringify(d)} → ${resolvePersistStatus("draft", d)}`
  )

  // Enregistrer deux fois de suite ne doit pas déplacer le statut : sans ça,
  // une sauvegarde automatique ferait dériver l'article à chaque passage.
  await t.each("resolvePersistStatus est idempotent", STATUTS, (s) => {
    for (const d of DATES) {
      const une = resolvePersistStatus(s, d)
      const deux = resolvePersistStatus(une, d)
      if (une !== deux) return `${s} + ${JSON.stringify(d)} : ${une} puis ${deux}`
    }
    return true
  })

  t.section("ce que le site public montre — isPubliclyVisible")

  t.eq("published → visible", isPubliclyVisible("published", HIER), true)
  // Volontaire : `published` est cru sur parole, sa date n'est plus consultée.
  // C'est cohérent uniquement parce que resolvePersistStatus est passé avant et
  // aurait déjà basculé en scheduled une date future.
  t.eq(
    "published + date future → visible quand même (la date n'est plus relue)",
    isPubliclyVisible("published", DEMAIN),
    true
  )

  t.eq(
    "scheduled + date passée → visible",
    isPubliclyVisible("scheduled", HIER),
    true
  )
  t.eq(
    "scheduled + aujourd'hui → visible",
    isPubliclyVisible("scheduled", AUJOURDHUI),
    true
  )
  // Le cas qui protège l'embargo.
  t.eq(
    "scheduled + date future → masqué",
    isPubliclyVisible("scheduled", DEMAIN),
    false
  )
  t.eq(
    "scheduled + horodatage futur → masqué",
    isPubliclyVisible("scheduled", DEMAIN_HORODATE),
    false
  )
  // Sans date, un programmé n'a pas d'échéance : le module choisit de masquer
  // plutôt que de publier. C'est le bon sens de l'erreur pour un cabinet.
  t.eq(
    "scheduled SANS date → masqué",
    isPubliclyVisible("scheduled", undefined),
    false
  )
  t.eq(
    "scheduled avec date vide → masqué",
    isPubliclyVisible("scheduled", ""),
    false
  )

  await t.each(
    "draft n'est jamais visible, quelle que soit la date",
    DATES,
    (d) =>
      isPubliclyVisible("draft", d) === false ||
      `date ${JSON.stringify(d)} → visible`
  )
  await t.each(
    "archived n'est jamais visible, quelle que soit la date",
    DATES,
    (d) =>
      isPubliclyVisible("archived", d) === false ||
      `date ${JSON.stringify(d)} → visible`
  )

  t.section("les deux vues ensemble")

  // Épinglé parce que c'est une asymétrie réelle, pas un oubli de la garde :
  // un « programmé » sans date est persisté en published (donc visible), alors
  // que le même couple lu directement est masqué. La visibilité dépend donc de
  // savoir si resolvePersistStatus est passé — les deux réponses sont dans le
  // code, cette ligne les met côte à côte.
  t.eq(
    "scheduled sans date : persisté visible, lu masqué",
    [
      isPubliclyVisible(resolvePersistStatus("scheduled", undefined), undefined),
      isPubliclyVisible("scheduled", undefined),
    ],
    [true, false]
  )

  // Ce qui part en base doit toujours se relire : un statut persisté que
  // isPubliclyVisible ne saurait pas classer serait un article fantôme.
  await t.each("tout statut persisté reste un statut connu", STATUTS, (s) => {
    for (const d of DATES) {
      const persiste = resolvePersistStatus(s, d)
      if (!isPostStatus(persiste)) return `${s} + ${JSON.stringify(d)} → ${persiste}`
    }
    return true
  })

  t.section("la date du jour — todayIsoDate")

  t.eq("longueur 10", AUJOURDHUI.length, 10)
  t.ok(
    "forme YYYY-MM-DD",
    /^\d{4}-\d{2}-\d{2}$/.test(AUJOURDHUI),
    () => `obtenu ${AUJOURDHUI}`
  )
  // Une date qui ne se relit pas casserait toutes les comparaisons ci-dessus,
  // qui sont des comparaisons de chaînes.
  t.ok(
    "se relit comme une vraie date",
    !Number.isNaN(Date.parse(`${AUJOURDHUI}T00:00:00Z`)),
    () => `impossible à relire : ${AUJOURDHUI}`
  )

  // Le jour est calculé en UTC ; le cabinet est à Paris (UTC+1 ou +2). Entre
  // minuit et 1h ou 2h du matin, heure de Paris, « aujourd'hui » au sens du
  // module est encore la veille : un article programmé pour aujourd'hui reste
  // masqué jusqu'à ce que l'UTC rattrape. On épingle la fenêtre au lieu de la
  // nier — affirmer l'égalité rendrait la garde rouge une heure par nuit.
  const jourParis = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const veilleDeParis = new Date(
    Date.parse(`${jourParis}T00:00:00Z`) - 86_400_000
  )
    .toISOString()
    .slice(0, 10)
  t.ok(
    "le jour UTC est celui de Paris, ou sa veille (jamais au-delà)",
    AUJOURDHUI === jourParis || AUJOURDHUI === veilleDeParis,
    () => `UTC ${AUJOURDHUI} · Paris ${jourParis}`
  )

  t.section("reconnaissance d'un statut — isPostStatus")

  await t.each(
    "les quatre statuts sont reconnus",
    STATUTS,
    (s) => isPostStatus(s) === true || `${s} refusé`
  )

  // Tout le reste doit être refusé : c'est ce qui empêche une valeur venue de
  // la base ou d'un formulaire de traverser le site sans être lue.
  const REFUSES = [
    null,
    undefined,
    "",
    " ",
    "publised", // la faute de frappe qui dépubliait en répondant 200
    "Published",
    "PUBLISHED",
    "publié",
    0,
    1,
    true,
    false,
    [],
    {},
    ["published"],
    { status: "published" },
  ]
  await t.each(
    "tout le reste est refusé",
    REFUSES,
    (v) => isPostStatus(v) === false || `${JSON.stringify(v) ?? String(v)} accepté`
  )

  t.section("libellés affichés — statusLabel")

  t.eq("draft", statusLabel("draft"), "Brouillon")
  t.eq("published", statusLabel("published"), "Publié")
  t.eq("scheduled", statusLabel("scheduled"), "Programmé")
  t.eq("archived", statusLabel("archived"), "Archivé")

  // Deux statuts qui porteraient le même libellé rendraient le menu de l'admin
  // ambigu sans qu'aucun test de valeur ne le voie.
  t.eq(
    "les quatre libellés sont distincts",
    new Set(STATUTS.map((s) => statusLabel(s))).size,
    4
  )
})

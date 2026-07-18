# Passation — 2026-07-18

_Pour Fable / prochain agent. Lis tout avant de coder._

---

## Pivot stratégique (matin 2026-07-18) — lire en premier

**Décision Nicolas :** stop priorité « copie fidèle / pixel-perfect ».  
L’UI sera polie **au fil de l’eau** (Nicolas + Cursor).

**Nouveau périmètre :** canalisations **contenu ↔ CMS / Supabase**.  
Ironie utile : le plan pixel listait déjà explicitement *« persistance admin (écritures Supabase) »* en **hors périmètre**. Ce trou devient **maintenant le périmètre**.

---

## Message prêt à coller (Nicolas → Fable)

> Salut Fable — pivot (Nicolas, 18/07 matin). Message technique, pas un « on change d’avis soft ».
>
> ### 1. Ce qu’on fait du plan « copie fidèle »
>
> **On garde le socle Phases 0–3** déjà dans `main` — c’est de l’or, on n’efface rien :
> - vérité terrain `contenu/reference/` + `scripts/visual/`
> - polices / `theme.wix.css`
> - harvest : `contenu/ricos/` ×422, FAQ, poles, `navigation.json`
> - renderer Ricos branché sur `/post/[slug]`
>
> **On stoppe Phases 4–6 pixel** comme chantier prioritaire :
> - Header = **figé** (`header-frozen-main` / `docs/05-decisions.md`) — tu ne le touches pas
> - Expertises = **hors pixel** (écarts volontaires déjà dans `deviations.json`)
> - Footer sur `claude/phase4-footer-convergence` (`4210322`) = **laisser en attente**, ne pas merger / ne pas enchaîner article@1440
> - Plus de boucle `diff.mjs` → fix → commit sur templates (CTA, FAQ, PostCard, blog, accueil « comme Wix »)
> - Phase 6 galerie d’acceptation = **pas démarrée, pas prioritaire**
>
> Rappel : dans **ton** plan original, la section *Hors périmètre* disait déjà :
> *« … persistance admin (écritures Supabase — MCP hors-org de toute façon) ; backends réels commentaires/notes … »*
> → Ce n’est plus hors périmètre. **C’est le chantier.**
>
> L’UI, Nicolas la reprendra au fil de l’eau. Le harnais pixel reste dans le repo pour plus tard si besoin — ce n’est plus le gate du projet.
>
> ### 2. État réel des canalisations (audit `main` + projet Supabase `Plouton`)
>
> Projet : `iofhcxwgqvorpmaexjwb` (eu-west-3). MCP org REWOLF = OK sur cette session.
>
> | Canal | Réalité |
> |-------|---------|
> | **Contenu public** (articles, Ricos, FAQ, expertises, pages, registry, redirects) | **100 % JSON git** via `content.ts` / `queries.ts` — **zéro** table Postgres contenu |
> | **Demandes** | Table `public.demandes` + RLS ON + **0 policy** + **0 rows**. Code : `store.ts` → `SupabaseStore` si env OK, sinon FsStore (refusé sur Vercel). `POST /api/contact` + `demande-intake.ts` OK. **E2E non prouvé.** |
> | **Storage** | Buckets `pieces-jointes` (privé) + `medias` (public) — **0 objet**, **0 policy storage** |
> | **PJ formulaire** | UX « joindre » ; le payload n’envoie souvent que les **noms** dans le message — bucket **jamais alimenté** |
> | **Admin** | POC `site/src/app/admin/` — **sans auth**. `SupabaseStore.saveArticle` **throw** (« table posts + auth à venir »). `/api/posts` = FS local |
> | **Mail** | Décision `accueil@…` — **zéro** branchement |
> | **App `admin/`** | Placeholder docs seulement |
>
> Donc : le site **lit** le monorepo ; Supabase n’est qu’un **tuyau Demandes semi-ouvert** (schéma + code, 0 trafic). Ce n’est pas un CMS.
>
> Pièges à ne pas reproduire :
> - Désalignement noms d’env (`SUPABASE_SECRET_KEY` vs legacy `SERVICE_ROLE` dans `site/.env.example`) → form 503
> - Ne pas confondre projet MCP `cooked` et `Plouton`
> - Ne pas migrer les 422 posts en premier
> - CSV contacts = PII, jamais commit
> - Advisor : `rls_auto_enable` WARN à traiter avant ouverture large
>
> ### 3. Nouveau plan — « canalisations » (Phases C0–C5)
>
> Critères **exécutables**, comme ton plan pixel — mais data.
>
> **C0 — Tuyau Demandes prouvé**  
> Aligner env Vercel ↔ `store.ts`. 1 insert Preview/Prod → `select count(*) from demandes >= 1` avec UTM / cooked / page_source. Done = form vert, pas de 503.
>
> **C1 — Pièces jointes réelles**  
> Multipart → bucket `pieces-jointes` → `demandes.fichiers[]`. Policies storage. Done = objet Storage + row non vide + download signé.
>
> **C2 — Auth + boîte Demandes**  
> Supabase Auth (avocats + Nicolas). Policies `authenticated` select/update. UI liste/détail/statut/notes (candidatures). Done = anon 401 ; Alexia change un statut ; PJ téléchargeables.
>
> **C3 — Mail + historique**  
> Alerte → `accueil@jplouton-avocat.fr` à chaque insert. Import CSV one-shot hors git. Done = mail test reçu ; N rows historiques ; CSV jamais au repo.
>
> **C4 — Canal blog (écriture)**  
> Migration `posts` (+ cat/tags min). Seed depuis `contenu/articles/` **sans changer les slugs**. `saveArticle` DB ; dual-run OK (public peut encore lire JSON au début). Done = 422 rows ; slug sample inchangé ; draft DB sans redeploy git.
>
> **C5 — Publish live + médias**  
> Publish = status + cache/ISR ; covers → `medias`. Admin brouillon→publier. Done = nouvel article sur `/post/{slug}` **sans commit** ; cover Storage.
>
> FAQ / expertises / pages structurantes = **après** C0–C5 Demandes+blog (même pattern, pas bloquant cutover si Demandes + blog CMS OK).
>
> ### 4. Contraintes produit inchangées
>
> - Slugs `/post/...` **intouchables**
> - Une FAQ unifiée ; registry pôles = vérité menu/objets form
> - Peu de gabarits, beaucoup de données (`AGENTS.md`, `docs/09-architecture-site.md`)
> - Cible admin : `admin.jplouton-avocat.fr` — V1 = **Demandes + Blog**
> - Ne pas inventer un type de page sans maj `09`
>
> ### 5. Reprise
>
> Worktree/branche **frais depuis `main`** (HEAD inclut pages légales PR #5).  
> Anciens worktrees pixel = archive.  
> Docs : `docs/14-etat.md` · ce fichier · `docs/11-stack-technique.md` · `base/LIRE-MOI.md` · `docs/15-audit-sante.md`.
>
> Quand tu repartes : **C0 en premier** (prouver 1 row `demandes`), pas un schema posts.
>
> ### Addendum soir — C0–C4
>
> C0–C3 mergés (PR #7). **C4 MVP** livré (`feat/canalisations-c4`) : table `posts`, seed 422,
> `saveArticle` DB, dual-run public JSON. Prochaine étape = **C5** (lecture publique DB + publish).

---

## Suite 2026-07-18 (midi) — reprise Cursor après Fable

- Branche `claude/canalisations-c0` rebasée sur `main` → **PR #7**
- **C0–C2** livrés dans la PR ; **C3** ajouté sur la même branche :
  - Resend (`notify-demande.ts`) → `accueil@jplouton-avocat.fr` (best-effort)
  - Import CSV 752 rows exécuté (statut `Archivé`)
- Nicolas : URL Auth + `NEXT_PUBLIC_SITE_ORIGIN` + clé Resend + merge PR
- Prochaine priorité agent : **C4** (posts DB) après merge

---

## Contexte soir précédent (mémoire)

Deux rails : fidélité Wix (Fable) + UX/archi Cursor sur `main`.  
Header figé. Phase 4–6 pixel = **pause**.

### Artefacts pixel à conserver (ne pas régénérer)

- `contenu/reference/`, `scripts/visual/`, ricos ×422, fonts Wix, renderer
- Footer branche `claude/phase4-footer-convergence` — en attente

### Carte après pivot

| Rail | Statut |
|------|--------|
| Pixel Phases 0–3 | **Dans `main` — garder** |
| Pixel Phases 4–6 | **Pause** |
| UX polish | Au fil de l’eau |
| Canalisations C0–C5 | **Priorité** |
| Header | Figé |

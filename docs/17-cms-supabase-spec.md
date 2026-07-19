# 17 — Spec : peupler le CMS Supabase & débrancher les `.json`

_Rédigé le 2026-07-19. Spec d'implémentation (Claude audite/spécifie → Cursor/Grok applique)._
Projet Supabase : `iofhcxwgqvorpmaexjwb`. ⚠️ Dernière migration existante : `0005_posts_admin_statuses.sql`. Style : voir [`0003_posts.sql`](../supabase/migrations/0003_posts.sql).

> ⚠️ **Avant de coder** (rappel `site/AGENTS.md`) : ce Next.js est non-standard, lire `node_modules/next/dist/docs/` pour les Server Components async, `cache()`/`revalidateTag`, avant d'écrire la couche de lecture.

---

## 0. État actuel (le manque)

| Bloc | Collection | Aujourd'hui | En base ? |
|---|---|---|---|
| BLOG | Articles | `posts` | ✅ 422 |
| FORMULAIRES | Contact | `demandes` | ✅ 756 |
| FAQ | 15 fichiers, 246 items | `contenu/faq/*.json` | ❌ |
| MEMBRES | Équipe (6) | `contenu/equipe.json` | ❌ |
| AUTRES | Expertises (15) | `contenu/expertises/*.json` | ❌ |
| AUTRES | Catégories (17) | `contenu/categories.json` | ❌ |
| AUTRES | Auteurs (6) | `contenu/auteurs.json` | ❌ |
| AUTRES | Config/contact site | `contenu/site.json` | ❌ |
| AUTRES | Accueil + 12 pages | `contenu/pages/*.json` | ❌ |
| AUTRES | Navigation, cards/héros, affaires curées | `contenu/*.json` | ❌ |

**Couplage** : seule la voie blog parle à la DB (`queries.ts` + `posts-db.ts`). Tout le reste lit les fichiers au build via `content.ts` (`fs.readFileSync`).

---

## 1. Principes — profiter de la sortie de Wix (ne pas porter les contorsions Wix)

Wix imposait des contraintes qu'on **ne reproduit pas** :

1. **Une seule table `faq`**, pas les 3 collections versionnées Wix (`FAQ`, `FAQ V2`, `FAQ Divorce`). Discriminée par `expertise_key`.
2. **`categories.postCount` n'est PAS stocké** → calculé en live depuis `posts` (vue SQL). Corrige les compteurs périmés (« Défense des élus : 0 post », etc.).
3. **`view_count` : une seule source** = `posts.view_count`, **après** réconciliation `GREATEST(db, stats-posts)`. Puis archive du JSON hors runtime. ❌ Ne pas écraser la DB avec un snapshot plus bas.
4. **Équipe = une seule source** (`equipe.json` / composant), pas la double collection Wix `Membres` + `Équipe`. Reste du contenu de page (hors DB) — voir périmètre révisé.
5. **Contenu éditable en DB, config structurelle en fichiers.** Tout n'a pas vocation à être « CMS » : `navigation.json`, `redirects.json` et l'identité technique (`url`, `siren`, `cabinetId`) restent des fichiers de build. Ce qui est **éditable par le cabinet** (FAQ, équipe, expertises, catégories, textes de pages, coordonnées, rating) va en DB. → évite de rendre `getSite` async partout (voir §4).
6. **(Phase 2) Un seul format de corps d'article** : migrer `ricos`/`bodyHtml`/`string[]` → Editor.js et supprimer la triple-cascade de fallback. Gros chantier séparé, hors de cette spec.

### Périmètre RÉVISÉ (2026-07-19, avec Nicolas)

Principe retenu : **une collection devient une table DB seulement si son contenu est transverse / réutilisé / vraiment édité.** Le contenu **propre à une seule page** reste sur sa page (hard-codé dans le composant ou fichier co-localisé) — pas de table CMS.

**➡️ En base (CMS) :**
| Table | Statut |
|---|---|
| `posts` (blog) | ✅ fait |
| `demandes` (formulaires) | ✅ fait |
| `faq` | 🆕 à créer — unifie la collection FAQ ; **FAQ V2 + FAQ Divorce abandonnées** (doublons Wix) |
| `categories` | 🆕 à créer (taxonomie blog, transverse) |
| `authors` | 🆕 à créer (signatures blog, transverse) |
| `content_singletons` → clé `contact` | 🆕 à créer (coordonnées éditables tél/adresse/horaires/rating) |

**➡️ HORS base — contenu de page (hard-codé / fichier sur la page concernée), NON migré :**
`expertises` (les 15 pages), équipe/membres, blocs mono-page (accidents-de-la-vie-courante, compétences cabinet, exemples-affaires), accueil, pages légales, hubs de pôle, cards/héros expertises, affaires curées, `navigation.json`, `redirects.json`, identité technique de `site.json`.

→ Conséquence : les tables `expertises` et `team_members` du §2 et les singletons de page **ne sont PAS créées** (barrées ci-dessous). Seuls `faq`, `categories`, `authors` + le singleton `contact` sont en périmètre.

---

## 2. Schéma cible — 4 migrations

Style : `create table if not exists`, RLS activée, policies `authenticated` select/insert/update, `revoke delete`+anon, trigger `touch`, `set search_path=''`. On factorise le trigger.

### `0006_cms_shared.sql` — trigger partagé + vue compteurs
```sql
-- Trigger générique db_updated_at (réutilisé par toutes les tables CMS)
create or replace function public.touch_db_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.db_updated_at := now(); return new; end; $$;
revoke all on function public.touch_db_updated_at() from public, anon, authenticated;

-- Compteur d'articles publiés par catégorie (remplace categories.postCount stocké)
create or replace view public.category_post_counts as
  select unnest(categories) as category_label, count(*)::int as post_count
  from public.posts where status = 'published' group by 1;
```

### `0007_post_versions.sql` — snapshots admin (blog #18 P0-F)
> **Pris** le 2026-07-19. Instantanés avant chaque PUT admin (`post_versions`).

### `0008_authors.sql` (+ categories si besoin) — taxonomie blog
> Remplace l’ancien numéro `0007_cms_taxonomie` (décalé car `0006` = FAQ, `0007` = post_versions).  
> ~~`team_members`~~ **HORS PÉRIMÈTRE** (décision 2026-07-19) : l'équipe reste du contenu de page (hard-codé sur accueil + notre-cabinet, ou `equipe.json`).
```sql
create table if not exists public.authors (
  id text primary key,                 -- auteurs.json .id (conserver)
  wix_id text,                         -- posts.author = ce GUID
  display_name text not null,
  short_name text not null default '',
  avatar text,
  bio text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);
create index if not exists authors_wix_id_idx on public.authors(wix_id) where wix_id is not null;

create table if not exists public.categories (
  id text primary key,                 -- categories.json .id
  label text not null,
  slug text not null,
  description text not null default '',
  meta_title text, meta_description text, cover_image text,
  language text not null default 'fr',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug)
);
-- NB : pas de colonne post_count → vue category_post_counts (0005).
```

### `0006_faq.sql` — faq (déjà appliqué)
> Numéro réel en prod : **`0006_faq.sql`**. L’ancien libellé `0008_cms_faq` ci-dessous est historique.
```sql
create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  expertise_key text not null,         -- slug d'expertise (fichier faq/<key>.json)
  question text not null,
  answer text not null,
  sous_expertise text,
  position integer not null default 0,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);
create index if not exists faq_expertise_idx on public.faq(expertise_key, position);
```
> Seed depuis `faq/*.json` (246 items). `expertise_key` = nom de fichier. **FAQ V2 / FAQ Divorce non reprises.**

> ~~`expertises`~~ **HORS PÉRIMÈTRE** (décision 2026-07-19) : les 15 pages d'expertises restent du contenu de page (fichiers `contenu/expertises/*.json` ou hard-codé), pas de table DB.

### `0009_cms_singletons.sql` — coordonnées éditables (contact)
```sql
create table if not exists public.content_singletons (
  key text primary key,                -- ici : uniquement 'contact' (extensible plus tard)
  kind text not null default 'block',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);
```
**Une seule row en périmètre : `contact`** — coordonnées éditables extraites de `site.json` : `phone`, `email`, `address`, `hours`, `rating`, `googleReviewsUrl`.
Restent des **fichiers** (non migrés) : `navigation.json`, `redirects.json`, l'identité technique de `site.json` (`url`, `name`, `legalName`, `siren`, `siret`, `vatNumber`, `cabinetId`, `founderId`), et ~~`accueil`/`page:*`/`expertises-cards`/`affaires-recentes`~~ (contenu de page, hors périmètre).

### Bloc RLS (à répéter pour chaque table en périmètre : `authors`, `categories`, `faq`, `content_singletons`)
```sql
alter table public.<T> enable row level security;
create policy "avocats lisent <T>" on public.<T> for select to authenticated using (true);
create policy "avocats écrivent <T>" on public.<T> for insert to authenticated with check (true);
create policy "avocats maj <T>" on public.<T> for update to authenticated using (true) with check (true);
revoke all on public.<T> from anon;
revoke delete on public.<T> from authenticated;
grant select, insert, update on public.<T> to authenticated;
drop trigger if exists <T>_touch on public.<T>;
create trigger <T>_touch before update on public.<T> for each row execute function public.touch_db_updated_at();
```
Lecture publique = via `SUPABASE_SECRET_KEY` serveur (pas de policy anon), **exactement comme les posts** (C5).

---

## 3. Seed — depuis les JSON existants (idempotent, upsert)

Un script par collection sur le modèle de [`scripts/seed-posts.py`](../scripts/seed-posts.py) (upsert PostgREST, creds `site/.env.local`, `--dry-run`/`--limit`). Ou un `scripts/seed-cms.py` unique.

| Table | Source JSON | Mapping notable |
|---|---|---|
| `authors` | `auteurs.json` (6) | `wixId→wix_id`, `displayName→display_name`, `shortName→short_name` ; `position` = ordre du tableau |
| `categories` | `categories.json` (17) | ignorer `postCount` (vue) et `url` (dérivable de slug) |
| `faq` | `faq/*.json` (15 fichiers, 246 items) | `expertise_key` = nom de fichier sans `.json` ; `sousExpertise→sous_expertise` ; `position` = ordre |
| `content_singletons` (`contact`) | extrait de `site.json` | `key='contact'`, `data = {phone, email, address, hours, rating, googleReviewsUrl}` |

_(team_members, expertises et les singletons de page : hors périmètre, pas de seed.)_

Seed **idempotent** : `on conflict (<pk>) do update`. À rejouer sans risque.

---

## 4. Débrancher les `.json` — couche de lecture DB∪JSON

Modèle : `posts-db.ts` (client secret + mapping + read async) → fallback `content.ts` (JSON). Extraire d'abord le helper `secretClient()` de `posts-db.ts` dans un `src/lib/supabase-server.ts` partagé.

**Nouveaux modules** (additifs, zéro conflit avec Grok) : `src/lib/faq-db.ts`, `authors-db.ts`, `categories-db.ts`, `contact-db.ts`. Chacun : `select` par la clé secrète, cache Next par tag (`faq`, `authors`, `categories`, `contact`), retourne `null` si pas de Supabase → l'appelant retombe sur le getter JSON.

**Getters `content.ts` à passer en DB∪JSON** (périmètre révisé — rester rétro-compatible : la signature JSON reste le fallback) :

| Getter (`content.ts:ligne`) | Consommé par | Bascule |
|---|---|---|
| `getFaq` (375) via `faqForExpertise` (`queries.ts:152`) | pages expertises | `faq-db` puis JSON |
| `listAuthors`/`getAuthor` (381/385) | /post (1) | `authors-db` puis JSON |
| `getCategories`/`categorySlug` (412/406) | blog, /post, hubs (4+2) | `categories-db` + vue `category_post_counts` |
| `getContact()` **(nouveau)** | footer, header, contact | `contact-db('contact')` puis fallback `getSite().phone/address/...` |

_Restent en JSON/inline (hors périmètre) : `getEquipe`, `getExpertise`/`listExpertises`, `getAccueil`, `getLegalPage`/`getContentPage`, `getExpertiseCards`._

**`getSite` (244) ne bouge pas** : reste **synchrone** (identité technique) dans ses 13 consommateurs. Seules les coordonnées éditables sortent vers `getContact()` async (`singletons('contact')`) → aucun des 13 fichiers `getSite` n'a à devenir async.

**Bonus câblage** : dans `queries.ts`, `postViewCounts()` lit `stats-posts.json` → le remplacer par `posts.view_count` (fix « 0 vue » /nos-affaires) et supprimer `stats-posts.json`.

---

## 5. Phasage recommandé (incrémental, vérifiable)

1. **Migrations réelles** : `0005` posts statuses · `0006` faq · `0007` post_versions · **`0008` authors** (+ categories) · `0009` singleton contact.  
   ⚠️ Ne pas appliquer `docs/17` « vues à l’envers » : réconcilier `view_count` DB ← max(`stats-posts.json`), puis supprimer le JSON.
2. **Seed** depuis les JSON (`--dry-run` puis réel). Comptes attendus : `authors ~5 (sans Simonini), categories 17, faq ~281, content_singletons 1 (contact)`.
3. **Débrancher une collection à la fois** : FAQ → auteurs → catégories → contact. Vérif page après chaque : rendu **identique** au JSON/Wix (audit expertises existant comme baseline).
4. **Fix `view_count`** (lire `posts.view_count`, retirer `stats-posts.json`).
5. Une fois la DB validée en prod, **supprimer les 3 JSON migrés** (`faq/`, `categories.json`, `auteurs.json`). On **garde** `equipe.json`, `expertises/`, `pages/`, `navigation.json`, `redirects.json`, `site.json` (contenu de page / config).
6. (Plus tard) Phase 2 corps Editor.js.

## 6. Coordination Grok & vérif
- **Additifs (moi/data ops, sans conflit)** : les 4 migrations, les scripts de seed, les nouveaux `*-db.ts`.
- **À sérialiser avec Grok (fichiers partagés)** : `content.ts`, `queries.ts` et les pages appelantes — ne pas les éditer en même temps que les correctifs d'audit front. Faire les bascules §4 quand Grok ne touche pas `src/lib/`.
- **Vérif** : `npm run build` vert après chaque bascule + `curl localhost:3000/<page>` comparé à la référence Wix. La DB étant prioritaire, tester aussi le fallback (renommer temporairement une clé env → doit retomber sur JSON sans casser).

## 7. Décisions (tranchées le 2026-07-19 avec Nicolas)
- ✅ **Périmètre resserré** : seules les collections **transverses / réutilisées / vraiment éditées** vont en base → `faq`, `categories`, `authors`, singleton `contact` (+ blog & demandes déjà faits). Le **contenu mono-page** (expertises, équipe, blocs page-spécifiques, accueil, légales, hubs) reste **hard-codé / fichier sur sa page**, pas en DB.
- ✅ **FAQ V2 / FAQ Divorce** : abandonnées (doublons Wix). Une seule table `faq`.
- ✅ **Catégories + Auteurs** : en base (taxonomie & signatures blog = transverses).
- ✅ **Coordonnées éditables** : OUI — tél/email/adresse/horaires/rating → singleton `contact`. Identité technique (`url`, `siren`, `cabinetId`…) reste dans `site.json` ; `getSite` reste sync.
- ✅ **Navigation** : reste un **fichier de dev** (`navigation.json`). Pas d'éditeur de menus admin.
- ✅ **FAQ ↔ expertise** : liaison **unique par `faq.expertise_key`** ; `faqExpertise` déprécié (vérifié : `== slug` sur 15/15).
- ⏭️ **Admin (édition)** : écrans `/admin` FAQ / catégories / auteurs = chantier UI séparé, à cadrer après.

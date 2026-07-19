-- P1-D — Taxonomie categories + comptage live (brief #18 §2.2).
-- « Défense des élus » (0 article) volontairement absente du seed.
-- Appliquer après 0008_authors_body_doc.sql.

create table if not exists public.categories (
  id text primary key,
  label text not null unique,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  meta_title text,
  meta_description text,
  cover_image text,
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);

comment on table public.categories is
  'Référentiel blog. postCount figé JSON remplacé par la vue category_post_counts.';

create or replace view public.category_post_counts as
select
  c.id,
  c.slug,
  c.label,
  count(p.slug) filter (where p.status = 'published') as post_count
from public.categories c
left join public.posts p on c.id = any (p.category_ids)
group by c.id, c.slug, c.label;

comment on view public.category_post_counts is
  'Comptage live : published posts dont category_ids contient c.id.';

alter table public.categories enable row level security;

drop policy if exists "avocats lisent categories" on public.categories;
create policy "avocats lisent categories"
  on public.categories for select to authenticated using (true);

drop policy if exists "avocats ecrivent categories" on public.categories;
create policy "avocats ecrivent categories"
  on public.categories for insert to authenticated with check (true);

drop policy if exists "avocats maj categories" on public.categories;
create policy "avocats maj categories"
  on public.categories for update to authenticated using (true) with check (true);

revoke all on public.categories from anon;
revoke delete on public.categories from authenticated;
grant select, insert, update on public.categories to authenticated;
grant select on public.category_post_counts to authenticated;

-- Seed (hors Défense des élus — 0 article / soft 404).
-- sort_order = rang historique par volume.
insert into public.categories (id, label, slug, description, sort_order, meta_title, meta_description)
values
  ('6798d1194011366b8aea5eec', 'Droit pénal', 'droit-pénal',
   'Actualité droit pénal : procès, audiences, jugements.', 10,
   'Nos affaires | Droit pénal',
   'Suivez l’actualité du droit pénal avec le Cabinet Julien Plouton.'),
  ('6798cf3b003803362e6d9def', 'Victimes de délits ou crimes', 'indemnisation-des-victimes-pénale',
   'Indemnisation des victimes d’infractions pénales.', 20,
   'Nos affaires | Victimes de délits ou crimes',
   'Indemnisation des victimes : analyses et expertises.'),
  ('6798c1004011366b8aea5e19', 'Procès criminels', 'droit-criminel',
   'Droit criminel et procès devant les cours d’assises.', 30,
   'Nos affaires | Procès criminels',
   'Procès criminels : expertise nationale Cabinet Plouton.'),
  ('67992c684011366b8aea630b', 'Médias', 'médias',
   'Affaires relayées par la presse écrite et audiovisuelle.', 40,
   'Médias & Presse — Interventions Cabinet Plouton',
   'Interventions médiatiques du Cabinet Plouton.'),
  ('67db2299545b100e876895bd', 'Ressources et notions juridiques', 'ressources-et-notions-juridiques',
   'Notions juridiques accessibles.', 50,
   'Nos affaires | Ressources et notions juridiques',
   'Ressources et notions juridiques.'),
  ('6798c9ac003803362e6d9dce', 'Trafic de stupéfiants', 'trafic-de-stupéfiants',
   'Défense trafic de stupéfiants.', 60,
   'Nos affaires | Trafic de stupéfiants',
   'Trafic de stupéfiants : actualités et défenses.'),
  ('6798cb76003803362e6d9dd6', 'Violences conjugales et féminicides', 'violences-conjugales-féminicides',
   'Violences conjugales, féminicides, protection.', 70,
   'Nos affaires | Violences conjugales et féminicides',
   'Violences conjugales et féminicides : analyses.'),
  ('6798cd80003803362e6d9de4', 'Défense des consommateurs', 'défense-des-consommateurs',
   'Droit de la consommation.', 80,
   'Nos affaires | Défense des consommateurs',
   'Défense des consommateurs à Bordeaux.'),
  ('6798ceb9003803362e6d9de9', 'Droit pénal des affaires', 'droit-pénal-des-affaires',
   'Droit pénal des affaires.', 90,
   'Nos affaires | Droit pénal des affaires',
   'Droit pénal des affaires : procès et analyses.'),
  ('6798ccd3003803362e6d9de3', 'Accidents de la route', 'accidents-de-la-route',
   'Indemnisation accidents de la route.', 100,
   'Nos affaires | Accidents de la route',
   'Accidents de la route : indemnisation des victimes.'),
  ('6798cf634011366b8aea5eb7', 'Droit et accidents du travail', 'droit-et-accidents-du-travail',
   'Accidents du travail et contentieux sociaux.', 110,
   'Nos affaires | Droit et accidents du travail',
   'Accidents du travail : analyses et indemnisation.'),
  ('6798cd544011366b8aea5e9d', 'Accidents et erreurs médicales', 'accidents-erreurs-médicales',
   'Droit médical et erreurs médicales.', 120,
   'Nos affaires | Accidents et erreurs médicales',
   'Erreurs médicales et indemnisation.'),
  ('6798d1ff003803362e6d9e1a', 'Droit de la famille', 'droit-de-la-famille',
   'Droit de la famille.', 130,
   'Nos affaires | Droit de la famille',
   'Droit de la famille : divorce, garde, partage.'),
  ('6798d14a003803362e6d9e15', 'Accidents de la vie courante', 'accidents-de-la-vie-courante',
   'Accidents de la vie courante.', 140,
   'Nos affaires | Accidents de la vie courante',
   'Accidents de la vie courante : indemnisation.'),
  ('6798d23a003803362e6d9e1f', 'Droit des assurances', 'droit-des-assurances',
   'Droit des assurances.', 150,
   'Nos affaires | Droit des assurances',
   'Droit des assurances : sinistres et litiges.'),
  ('69dfa8a26cb8859997f8d413', 'Divorce', 'divorce',
   'Divorces amiables ou contentieux.', 160,
   'Nos affaires | Divorce',
   'Affaires de divorce traitées par le cabinet.')
on conflict (id) do update set
  label = excluded.label,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  db_updated_at = now();

-- Vues : posts.view_count = GREATEST(actuel, snapshot Wix) — à appliquer
-- via scripts/reconcile-view-counts.mjs (lit contenu/stats-posts.json).
-- Après reconcile réussi, withViews / stats-posts.json peuvent disparaître.
